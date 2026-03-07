import { createFileRoute } from "@tanstack/react-router";
import { env } from "~/env.js";
import { stripe } from "~/lib/stripe.js";
import { db } from "~/db/index.js";
import {
  subscriptions,
  payments,
  members,
  user,
} from "~/db/schema.js";
import { eq } from "drizzle-orm";
import {
  sendPaymentReceivedEmail,
  sendPaymentFailedEmail,
} from "~/lib/notifications.js";
import type Stripe from "stripe";

async function handleWebhook(request: Request): Promise<Response> {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return new Response("Missing signature", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      env.STRIPE_WEBHOOK_SECRET,
    );
  } catch {
    return new Response("Webhook signature verification failed", {
      status: 400,
    });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
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
      break;
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;
      const parentSub = invoice.parent?.subscription_details?.subscription;
      const stripeSubId =
        typeof parentSub === "string"
          ? parentSub
          : parentSub?.id ?? null;

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
