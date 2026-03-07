import { z } from "zod";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { db } from "~/db/index.js";
import {
  members,
  plans,
  subscriptions,
  dependants,
  payments,
  user,
  auditLog,
} from "~/db/schema.js";
import { eq, desc, sql, and, lt, count } from "drizzle-orm";
import { auth } from "./auth.js";
import { stripe } from "./stripe.js";
import { sendWelcomeEmail, sendPaymentReceivedEmail } from "./notifications.js";
import { env } from "~/env.js";

// ─── Auth helpers ───

async function getSession() {
  const request = getRequest();
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) throw new Error("Unauthorized");
  return session;
}

async function requireAdminSession() {
  const session = await getSession();
  if (session.user.role !== "admin") throw new Error("Admin access required");
  return session;
}

// ─── Dashboard stats ───

export const getAdminStats = createServerFn({ method: "GET" }).handler(
  async () => {
    await requireAdminSession();

    const [memberCount] = await db
      .select({ count: count() })
      .from(members);
    const [activeSubs] = await db
      .select({ count: count() })
      .from(subscriptions)
      .where(eq(subscriptions.status, "active"));
    const [totalRevenue] = await db
      .select({ total: sql<string>`coalesce(sum(${payments.amount}), 0)` })
      .from(payments);
    const [pendingPayments] = await db
      .select({ count: count() })
      .from(subscriptions)
      .where(eq(subscriptions.status, "pending_payment"));

    const [mrrData] = await db
      .select({ mrr: sql<string>`coalesce(sum(${subscriptions.monthlyAmount}), 0)` })
      .from(subscriptions)
      .where(eq(subscriptions.status, "active"));

    // Calculate donations for current month
    // Donation is any payment amount that exceeds the plan's min_amount
    const currentMonthStart = new Date();
    currentMonthStart.setDate(1);
    currentMonthStart.setHours(0, 0, 0, 0);

    const [donationsData] = await db
      .select({
        totalDonations: sql<string>`coalesce(sum(${payments.amount} - ${plans.minAmount}), 0)`
      })
      .from(payments)
      .innerJoin(subscriptions, eq(payments.subscriptionId, subscriptions.id))
      .innerJoin(plans, eq(subscriptions.planId, plans.id))
      .where(
        and(
          sql`${payments.createdAt} >= ${currentMonthStart.toISOString()}`,
          sql`${payments.amount} > ${plans.minAmount}`
        )
      );

    // Membership per plan breakdown
    const planBreakdown = await db
      .select({
        planName: plans.name,
        count: count(),
      })
      .from(subscriptions)
      .innerJoin(plans, eq(subscriptions.planId, plans.id))
      .where(eq(subscriptions.status, "active"))
      .groupBy(plans.name);

    // Yearly revenue by month (last 12 months)
    const elevenMonthsAgo = new Date();
    elevenMonthsAgo.setMonth(elevenMonthsAgo.getMonth() - 11);
    elevenMonthsAgo.setDate(1);
    elevenMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyRevenue = await db
      .select({
        month: sql<string>`to_char(${payments.createdAt}, 'Mon YYYY')`,
        monthSort: sql<string>`to_char(${payments.createdAt}, 'YYYY-MM')`,
        revenue: sql<string>`coalesce(sum(${payments.amount}), 0)`
      })
      .from(payments)
      .where(sql`${payments.createdAt} >= ${elevenMonthsAgo.toISOString()}`)
      .groupBy(sql`to_char(${payments.createdAt}, 'Mon YYYY')`, sql`to_char(${payments.createdAt}, 'YYYY-MM')`)
      .orderBy(sql`to_char(${payments.createdAt}, 'YYYY-MM')`);

    // Payment methods breakdown
    const paymentMethods = await db
      .select({
        method: payments.method,
        count: count()
      })
      .from(payments)
      .groupBy(payments.method);

    return {
      totalMembers: memberCount!.count,
      activeSubscriptions: activeSubs!.count,
      totalRevenue: totalRevenue!.total,
      pendingPayments: pendingPayments!.count,
      mrr: mrrData!.mrr,
      donationsThisMonth: donationsData!.totalDonations,
      planBreakdown,
      monthlyRevenue: monthlyRevenue.map(m => ({ 
        month: m.month, 
        revenue: Number(m.revenue) 
      })),
      paymentMethods
    };
  },
);

// ─── Plans ───

export const getPlans = createServerFn({ method: "GET" }).handler(async () => {
  return db.select().from(plans).where(eq(plans.active, true));
});

// ─── Members ───

export const getMembers = createServerFn({ method: "GET" }).handler(
  async () => {
    await requireAdminSession();

    const latestSub = db
      .selectDistinctOn([subscriptions.memberId], {
        memberId: subscriptions.memberId,
        status: subscriptions.status,
        monthlyAmount: subscriptions.monthlyAmount,
        planId: subscriptions.planId,
      })
      .from(subscriptions)
      .orderBy(subscriptions.memberId, desc(subscriptions.createdAt))
      .as("latest_sub");

    const result = await db
      .select({
        id: members.id,
        userId: members.userId,
        nric: members.nric,
        address: members.address,
        createdAt: members.createdAt,
        userName: user.name,
        userEmail: user.email,
        userPhone: user.phoneNumber,
        subStatus: latestSub.status,
        planName: plans.name,
        monthlyAmount: latestSub.monthlyAmount,
      })
      .from(members)
      .leftJoin(user, eq(members.userId, user.id))
      .leftJoin(latestSub, eq(latestSub.memberId, members.id))
      .leftJoin(plans, eq(latestSub.planId, plans.id))
      .orderBy(desc(members.createdAt));

    return result;
  },
);

export const getMemberDetail = createServerFn({ method: "GET" })
  .inputValidator((id: string) => id)
  .handler(async ({ data: memberId }) => {
    await requireAdminSession();

    const [member] = await db
      .select({
        id: members.id,
        userId: members.userId,
        nric: members.nric,
        address: members.address,
        createdAt: members.createdAt,
        userName: user.name,
        userEmail: user.email,
        userPhone: user.phoneNumber,
      })
      .from(members)
      .innerJoin(user, eq(members.userId, user.id))
      .where(eq(members.id, memberId));

    if (!member) throw new Error("Member not found");

    const subs = await db
      .select({
        id: subscriptions.id,
        status: subscriptions.status,
        monthlyAmount: subscriptions.monthlyAmount,
        paymentMethod: subscriptions.paymentMethod,
        coverageStart: subscriptions.coverageStart,
        coverageUntil: subscriptions.coverageUntil,
        graceUntil: subscriptions.graceUntil,
        planName: plans.name,
        planSlug: plans.slug,
      })
      .from(subscriptions)
      .innerJoin(plans, eq(subscriptions.planId, plans.id))
      .where(eq(subscriptions.memberId, memberId))
      .orderBy(desc(subscriptions.createdAt));

    const sub = subs[0];
    let deps: typeof dependants.$inferSelect[] = [];
    let paymentHistory: (typeof payments.$inferSelect)[] = [];

    if (sub) {
      deps = await db
        .select()
        .from(dependants)
        .where(eq(dependants.subscriptionId, sub.id));

      paymentHistory = await db
        .select()
        .from(payments)
        .where(eq(payments.subscriptionId, sub.id))
        .orderBy(desc(payments.createdAt));
    }

    return { member, subscription: sub ?? null, dependants: deps, payments: paymentHistory };
  });

// ─── Register member (admin walk-in) ───

export const registerMember = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      name: string;
      email: string;
      phone?: string;
      nric?: string;
      address?: string;
      monthlyAmount: string;
    }) => data,
  )
  .handler(async ({ data }) => {
    const session = await requireAdminSession();

    // Resolve plan from amount — pick the highest-tier plan the amount qualifies for
    const allPlans = await db
      .select()
      .from(plans)
      .where(eq(plans.active, true))
      .orderBy(desc(plans.minAmount));

    const amount = Number(data.monthlyAmount);
    const matchedPlan = allPlans.find((p) => amount >= Number(p.minAmount));
    if (!matchedPlan) {
      throw new Error(
        `Minimum monthly amount is $${allPlans[allPlans.length - 1]?.minAmount}`,
      );
    }

    // Create user via better-auth
    const newUser = await auth.api.signUpEmail({
      body: {
        name: data.name,
        email: data.email,
        password: crypto.randomUUID(), // random password, member uses magic link
      },
    });

    if (!newUser?.user) throw new Error("Failed to create user");

    // Update phone number if provided
    if (data.phone) {
      await db
        .update(user)
        .set({ phoneNumber: data.phone })
        .where(eq(user.id, newUser.user.id));
    }

    // Create member record
    const [member] = await db
      .insert(members)
      .values({
        userId: newUser.user.id,
        nric: data.nric || null,
        address: data.address || null,
        createdBy: session.user.id,
      })
      .returning();

    // Create subscription
    const today = new Date().toISOString().split("T")[0]!;
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const coverageUntil = nextMonth.toISOString().split("T")[0]!;

    await db.insert(subscriptions).values({
      memberId: member!.id,
      planId: matchedPlan.id,
      monthlyAmount: data.monthlyAmount,
      status: "pending_payment",
      paymentMethod: "manual",
      coverageStart: today,
      coverageUntil: coverageUntil,
    });

    // Send welcome email
    try {
      await sendWelcomeEmail(data.email, data.name);
    } catch {
      // Don't fail registration if email fails
    }

    // Audit log
    await db.insert(auditLog).values({
      entityType: "member",
      entityId: member!.id,
      action: "registered",
      newValue: { name: data.name, email: data.email, plan: matchedPlan.slug },
      performedBy: session.user.id,
    });

    return member;
  });

// ─── Record payment (admin) ───

export const recordPayment = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      subscriptionId: string;
      amount: string;
      method: "giro" | "cash" | "bank_transfer" | "paynow";
      reference?: string;
      periodMonth?: string;
    }) => data,
  )
  .handler(async ({ data }) => {
    const session = await requireAdminSession();

    const [payment] = await db
      .insert(payments)
      .values({
        subscriptionId: data.subscriptionId,
        amount: data.amount,
        method: data.method,
        reference: data.reference || null,
        periodMonth: data.periodMonth || null,
        recordedBy: session.user.id,
      })
      .returning();

    // Extend coverage
    const [sub] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, data.subscriptionId));

    if (sub) {
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
        .where(eq(subscriptions.id, data.subscriptionId));

      // Send payment received email
      try {
        const [member] = await db
          .select({ email: user.email })
          .from(members)
          .innerJoin(user, eq(members.userId, user.id))
          .where(eq(members.id, sub.memberId));
        if (member) {
          await sendPaymentReceivedEmail(
            member.email,
            data.amount,
            data.method,
            data.periodMonth || "current month",
          );
        }
      } catch {
        // Don't fail if email fails
      }
    }

    // Audit log
    await db.insert(auditLog).values({
      entityType: "payment",
      entityId: payment!.id,
      action: "recorded",
      newValue: data,
      performedBy: session.user.id,
    });

    return payment;
  });

// ─── Get all payments (admin) ───

export const getAllPayments = createServerFn({ method: "GET" }).handler(
  async () => {
    await requireAdminSession();

    return db
      .select({
        id: payments.id,
        amount: payments.amount,
        method: payments.method,
        reference: payments.reference,
        periodMonth: payments.periodMonth,
        createdAt: payments.createdAt,
        memberName: user.name,
        memberEmail: user.email,
      })
      .from(payments)
      .innerJoin(subscriptions, eq(payments.subscriptionId, subscriptions.id))
      .innerJoin(members, eq(subscriptions.memberId, members.id))
      .innerJoin(user, eq(members.userId, user.id))
      .orderBy(desc(payments.createdAt));
  },
);

// ─── Get subscriptions for payment dropdown ───

export const getSubscriptionsForPayment = createServerFn({
  method: "GET",
}).handler(async () => {
  await requireAdminSession();

  return db
    .select({
      subscriptionId: subscriptions.id,
      memberId: members.id,
      memberName: user.name,
      memberEmail: user.email,
      monthlyAmount: subscriptions.monthlyAmount,
      status: subscriptions.status,
    })
    .from(subscriptions)
    .innerJoin(members, eq(subscriptions.memberId, members.id))
    .innerJoin(user, eq(members.userId, user.id))
    .orderBy(user.name);
});

// ─── Member portal server fns ───

export const getMemberDashboard = createServerFn({ method: "GET" }).handler(
  async () => {
    const session = await getSession();

    const [memberRow] = await db
      .select({
        id: members.id,
        userId: members.userId,
        nric: members.nric,
        address: members.address,
        phone: user.phoneNumber,
        email: user.email,
        name: user.name,
      })
      .from(members)
      .innerJoin(user, eq(members.userId, user.id))
      .where(eq(members.userId, session.user.id));

    if (!memberRow) return null;

    const [sub] = await db
      .select({
        id: subscriptions.id,
        status: subscriptions.status,
        monthlyAmount: subscriptions.monthlyAmount,
        paymentMethod: subscriptions.paymentMethod,
        coverageStart: subscriptions.coverageStart,
        coverageUntil: subscriptions.coverageUntil,
        graceUntil: subscriptions.graceUntil,
        planName: plans.name,
        planSlug: plans.slug,
        courseDiscount: plans.courseDiscount,
        maxDependants: plans.maxDependants,
      })
      .from(subscriptions)
      .innerJoin(plans, eq(subscriptions.planId, plans.id))
      .where(eq(subscriptions.memberId, memberRow.id))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);

    return { member: memberRow, subscription: sub ?? null };
  },
);

export const getMemberSubscriptions = createServerFn({
  method: "GET",
}).handler(async () => {
  const session = await getSession();

  const [member] = await db
    .select({ id: members.id })
    .from(members)
    .where(eq(members.userId, session.user.id));

  if (!member) return [];

  return db
    .select({
      id: subscriptions.id,
      status: subscriptions.status,
      monthlyAmount: subscriptions.monthlyAmount,
      paymentMethod: subscriptions.paymentMethod,
      coverageStart: subscriptions.coverageStart,
      coverageUntil: subscriptions.coverageUntil,
      graceUntil: subscriptions.graceUntil,
      createdAt: subscriptions.createdAt,
      planName: plans.name,
      planSlug: plans.slug,
      courseDiscount: plans.courseDiscount,
      maxDependants: plans.maxDependants,
    })
    .from(subscriptions)
    .innerJoin(plans, eq(subscriptions.planId, plans.id))
    .where(eq(subscriptions.memberId, member.id))
    .orderBy(desc(subscriptions.createdAt));
});

export const getMemberPayments = createServerFn({ method: "GET" }).handler(
  async () => {
    const session = await getSession();

    const [member] = await db
      .select()
      .from(members)
      .where(eq(members.userId, session.user.id));

    if (!member) return [];

    const subIds = await db
      .select({ id: subscriptions.id })
      .from(subscriptions)
      .where(eq(subscriptions.memberId, member.id));

    if (subIds.length === 0) return [];

    return db
      .select()
      .from(payments)
      .where(eq(payments.subscriptionId, subIds[0]!.id))
      .orderBy(desc(payments.createdAt));
  },
);

export const getMemberDependants = createServerFn({ method: "GET" }).handler(
  async () => {
    const session = await getSession();

    const [member] = await db
      .select()
      .from(members)
      .where(eq(members.userId, session.user.id));

    if (!member) return { dependants: [], canAdd: false, subscriptionId: null };

    const [sub] = await db
      .select({
        id: subscriptions.id,
        planSlug: plans.slug,
        maxDependants: plans.maxDependants,
      })
      .from(subscriptions)
      .innerJoin(plans, eq(subscriptions.planId, plans.id))
      .where(eq(subscriptions.memberId, member.id))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);

    if (!sub) return { dependants: [], canAdd: false, subscriptionId: null };

    const deps = await db
      .select()
      .from(dependants)
      .where(eq(dependants.subscriptionId, sub.id));

    const canAdd =
      sub.planSlug === "pintar_plus" &&
      (sub.maxDependants === null || deps.length < (sub.maxDependants ?? 0));

    return { dependants: deps, canAdd, subscriptionId: sub.id };
  },
);

export const addDependant = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      subscriptionId: string;
      name: string;
      nric: string;
      phone?: string;
      relationship: "spouse" | "child" | "parent" | "in_law" | "sibling";
      sameAddress: boolean;
    }) => data,
  )
  .handler(async ({ data }) => {
    const session = await getSession();

    // Verify the subscription belongs to this user and plan allows dependants
    const [sub] = await db
      .select({
        id: subscriptions.id,
        maxDependants: plans.maxDependants,
        planSlug: plans.slug,
      })
      .from(subscriptions)
      .innerJoin(plans, eq(subscriptions.planId, plans.id))
      .innerJoin(members, eq(subscriptions.memberId, members.id))
      .where(
        and(
          eq(subscriptions.id, data.subscriptionId),
          eq(members.userId, session.user.id),
        ),
      );

    if (!sub || sub.planSlug !== "pintar_plus") {
      throw new Error("Your plan does not support dependants");
    }

    if (sub.maxDependants !== null) {
      const existing = await db
        .select({ count: count() })
        .from(dependants)
        .where(eq(dependants.subscriptionId, sub.id));
      if (existing[0].count >= sub.maxDependants) {
        throw new Error("Maximum number of dependants reached");
      }
    }

    const [dep] = await db
      .insert(dependants)
      .values({
        subscriptionId: data.subscriptionId,
        name: data.name,
        nric: data.nric,
        phone: data.phone || null,
        relationship: data.relationship,
        sameAddress: data.sameAddress,
      })
      .returning();

    return dep;
  });

export const removeDependant = createServerFn({ method: "POST" })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => {
    await getSession();
    await db.delete(dependants).where(eq(dependants.id, id));
    return { success: true };
  });

export const updateMemberProfile = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      name: z.string().min(1).optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const session = await getSession();

    if (data.name !== undefined || data.phone !== undefined) {
      const userUpdates: Record<string, string> = {};
      if (data.name !== undefined) userUpdates.name = data.name;
      if (data.phone !== undefined) userUpdates.phoneNumber = data.phone;
      await db
        .update(user)
        .set(userUpdates)
        .where(eq(user.id, session.user.id));
    }

    if (data.address !== undefined) {
      await db
        .update(members)
        .set({ address: data.address })
        .where(eq(members.userId, session.user.id));
    }

    return { success: true };
  });

// ─── Donate checkout (no auth required) ───

export const createDonateCheckout = createServerFn({ method: "POST" })
  .inputValidator((data: { monthlyAmount: number }) => data)
  .handler(async ({ data }) => {
    const planSlug = data.monthlyAmount >= 20 ? "pintar_plus" : "pintar";
    const [plan] = await db
      .select()
      .from(plans)
      .where(eq(plans.slug, planSlug));

    if (!plan) throw new Error("Plan not found");

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price_data: {
            currency: "sgd",
            product_data: { name: `Skim Pintar – ${plan.name}` },
            unit_amount: data.monthlyAmount * 100,
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
      ],
      metadata: {
        source: "donate",
        plan_id: plan.id,
        monthly_amount: String(data.monthlyAmount),
      },
      success_url: `${env.BETTER_AUTH_URL}/donate?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.BETTER_AUTH_URL}/donate`,
    });

    return { url: checkoutSession.url };
  });

// ─── Donate checkout info (no auth required) ───

export const getCheckoutSubscriptionInfo = createServerFn({ method: "GET" })
  .inputValidator((data: { sessionId: string }) => data)
  .handler(async ({ data }) => {
    try {
      const checkoutSession = await stripe.checkout.sessions.retrieve(
        data.sessionId,
      );

      const stripeSubId = checkoutSession.subscription as string | null;
      if (!stripeSubId) return null;

      const [result] = await db
        .select({
          planName: plans.name,
          planSlug: plans.slug,
          monthlyAmount: subscriptions.monthlyAmount,
          coverageStart: subscriptions.coverageStart,
          coverageUntil: subscriptions.coverageUntil,
          courseDiscount: plans.courseDiscount,
          maxDependants: plans.maxDependants,
        })
        .from(subscriptions)
        .innerJoin(plans, eq(subscriptions.planId, plans.id))
        .where(eq(subscriptions.stripeSubscriptionId, stripeSubId));

      return result ?? null;
    } catch {
      return null;
    }
  });

// ─── Stripe checkout ───

export const createCheckoutSession = createServerFn({ method: "POST" })
  .inputValidator(
    (data: { subscriptionId: string; monthlyAmount: string }) => data,
  )
  .handler(async ({ data }) => {
    const session = await getSession();

    const [sub] = await db
      .select({
        id: subscriptions.id,
        memberId: subscriptions.memberId,
        email: user.email,
      })
      .from(subscriptions)
      .innerJoin(members, eq(subscriptions.memberId, members.id))
      .innerJoin(user, eq(members.userId, user.id))
      .where(eq(subscriptions.id, data.subscriptionId));

    if (!sub) throw new Error("Subscription not found");

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: sub.email,
      line_items: [
        {
          price_data: {
            currency: "sgd",
            product_data: {
              name: "Skim Pintar Subscription",
            },
            unit_amount: Math.round(Number(data.monthlyAmount) * 100),
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
      ],
      metadata: {
        subscription_id: sub.id,
      },
      success_url: `${env.BETTER_AUTH_URL}/member/subscription?success=1`,
      cancel_url: `${env.BETTER_AUTH_URL}/member/subscription`,
    });

    return { url: checkoutSession.url };
  });

export const createBillingPortalSession = createServerFn({
  method: "POST",
}).handler(async () => {
  const session = await getSession();

  const [sub] = await db
    .select()
    .from(subscriptions)
    .innerJoin(members, eq(subscriptions.memberId, members.id))
    .where(eq(members.userId, session.user.id));

  if (!sub?.subscriptions.stripeCustomerId) {
    throw new Error("No Stripe customer found");
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: sub.subscriptions.stripeCustomerId,
    return_url: `${env.BETTER_AUTH_URL}/member/subscription`,
  });

  return { url: portalSession.url };
});
