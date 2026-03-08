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
import { eq, desc, sql, and, or, count, gte, lte, ilike, inArray } from "drizzle-orm";
import { auth } from "./auth.js";
import { stripe } from "./stripe.js";
import { sendWelcomeEmail, sendPaymentReceivedEmail, sendGiroApprovedEmail } from "./notifications.js";
import { env } from "~/env.js";
import { queryMembersWithLatestSub, searchMembers as searchMembersRepo } from "./members.repo.js";

import Anthropic from "@anthropic-ai/sdk";

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

    // Members with pending/failed payments
    const pendingMembers = await db
      .select({
        memberId: members.id,
        memberName: user.name,
        memberEmail: user.email,
        status: subscriptions.status,
        monthlyAmount: subscriptions.monthlyAmount,
        planName: plans.name,
        coverageUntil: subscriptions.coverageUntil,
      })
      .from(subscriptions)
      .innerJoin(members, eq(subscriptions.memberId, members.id))
      .innerJoin(user, eq(members.userId, user.id))
      .innerJoin(plans, eq(subscriptions.planId, plans.id))
      .where(
        or(
          eq(subscriptions.status, "pending_payment"),
          eq(subscriptions.status, "pending_approval"),
          eq(subscriptions.status, "grace"),
        )
      )
      .orderBy(subscriptions.coverageUntil);

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
      paymentMethods,
      pendingMembers,
    };
  },
);

// ─── Admins ───

export const getAdmins = createServerFn({ method: "GET" }).handler(
  async () => {
    await requireAdminSession();
    return db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      })
      .from(user)
      .where(eq(user.role, "admin"))
      .orderBy(desc(user.createdAt));
  },
);

export const createAdmin = createServerFn({ method: "POST" })
  .inputValidator(
    (data: { name: string; email: string; password: string }) => data,
  )
  .handler(async ({ data }) => {
    await requireAdminSession();

    const newUser = await auth.api.signUpEmail({
      body: { email: data.email, password: data.password, name: data.name },
    });

    if (!newUser?.user) throw new Error("Failed to create user");

    await db
      .update(user)
      .set({ role: "admin" })
      .where(eq(user.id, newUser.user.id));

    return newUser.user;
  });

export const updateAdminProfile = createServerFn({ method: "POST" })
  .inputValidator((data: { name: string; email: string }) => data)
  .handler(async ({ data }) => {
    const session = await requireAdminSession();
    await db
      .update(user)
      .set({ name: data.name, email: data.email })
      .where(eq(user.id, session.user.id));
    return { success: true };
  });

// ─── Plans ───

export const getPlans = createServerFn({ method: "GET" }).handler(async () => {
  return db.select().from(plans).where(eq(plans.active, true));
});

// ─── Members ───

export const getMembers = createServerFn({ method: "GET" }).handler(
  async () => {
    await requireAdminSession();
    return queryMembersWithLatestSub();
  },
);

export const searchMembersForPayment = createServerFn({ method: "GET" })
  .inputValidator((query: string) => query)
  .handler(async ({ data: query }) => {
    await requireAdminSession();
    return searchMembersRepo(query);
  });

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
        stripeSubscriptionId: subscriptions.stripeSubscriptionId,
        planName: plans.name,
        planSlug: plans.slug,
      })
      .from(subscriptions)
      .innerJoin(plans, eq(subscriptions.planId, plans.id))
      .where(eq(subscriptions.memberId, memberId))
      .orderBy(desc(subscriptions.createdAt));

    const sub = subs[0] ?? null;

    const deps = await db
      .select()
      .from(dependants)
      .where(eq(dependants.memberId, memberId));

    let paymentHistory: (typeof payments.$inferSelect)[] = [];
    if (subs.length > 0) {
      const allSubIds = subs.map(s => s.id);
      paymentHistory = await db
        .select()
        .from(payments)
        .where(inArray(payments.subscriptionId, allSubIds))
        .orderBy(desc(payments.createdAt));
    }

    return { member, subscription: sub, subscriptions: subs, dependants: deps, payments: paymentHistory };
  });

// ─── Register member (admin walk-in) ───

export const registerMember = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      name: string;
      email: string;
      phone?: string;
      nric?: string;
      dob?: string;
      address?: string;
      postalCode?: string;
      monthlyAmount: string;
      paymentMethod?: "cash" | "giro" | "bank_transfer" | "paynow";
      dependants?: Array<{
        name: string;
        nric?: string;
        dob?: string;
        phone?: string;
        relationship: "spouse" | "child" | "parent" | "in_law" | "sibling";
      }>;
      initialPayment?: { amount: string; reference?: string };
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
        dob: data.dob || null,
        address: data.address || null,
        postalCode: data.postalCode || null,
        createdBy: session.user.id,
      })
      .returning();

    // Determine subscription status
    const paymentMethod = data.paymentMethod || "cash";
    const isGiro = paymentMethod === "giro";
    const hasInitialPayment = data.initialPayment && Number(data.initialPayment.amount) > 0;

    let status: "pending_payment" | "pending_approval" | "active";
    if (isGiro) {
      status = "pending_approval";
    } else if (hasInitialPayment) {
      status = "active";
    } else {
      status = "pending_payment";
    }

    // Create subscription
    const today = new Date().toISOString().split("T")[0]!;
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const coverageUntil = nextMonth.toISOString().split("T")[0]!;

    const [subscription] = await db.insert(subscriptions).values({
      memberId: member!.id,
      planId: matchedPlan.id,
      monthlyAmount: data.monthlyAmount,
      status,
      paymentMethod: "manual",
      coverageStart: today,
      coverageUntil: status === "active" ? coverageUntil : today,
    }).returning();

    // Insert dependants if provided
    if (data.dependants && data.dependants.length > 0) {
      for (const dep of data.dependants) {
        await db.insert(dependants).values({
          memberId: member!.id,
          name: dep.name,
          nric: dep.nric || null,
          dob: dep.dob || null,
          phone: dep.phone || null,
          relationship: dep.relationship,
          sameAddress: true,
        });
      }
    }

    // Record initial payment if provided (non-GIRO only)
    if (hasInitialPayment && !isGiro && subscription) {
      await db.insert(payments).values({
        subscriptionId: subscription.id,
        amount: data.initialPayment!.amount,
        method: paymentMethod,
        reference: data.initialPayment!.reference || null,
        recordedBy: session.user.id,
      });
    }

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
      newValue: { name: data.name, email: data.email, plan: matchedPlan.slug, paymentMethod, status },
      performedBy: session.user.id,
    });

    return member;
  });

// ─── Approve GIRO subscription (admin) ───

export const approveGiroSubscription = createServerFn({ method: "POST" })
  .inputValidator((data: { subscriptionId: string }) => data)
  .handler(async ({ data }) => {
    const session = await requireAdminSession();

    const [sub] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, data.subscriptionId));

    if (!sub) throw new Error("Subscription not found");
    if (sub.status !== "pending_approval") throw new Error("Subscription is not pending approval");

    const today = new Date().toISOString().split("T")[0]!;
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const coverageUntil = nextMonth.toISOString().split("T")[0]!;

    await db
      .update(subscriptions)
      .set({
        status: "active",
        coverageStart: today,
        coverageUntil,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, data.subscriptionId));

    // Send GIRO approved email
    try {
      const [memberInfo] = await db
        .select({ email: user.email, name: user.name })
        .from(members)
        .innerJoin(user, eq(members.userId, user.id))
        .where(eq(members.id, sub.memberId));
      if (memberInfo) {
        await sendGiroApprovedEmail(memberInfo.email, memberInfo.name);
      }
    } catch {
      // Don't fail if email fails
    }

    // Audit log
    await db.insert(auditLog).values({
      entityType: "subscription",
      entityId: data.subscriptionId,
      action: "giro_approved",
      oldValue: { status: "pending_approval" },
      newValue: { status: "active" },
      performedBy: session.user.id,
    });

    return { success: true };
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
        periodMonth: data.periodMonth ? `${data.periodMonth}-01` : null,
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

// ─── Member portal server fns ───

export const getMemberDashboard = createServerFn({ method: "GET" }).handler(
  async () => {
    const session = await getSession();

    const [memberRow] = await db
      .select({
        id: members.id,
        userId: members.userId,
        nric: members.nric,
        dob: members.dob,
        address: members.address,
        postalCode: members.postalCode,
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
        stripeCustomerId: subscriptions.stripeCustomerId,
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

    // Get total contributions across all subscriptions
    const subIds = await db
      .select({ id: subscriptions.id })
      .from(subscriptions)
      .where(eq(subscriptions.memberId, memberRow.id));

    let totalContributions = "0";
    let paymentCount = 0;
    if (subIds.length > 0) {
      const [result] = await db
        .select({
          total: sql<string>`coalesce(sum(${payments.amount}), 0)`,
          count: count(),
        })
        .from(payments)
        .where(
          sql`${payments.subscriptionId} in ${sql.raw(`(${subIds.map((s) => `'${s.id}'`).join(",")})`)}`,
        );
      totalContributions = result?.total ?? "0";
      paymentCount = result?.count ?? 0;
    }

    return {
      member: memberRow,
      subscription: sub ?? null,
      totalContributions,
      paymentCount,
    };
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

  if (!member) return { subscriptions: [], totalContributed: "0" };

  const subs = await db
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

  const subIds = subs.map((s) => s.id);
  let totalContributed = "0";
  if (subIds.length > 0) {
    const [result] = await db
      .select({
        total: sql<string>`coalesce(sum(${payments.amount}), 0)`,
      })
      .from(payments)
      .where(sql`${payments.subscriptionId} in ${subIds}`);
    totalContributed = result?.total ?? "0";
  }

  return { subscriptions: subs, totalContributed };
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

    const ids = subIds.map((s) => s.id);
    return db
      .select()
      .from(payments)
      .where(sql`${payments.subscriptionId} in ${ids}`)
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

    if (!member) return { dependants: [], canAdd: false, memberId: null };

    const [sub] = await db
      .select({
        id: subscriptions.id,
        planSlug: plans.slug,
        maxDependants: plans.maxDependants,
        paymentMethod: subscriptions.paymentMethod,
        status: subscriptions.status,
        stripeSubscriptionId: subscriptions.stripeSubscriptionId,
      })
      .from(subscriptions)
      .innerJoin(plans, eq(subscriptions.planId, plans.id))
      .where(eq(subscriptions.memberId, member.id))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);

    const deps = await db
      .select()
      .from(dependants)
      .where(eq(dependants.memberId, member.id));

    const canAdd = sub
      ? sub.planSlug === "pintar_plus" &&
        (sub.maxDependants === null || deps.length < (sub.maxDependants ?? 0))
      : false;

    const canUpgrade = sub
      ? sub.status === "active" &&
        sub.planSlug !== "pintar_plus" &&
        sub.paymentMethod === "stripe" &&
        !!sub.stripeSubscriptionId
      : false;

    return { dependants: deps, canAdd, canUpgrade, memberId: member.id };
  },
);

export const addDependant = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      memberId: string;
      name: string;
      nric?: string;
      dob?: string;
      phone?: string;
      relationship: "spouse" | "child" | "parent" | "in_law" | "sibling";
      sameAddress?: boolean;
    }) => data,
  )
  .handler(async ({ data }) => {
    const session = await getSession();

    // Verify the member belongs to this user
    const [member] = await db
      .select({ id: members.id })
      .from(members)
      .where(
        and(
          eq(members.id, data.memberId),
          eq(members.userId, session.user.id),
        ),
      );

    if (!member) throw new Error("Member not found");

    // Check active subscription plan allows dependants
    const [sub] = await db
      .select({
        id: subscriptions.id,
        maxDependants: plans.maxDependants,
        planSlug: plans.slug,
      })
      .from(subscriptions)
      .innerJoin(plans, eq(subscriptions.planId, plans.id))
      .where(eq(subscriptions.memberId, member.id))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);

    if (!sub || sub.planSlug !== "pintar_plus") {
      throw new Error("Your plan does not support dependants");
    }

    if (sub.maxDependants !== null) {
      const existing = await db
        .select({ count: count() })
        .from(dependants)
        .where(eq(dependants.memberId, member.id));
      if (existing[0]!.count >= sub.maxDependants) {
        throw new Error("Maximum number of dependants reached");
      }
    }

    const [dep] = await db
      .insert(dependants)
      .values({
        memberId: data.memberId,
        name: data.name,
        nric: data.nric || null,
        dob: data.dob || null,
        phone: data.phone || null,
        relationship: data.relationship,
        sameAddress: data.sameAddress ?? true,
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
      nric: z.string().optional(),
      dob: z.string().optional(),
      address: z.string().optional(),
      postalCode: z.string().optional(),
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

    const hasMemberUpdate =
      data.nric !== undefined ||
      data.dob !== undefined ||
      data.address !== undefined ||
      data.postalCode !== undefined;

    if (hasMemberUpdate) {
      await db
        .update(members)
        .set({
          ...(data.nric !== undefined && { nric: data.nric }),
          ...(data.dob !== undefined && { dob: data.dob }),
          ...(data.address !== undefined && { address: data.address }),
          ...(data.postalCode !== undefined && { postalCode: data.postalCode }),
        })
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

export const getCheckoutSubscriptionInfo = createServerFn({ method: "POST" })
  .inputValidator((data: { sessionId: string }) => data)
  .handler(async ({ data }) => {
    try {
      const checkoutSession = await stripe.checkout.sessions.retrieve(
        data.sessionId,
      );

      if (checkoutSession.status === "expired") {
        return { failed: true as const };
      }

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
    } catch (error) {
      console.error("getCheckoutSubscriptionInfo error:", error);
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
      success_url: `${env.BETTER_AUTH_URL}/member?success=1`,
      cancel_url: `${env.BETTER_AUTH_URL}/member`,
    });

    return { url: checkoutSession.url };
  });

// ─── Update member profile (admin) ───

export const adminUpdateMemberProfile = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      memberId: string;
      name: string;
      email: string;
      phone: string;
      nric: string;
      address: string;
    }) => data,
  )
  .handler(async ({ data }) => {
    const session = await requireAdminSession();

    const [member] = await db
      .select()
      .from(members)
      .where(eq(members.id, data.memberId));
    if (!member) throw new Error("Member not found");

    await db
      .update(user)
      .set({ name: data.name, email: data.email, phoneNumber: data.phone || null })
      .where(eq(user.id, member.userId));

    await db
      .update(members)
      .set({ nric: data.nric || null, address: data.address || null })
      .where(eq(members.id, data.memberId));

    await db.insert(auditLog).values({
      entityType: "member",
      entityId: data.memberId,
      action: "profile_updated",
      newValue: { name: data.name, email: data.email, phone: data.phone, nric: data.nric, address: data.address },
      performedBy: session.user.id,
    });

    return { success: true };
  });

// ─── Cancel subscription (admin) ───

export const cancelSubscription = createServerFn({ method: "POST" })
  .inputValidator((data: { subscriptionId: string }) => data)
  .handler(async ({ data }) => {
    const session = await requireAdminSession();

    const [sub] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, data.subscriptionId));

    if (!sub) throw new Error("Subscription not found");
    if (sub.status === "cancelled") throw new Error("Already cancelled");

    if (sub.stripeSubscriptionId) {
      try {
        await stripe.subscriptions.cancel(sub.stripeSubscriptionId);
        // Webhook will handle DB update
      } catch (e: any) {
        if (e?.code === "resource_missing") {
          // Stripe subscription doesn't exist — update DB directly
          await db
            .update(subscriptions)
            .set({
              status: "cancelled",
              cancelledAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(subscriptions.id, data.subscriptionId));
        } else {
          throw e;
        }
      }
    } else {
      await db
        .update(subscriptions)
        .set({
          status: "cancelled",
          cancelledAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.id, data.subscriptionId));
    }

    await db.insert(auditLog).values({
      entityType: "subscription",
      entityId: data.subscriptionId,
      action: "cancelled",
      newValue: { status: "cancelled" },
      performedBy: session.user.id,
    });

    return { success: true };
  });

// ─── Update subscription (admin) ───

export const updateSubscription = createServerFn({ method: "POST" })
  .inputValidator((data: { subscriptionId: string; monthlyAmount: number }) => data)
  .handler(async ({ data }) => {
    const session = await requireAdminSession();

    const [sub] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, data.subscriptionId));

    if (!sub) throw new Error("Subscription not found");
    if (sub.status === "cancelled" || sub.status === "lapsed") {
      throw new Error("Cannot edit a cancelled or lapsed subscription");
    }
    if (sub.stripeSubscriptionId) {
      throw new Error("Cannot edit a Stripe-managed subscription. Use the Stripe dashboard instead.");
    }
    if (data.monthlyAmount < 5) {
      throw new Error("Minimum monthly amount is $5");
    }

    // Resolve plan from amount
    const allPlans = await db
      .select()
      .from(plans)
      .where(eq(plans.active, true))
      .orderBy(desc(plans.minAmount));

    const matchedPlan = allPlans.find((p) => data.monthlyAmount >= Number(p.minAmount));
    if (!matchedPlan) {
      throw new Error(`Minimum monthly amount is $${allPlans[allPlans.length - 1]?.minAmount}`);
    }

    const oldAmount = sub.monthlyAmount;
    const oldPlanId = sub.planId;

    await db
      .update(subscriptions)
      .set({
        planId: matchedPlan.id,
        monthlyAmount: data.monthlyAmount.toFixed(2),
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, data.subscriptionId));

    await db.insert(auditLog).values({
      entityType: "subscription",
      entityId: data.subscriptionId,
      action: "updated",
      oldValue: { monthlyAmount: oldAmount, planId: oldPlanId },
      newValue: { monthlyAmount: data.monthlyAmount.toFixed(2), planId: matchedPlan.id, planName: matchedPlan.name },
      performedBy: session.user.id,
    });

    return { success: true, planName: matchedPlan.name };
  });

// ─── Audit logs ───

export const searchUsersForAudit = createServerFn({ method: "GET" })
  .inputValidator((query: string) => query)
  .handler(async ({ data: query }) => {
    await requireAdminSession();
    const tokens = query.trim().split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return [];

    const conditions = tokens.map((token) => {
      const pattern = `%${token}%`;
      return or(ilike(user.name, pattern), ilike(user.email, pattern))!;
    });

    return db
      .select({ id: user.id, name: user.name, email: user.email })
      .from(user)
      .where(and(...conditions))
      .orderBy(user.name)
      .limit(20);
  });

export type AuditRow = {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  oldValue: Record<string, string> | null;
  newValue: Record<string, string> | null;
  performedBy: string;
  performerName: string | null;
  createdAt: Date;
};

export const getAuditLogs = createServerFn({ method: "GET" })
  .inputValidator(
    (data: {
      page?: number;
      pageSize?: number;
      entityType?: string; // comma-separated
      action?: string; // comma-separated
      user?: string;
      fromDate?: string;
      toDate?: string;
    }) => data,
  )
  .handler(async ({ data }) => {
    await requireAdminSession();
    const page = data.page ?? 1;
    const pageSize = data.pageSize ?? 20;
    const offset = (page - 1) * pageSize;

    const conditions = [];
    if (data.entityType) {
      const types = data.entityType.split(",");
      conditions.push(types.length === 1 ? eq(auditLog.entityType, types[0]!) : inArray(auditLog.entityType, types));
    }
    if (data.action) {
      const actions = data.action.split(",");
      conditions.push(actions.length === 1 ? eq(auditLog.action, actions[0]!) : inArray(auditLog.action, actions));
    }
    if (data.user) conditions.push(ilike(user.name, `%${data.user}%`));
    if (data.fromDate) conditions.push(gte(auditLog.createdAt, new Date(data.fromDate)));
    if (data.toDate) {
      const end = new Date(data.toDate);
      end.setHours(23, 59, 59, 999);
      conditions.push(lte(auditLog.createdAt, end));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [queryRows, totalResult] = await Promise.all([
      db
        .select({
          id: auditLog.id,
          entityType: auditLog.entityType,
          entityId: auditLog.entityId,
          action: auditLog.action,
          oldValue: auditLog.oldValue,
          newValue: auditLog.newValue,
          performedBy: auditLog.performedBy,
          performerName: user.name,
          createdAt: auditLog.createdAt,
        })
        .from(auditLog)
        .leftJoin(user, eq(auditLog.performedBy, user.id))
        .where(whereClause)
        .orderBy(desc(auditLog.createdAt))
        .limit(pageSize)
        .offset(offset),
      db
        .select({ total: count() })
        .from(auditLog)
        .leftJoin(user, eq(auditLog.performedBy, user.id))
        .where(whereClause),
    ]);
    const total = totalResult[0]?.total ?? 0;
    const rows = queryRows as AuditRow[];

    return { rows, total, page, pageSize };
  });

// ─── Extract form data from document image ───

export type ScannedFormData = {
  name?: string;
  email?: string;
  nric?: string;
  dob?: string;
  phone?: string;
  address?: string;
  postalCode?: string;
  monthlyAmount?: string;
  dependants?: Array<{
    name: string;
    nric?: string;
    dob?: string;
    phone?: string;
    relationship: string;
    sameAddress?: boolean;
    address?: string;
  }>;
};

export const extractFormFromImage = createServerFn({ method: "POST" })
  .inputValidator((data: { image: string; mediaType: string }) => data)
  .handler(async ({ data }): Promise<ScannedFormData> => {
    await getSession();

    if (!env.ANTHROPIC_API_KEY) {
      throw new Error("Document scanning is not configured");
    }

    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: data.mediaType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
                data: data.image,
              },
            },
            {
              type: "text",
              text: `Extract all information from this document. It may be a Singapore NRIC card, or a "PINTAR PLUS DEPENDENTS INFORMATION" form from Masjid Ar-Raudhah with these sections:

- MEMBERS DETAIL: Full Name, I/C No (NRIC), Date of Birth, Home Address, Postal Code, Contact No (H) and (Hp), Email
- Section A: Dependants at the same address — rows with Full Name (according to I/C), Date of Birth, Relationship (spouse, parent, in_law, child, sibling)
- Section B: Dependants NOT at the same address (parents & in-laws) — Full Name, Relationship, Address

Return a JSON object with only the fields you can confidently read from the handwriting/print:

{
  "name": "primary member full name",
  "email": "email address",
  "nric": "I/C number e.g. S1234567A",
  "dob": "date of birth in YYYY-MM-DD format",
  "phone": "phone number (Hp mobile preferred, otherwise H home)",
  "address": "home address",
  "postalCode": "postal code",
  "dependants": [
    {
      "name": "dependant full name as written",
      "dob": "dependant DOB in YYYY-MM-DD format if readable",
      "relationship": "one of: spouse, child, parent, in_law, sibling",
      "sameAddress": true
    }
  ]
}

For Section B dependants, set "sameAddress" to false and add an "address" field.
Only include fields you can confidently read. Omit empty/unreadable fields. Return ONLY valid JSON, no other text.`,
            },
          ],
        },
      ],
    });

    const text = response.content[0]?.type === "text" ? response.content[0].text : "";

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return {};
      const parsed = JSON.parse(jsonMatch[0]);

      const result: ScannedFormData = {};
      const stringFields = ["name", "email", "nric", "dob", "phone", "address", "postalCode", "monthlyAmount"] as const;
      for (const key of stringFields) {
        if (parsed[key] && typeof parsed[key] === "string") {
          result[key] = parsed[key];
        }
      }

      if (Array.isArray(parsed.dependants) && parsed.dependants.length > 0) {
        const validRelationships = ["spouse", "child", "parent", "in_law", "sibling"];
        result.dependants = parsed.dependants
          .filter((d: any) => d.name && typeof d.name === "string")
          .map((d: any) => ({
            name: d.name,
            ...(d.nric && typeof d.nric === "string" && { nric: d.nric }),
            ...(d.dob && typeof d.dob === "string" && { dob: d.dob }),
            ...(d.phone && typeof d.phone === "string" && { phone: d.phone }),
            relationship: validRelationships.includes(d.relationship) ? d.relationship : "spouse",
            sameAddress: d.sameAddress !== false,
            ...(d.address && typeof d.address === "string" && { address: d.address }),
          }));
      }

      return result;
    } catch {
      return {};
    }
  });

// ─── Update subscription amount (member self-service) ───

export const updateSubscriptionAmount = createServerFn({ method: "POST" })
  .inputValidator((data: { monthlyAmount: number }) => data)
  .handler(async ({ data }) => {
    const session = await getSession();

    if (data.monthlyAmount < 5) throw new Error("Minimum amount is $5");

    // Get member
    const [member] = await db
      .select({ id: members.id })
      .from(members)
      .where(eq(members.userId, session.user.id));
    if (!member) throw new Error("Member not found");

    // Get active subscription with Stripe ID
    const [sub] = await db
      .select({
        id: subscriptions.id,
        stripeSubscriptionId: subscriptions.stripeSubscriptionId,
        planId: subscriptions.planId,
        monthlyAmount: subscriptions.monthlyAmount,
        planSlug: plans.slug,
      })
      .from(subscriptions)
      .innerJoin(plans, eq(subscriptions.planId, plans.id))
      .where(
        and(
          eq(subscriptions.memberId, member.id),
          eq(subscriptions.status, "active"),
        ),
      )
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);

    if (!sub) throw new Error("No active subscription found");
    if (!sub.stripeSubscriptionId)
      throw new Error("Only Stripe subscriptions can be updated");

    // Determine new plan
    const newPlanSlug = data.monthlyAmount >= 20 ? "pintar_plus" : "pintar";

    // If downgrading from pintar_plus, check for dependants
    if (sub.planSlug === "pintar_plus" && newPlanSlug === "pintar") {
      const [depCount] = await db
        .select({ count: count() })
        .from(dependants)
        .where(eq(dependants.memberId, member.id));
      if (depCount && depCount.count > 0) {
        throw new Error(
          "Please remove all dependants before downgrading from Pintar Plus",
        );
      }
    }

    // Get new plan record
    const [newPlan] = await db
      .select()
      .from(plans)
      .where(eq(plans.slug, newPlanSlug));
    if (!newPlan) throw new Error("Plan not found");

    // Retrieve Stripe subscription to get subscription item ID
    const stripeSub = await stripe.subscriptions.retrieve(
      sub.stripeSubscriptionId,
    );
    const itemId = stripeSub.items.data[0]?.id;
    if (!itemId) throw new Error("Stripe subscription item not found");

    // Create a new price and update subscription
    const newPrice = await stripe.prices.create({
      currency: "sgd",
      unit_amount: data.monthlyAmount * 100,
      recurring: { interval: "month" },
      product_data: { name: `Skim Pintar – ${newPlan.name}` },
    });

    await stripe.subscriptions.update(sub.stripeSubscriptionId, {
      items: [{ id: itemId, price: newPrice.id }],
      proration_behavior: "always_invoice",
    });

    // Update our DB
    await db
      .update(subscriptions)
      .set({
        planId: newPlan.id,
        monthlyAmount: String(data.monthlyAmount),
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, sub.id));

    return {
      success: true,
      planName: newPlan.name,
      planSlug: newPlan.slug,
      monthlyAmount: data.monthlyAmount,
    };
  });

// ─── Cancel subscription (member self-service) ───

export const cancelMySubscription = createServerFn({ method: "POST" }).handler(
  async () => {
    const session = await getSession();

    const [member] = await db
      .select({ id: members.id })
      .from(members)
      .where(eq(members.userId, session.user.id));
    if (!member) throw new Error("Member not found");

    const [sub] = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.memberId, member.id),
          eq(subscriptions.status, "active"),
        ),
      )
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);

    if (!sub) throw new Error("No active subscription found");
    if (sub.status === "cancelled") throw new Error("Already cancelled");

    if (sub.stripeSubscriptionId) {
      try {
        await stripe.subscriptions.cancel(sub.stripeSubscriptionId);
      } catch (e: any) {
        if (e?.code === "resource_missing") {
          await db
            .update(subscriptions)
            .set({
              status: "cancelled",
              cancelledAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(subscriptions.id, sub.id));
        } else {
          throw e;
        }
      }
    } else {
      await db
        .update(subscriptions)
        .set({
          status: "cancelled",
          cancelledAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.id, sub.id));
    }

    await db.insert(auditLog).values({
      entityType: "subscription",
      entityId: sub.id,
      action: "cancelled",
      newValue: { status: "cancelled", cancelledBy: "member" },
      performedBy: session.user.id,
    });

    return { success: true };
  },
);

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
    return_url: `${env.BETTER_AUTH_URL}/member`,
  });

  return { url: portalSession.url };
});

// ─── Export Members ───

export const exportMembersCsv = createServerFn({ method: "POST" })
  .inputValidator((data: { status?: string; planId?: string }) => data)
  .handler(async ({ data }) => {
    await requireAdminSession();
    const { getMembersForExport } = await import("./members.repo.js");
    const { generateCsv } = await import("./csv.js");
    
    const membersData = await getMembersForExport(data);
    
    const csvRows = membersData.map(m => {
      // Format dependants as "Name:Relationship | Name2:Relationship2"
      const depsString = m.dependants
        .map(d => `${d.name}:${d.relationship}`)
        .join(" | ");

      // Format dates safely
      const formatDate = (dateStr: string | null | Date) => {
        if (!dateStr) return "";
        try {
          return new Date(dateStr).toISOString().split('T')[0];
        } catch {
          return String(dateStr);
        }
      };

      return {
        Name: m.userName || "",
        Email: m.userEmail || "",
        Phone: m.userPhone || "",
        NRIC: m.nric || "",
        DOB: m.dob ? formatDate(m.dob) : "",
        Address: m.address || "",
        PostalCode: m.postalCode || "",
        Plan: m.planName || "",
        MonthlyAmount: m.monthlyAmount || "",
        Status: m.subStatus || "",
        Dependants: depsString,
      };
    });

    return generateCsv(csvRows);
  });

// ─── Import Members ───
export const importMembersCsv = createServerFn({ method: "POST" })
  .inputValidator((data: { rows: Record<string, string>[] }) => data)
  .handler(async ({ data }) => {
    const session = await requireAdminSession();
    const { rows } = data;
    
    const allPlans = await db.select().from(plans);
    let importedCount = 0;
    const errors: string[] = [];

    for (const [index, row] of rows.entries()) {
      try {
        const { Name, Email, Phone, NRIC, DOB, Address, PostalCode, Plan, MonthlyAmount, Dependants } = row;
        
        if (!Email || !Name) {
          errors.push(`Row ${index + 1}: Missing Email or Name`);
          continue;
        }

        // Check if user exists
        let existingUser = await db.select().from(user).where(eq(user.email, Email)).then(res => res[0]);
        let userId = existingUser?.id;

        if (!existingUser) {
          const newUser = await auth.api.signUpEmail({
            body: {
              name: Name,
              email: Email,
              password: crypto.randomUUID(), // Random password
            },
          });
          if (!newUser?.user) throw new Error("Failed to create user");
          userId = newUser.user.id;
          
          if (Phone) {
            await db.update(user).set({ phoneNumber: Phone }).where(eq(user.id, userId));
          }
        }

        // Check if member exists
        let memberRow = await db.select().from(members).where(eq(members.userId, userId!)).then(res => res[0]);
        let memberId = memberRow?.id;

        if (!memberRow) {
          const [newMember] = await db.insert(members).values({
            userId: userId!,
            nric: NRIC || null,
            dob: DOB || null,
            address: Address || null,
            postalCode: PostalCode || null,
            createdBy: session.user.id,
          }).returning();
          memberId = newMember!.id;
        }

        if (!memberId) continue;

        // Plan matching
        const normalizedPlanName = (Plan || "").toLowerCase().replace(/[^a-z]/g, "");
        let matchedPlan = allPlans.find(p => p.slug.replace(/[^a-z]/g, "") === normalizedPlanName);
        
        if (!matchedPlan && allPlans.length > 0) {
          // fallback to first plan if not matched or empty
          matchedPlan = allPlans[allPlans.length - 1]; 
        }

        if (matchedPlan) {
          const amount = MonthlyAmount ? Number(MonthlyAmount) : Number(matchedPlan.minAmount);
          
          const today = new Date().toISOString().split("T")[0]!;
          const nextMonth = new Date();
          nextMonth.setMonth(nextMonth.getMonth() + 1);
          const coverageUntil = nextMonth.toISOString().split("T")[0]!;

          const [subscription] = await db.insert(subscriptions).values({
            memberId: memberId,
            planId: matchedPlan.id,
            monthlyAmount: String(amount),
            status: "active",
            paymentMethod: "manual",
            coverageStart: today,
            coverageUntil,
          }).returning();

          // Handle Dependants (Format: "Name:Relationship | Name2:Relationship2")
          if (Dependants && subscription) {
            const depsList = Dependants.split("|").map(d => d.trim()).filter(Boolean);
            for (const dep of depsList) {
              const [depName, depRel] = dep.split(":").map(s => s.trim());
              if (depName) {
                let relationship: "spouse" | "child" | "parent" | "in_law" | "sibling" = "child";
                const normalizedRel = (depRel || "").toLowerCase();
                if (["spouse", "child", "parent", "sibling"].includes(normalizedRel)) {
                  relationship = normalizedRel as any;
                } else if (normalizedRel === "in-law" || normalizedRel === "in_law" || normalizedRel === "in law") {
                  relationship = "in_law";
                }

                await db.insert(dependants).values({
                  memberId: memberId,
                  name: depName,
                  relationship,
                  sameAddress: true,
                });
              }
            }
          }
        }
        
        importedCount++;
      } catch (e: any) {
        errors.push(`Row ${index + 1}: ${e.message}`);
      }
    }

    if (importedCount > 0) {
      await db.insert(auditLog).values({
        entityType: "system",
        entityId: crypto.randomUUID(),
        action: "csv_import",
        newValue: { importedCount, errors: errors.length },
        performedBy: session.user.id,
      });
    }

    return { success: true, importedCount, errors };
  });
