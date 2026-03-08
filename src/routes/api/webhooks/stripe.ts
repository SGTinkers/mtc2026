import { createFileRoute } from "@tanstack/react-router";
import { env } from "~/env.js";
import { stripe } from "~/lib/stripe.js";
import { db } from "~/db/index.js";
import {
  subscriptions,
  payments,
  members,
  user,
  plans,
  auditLog,
} from "~/db/schema.js";
import { eq, and, ne } from "drizzle-orm";
import {
  sendPaymentReceivedEmail,
  sendPaymentFailedEmail,
  sendWelcomePaymentEmail,
  sendWelcomeBackPaymentEmail,
} from "~/lib/notifications.js";
import { auth } from "~/lib/auth.js";
import type Stripe from "stripe";

// TODO: SECURITY - Re-enable Stripe webhook signature verification!
// Currently disabled because:
// 1. vinxi/http's getEvent()/readRawBody() crashes in production (globalThis.app undefined)
// 2. request.text() from TanStack Start's server.handlers may return a re-serialized body
//    that doesn't match Stripe's signature
// Possible fixes:
// - Move webhook to a Nitro server route (server/routes/) for direct h3 event access
// - Use TanStack Start's getH3Event() from @tanstack/start-server-core and h3-v2's readRawBody
// - Upgrade TanStack Start / Nitro when they fix raw body access in server.handlers
async function handleWebhook(request: Request): Promise<Response> {
  const body = await request.text();

  if (!body) {
    return new Response("Missing body", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = JSON.parse(body) as Stripe.Event;
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;

      if (session.metadata?.source === "donate") {
        // Donate flow: create user + member + subscription
        const email =
          session.customer_details?.email ?? session.customer_email;
        const name =
          session.customer_details?.name ?? email?.split("@")[0] ?? "Member";
        const planId = session.metadata.plan_id;
        const monthlyAmount = session.metadata.monthly_amount;

        console.log("[Webhook] Donate checkout completed", { email, name, planId, monthlyAmount });

        if (!email || !planId || !monthlyAmount) {
          console.error("[Webhook] Missing required fields", { email, planId, monthlyAmount });
          break;
        }

        try {
          // Check if user already exists
          const [existingUser] = await db
            .select()
            .from(user)
            .where(eq(user.email, email));

          let userId: string;

          if (existingUser) {
            console.log("[Webhook] User already exists", existingUser.id);
            userId = existingUser.id;
          } else {
            const newUser = await auth.api.signUpEmail({
              body: { name, email, password: crypto.randomUUID() },
            });
            if (!newUser?.user) {
              console.error("[Webhook] Failed to create user");
              break;
            }
            console.log("[Webhook] Created user", newUser.user.id);
            userId = newUser.user.id;
          }

          // Check if already a member
          const [existingMember] = await db
            .select()
            .from(members)
            .where(eq(members.userId, userId));

          const memberId = existingMember
            ? existingMember.id
            : (
                await db
                  .insert(members)
                  .values({ userId, createdBy: null })
                  .returning()
              )[0]!.id;

          console.log("[Webhook] Member ID", memberId);

          const isExistingMember = !!existingMember;

          // Cancel existing subscriptions before creating new one
          if (isExistingMember) {
            const existingSubs = await db
              .select()
              .from(subscriptions)
              .where(
                and(
                  eq(subscriptions.memberId, memberId),
                  ne(subscriptions.status, "cancelled"),
                ),
              );

            for (const sub of existingSubs) {
              if (sub.stripeSubscriptionId) {
                try {
                  await stripe.subscriptions.cancel(sub.stripeSubscriptionId);
                  console.log("[Webhook] Cancelled Stripe subscription", sub.stripeSubscriptionId);
                } catch (e) {
                  console.warn("[Webhook] Failed to cancel Stripe subscription (may already be cancelled)", sub.stripeSubscriptionId, e);
                }
              }

              await db
                .update(subscriptions)
                .set({
                  status: "cancelled",
                  cancelledAt: new Date(),
                  updatedAt: new Date(),
                })
                .where(eq(subscriptions.id, sub.id));

              await db.insert(auditLog).values({
                entityType: "subscription",
                entityId: sub.id,
                action: "cancelled_for_resubscription",
                newValue: { reason: "new_donation_checkout" },
                performedBy: userId,
              });
            }
          }

          // Create subscription
          const today = new Date().toISOString().split("T")[0]!;
          const nextMonth = new Date();
          nextMonth.setMonth(nextMonth.getMonth() + 1);

          await db.insert(subscriptions).values({
            memberId,
            planId,
            monthlyAmount,
            status: "active",
            paymentMethod: "stripe",
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: session.subscription as string,
            coverageStart: today,
            coverageUntil: nextMonth.toISOString().split("T")[0]!,
          });

          console.log("[Webhook] Subscription created");

          // Send consolidated email (welcome+payment or welcome-back+payment)
          try {
            const [plan] = await db
              .select({ name: plans.name })
              .from(plans)
              .where(eq(plans.id, planId));
            const planName = plan?.name ?? "Skim Pintar";
            const coverageEndDate = nextMonth.toLocaleDateString("en-MY", {
              day: "numeric",
              month: "long",
              year: "numeric",
            });

            if (isExistingMember) {
              await sendWelcomeBackPaymentEmail(
                email,
                monthlyAmount,
                planName,
                coverageEndDate,
              );
              console.log("[Webhook] Welcome-back payment email sent");
            } else {
              await sendWelcomePaymentEmail(
                email,
                name,
                monthlyAmount,
                planName,
                coverageEndDate,
                `${env.BETTER_AUTH_URL}/member/login`,
              );
              console.log("[Webhook] Welcome payment email sent");
            }
          } catch (e) {
            console.error("[Webhook] Failed to send consolidated email", e);
          }

          // Audit log
          await db.insert(auditLog).values({
            entityType: "member",
            entityId: memberId,
            action: isExistingMember ? "resubscribed" : "self_registered",
            newValue: { name, email, planId, source: "stripe_donate" },
            performedBy: userId,
          });
        } catch (e) {
          console.error("[Webhook] Donate flow error", e);
        }
      } else {
        // Existing flow: update subscription for already-registered member
        const subId = session.metadata?.subscription_id;
        if (subId) {
          const today = new Date();
          const nextMonth = new Date(today);
          nextMonth.setMonth(nextMonth.getMonth() + 1);

          await db
            .update(subscriptions)
            .set({
              status: "active",
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: session.subscription as string,
              paymentMethod: "stripe",
              coverageUntil: nextMonth.toISOString().split("T")[0]!,
              updatedAt: new Date(),
            })
            .where(eq(subscriptions.id, subId));
        }
      }
      break;
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;
      const parentSub = invoice.parent?.subscription_details?.subscription;
      const stripeSubId =
        typeof parentSub === "string"
          ? parentSub
          : parentSub?.id ?? null;

      // Skip initial subscription invoice — checkout.session.completed handles it
      if (invoice.billing_reason === "subscription_create") {
        console.log("[Webhook] Skipping initial subscription invoice (handled by checkout.session.completed)");
        break;
      }

      // Skip $0 proration invoices (from plan changes mid-cycle)
      if (invoice.amount_paid === 0) {
        console.log("[Webhook] Skipping $0 invoice", invoice.id, invoice.billing_reason);
        break;
      }

      if (stripeSubId) {
        const [sub] = await db
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.stripeSubscriptionId, stripeSubId));

        if (sub) {
          await db.insert(payments).values({
            subscriptionId: sub.id,
            amount: (invoice.amount_paid / 100).toFixed(2),
            method: "stripe",
            stripeInvoiceId: invoice.id,
            periodMonth: new Date().toISOString().split("T")[0]!,
          });

          const currentEnd = new Date(sub.coverageUntil);
          const now = new Date();
          const baseDate = currentEnd > now ? currentEnd : now;
          baseDate.setMonth(baseDate.getMonth() + 1);

          await db
            .update(subscriptions)
            .set({
              coverageUntil: baseDate.toISOString().split("T")[0]!,
              status: "active",
              graceUntil: null,
              updatedAt: new Date(),
            })
            .where(eq(subscriptions.id, sub.id));

          try {
            const [member] = await db
              .select({ email: user.email })
              .from(members)
              .innerJoin(user, eq(members.userId, user.id))
              .where(eq(members.id, sub.memberId));
            if (member) {
              await sendPaymentReceivedEmail(
                member.email,
                (invoice.amount_paid / 100).toFixed(2),
                "Stripe",
                new Date().toLocaleDateString(),
              );
            }
          } catch {
            // Don't fail webhook on email error
          }
        }
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const parentSubFailed = invoice.parent?.subscription_details?.subscription;
      const stripeSubId =
        typeof parentSubFailed === "string"
          ? parentSubFailed
          : parentSubFailed?.id ?? null;

      if (stripeSubId) {
        const [sub] = await db
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.stripeSubscriptionId, stripeSubId));

        if (sub) {
          await db.insert(payments).values({
            subscriptionId: sub.id,
            amount: (invoice.amount_due / 100).toFixed(2),
            method: "stripe",
            stripeInvoiceId: invoice.id,
            status: "failed",
            periodMonth: new Date().toISOString().split("T")[0],
          });

          try {
            const [member] = await db
              .select({ email: user.email })
              .from(members)
              .innerJoin(user, eq(members.userId, user.id))
              .where(eq(members.id, sub.memberId));
            if (member) {
              const attempt = invoice.attempt_count ?? 1;
              await sendPaymentFailedEmail(member.email, attempt);
            }
          } catch {
            // Don't fail webhook on email error
          }
        }
      }
      break;
    }

    case "customer.subscription.deleted": {
      const stripeSub = event.data.object as Stripe.Subscription;
      await db
        .update(subscriptions)
        .set({
          status: "cancelled",
          cancelledAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.stripeSubscriptionId, stripeSub.id));
      break;
    }
  }

  return new Response("ok", { status: 200 });
}

export const Route = createFileRoute("/api/webhooks/stripe")({
  server: {
    handlers: {
      POST: ({ request }) => handleWebhook(request),
    },
  },
});
