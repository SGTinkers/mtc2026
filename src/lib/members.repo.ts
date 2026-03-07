import { db } from "~/db/index.js";
import { members, plans, subscriptions, user, dependants } from "~/db/schema.js";
import { eq, desc, or, ilike, and, type SQL } from "drizzle-orm";

function latestSubQuery() {
  return db
    .selectDistinctOn([subscriptions.memberId], {
      id: subscriptions.id,
      memberId: subscriptions.memberId,
      status: subscriptions.status,
      monthlyAmount: subscriptions.monthlyAmount,
      planId: subscriptions.planId,
    })
    .from(subscriptions)
    .orderBy(subscriptions.memberId, desc(subscriptions.createdAt))
    .as("latest_sub");
}

const memberColumns = (latestSub: ReturnType<typeof latestSubQuery>) =>
  ({
    id: members.id,
    userId: members.userId,
    nric: members.nric,
    dob: members.dob,
    address: members.address,
    postalCode: members.postalCode,
    createdAt: members.createdAt,
    userName: user.name,
    userEmail: user.email,
    userPhone: user.phoneNumber,
    subscriptionId: latestSub.id,
    subStatus: latestSub.status,
    planName: plans.name,
    planSlug: plans.slug,
    monthlyAmount: latestSub.monthlyAmount,
  }) as const;

export async function queryMembersWithLatestSub() {
  const latestSub = latestSubQuery();

  return db
    .select(memberColumns(latestSub))
    .from(members)
    .leftJoin(user, eq(members.userId, user.id))
    .leftJoin(latestSub, eq(latestSub.memberId, members.id))
    .leftJoin(plans, eq(latestSub.planId, plans.id))
    .orderBy(desc(members.createdAt));
}

export async function searchMembers(query: string) {
  const latestSub = latestSubQuery();
  const tokens = query.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return [];

  // Each token must match name or email (fuzzy: "joh smi" matches "John Smith")
  const conditions: SQL[] = tokens.map((token) => {
    const pattern = `%${token}%`;
    return or(ilike(user.name, pattern), ilike(user.email, pattern))!;
  });

  return db
    .select(memberColumns(latestSub))
    .from(members)
    .leftJoin(user, eq(members.userId, user.id))
    .leftJoin(latestSub, eq(latestSub.memberId, members.id))
    .leftJoin(plans, eq(latestSub.planId, plans.id))
    .where(and(...conditions))
    .orderBy(user.name)
    .limit(20);
}

export async function getMembersForExport(filters?: { status?: string; planId?: string }) {
  const latestSub = latestSubQuery();

  const conditions: SQL[] = [];
  if (filters?.status && filters.status !== "all") {
    conditions.push(eq(latestSub.status, filters.status as any));
  }
  if (filters?.planId && filters.planId !== "all") {
    conditions.push(eq(latestSub.planId, filters.planId as any));
  }

  const query = db
    .select(memberColumns(latestSub))
    .from(members)
    .leftJoin(user, eq(members.userId, user.id))
    .leftJoin(latestSub, eq(latestSub.memberId, members.id))
    .leftJoin(plans, eq(latestSub.planId, plans.id));

  if (conditions.length > 0) {
    query.where(and(...conditions));
  }

  const result = await query.orderBy(desc(members.createdAt));
  
  // Fetch dependants for all active subscriptions
  const memberIds = result.map(r => r.id).filter(Boolean) as string[];
  
  let allDependants: typeof dependants.$inferSelect[] = [];
  if (memberIds.length > 0) {
    // SQLite/Postgres param limits usually fine for 1000 items, but chunking is safer
    // Using a simpler approach since data is relatively small
    const depRecords = await db.select().from(dependants);
    allDependants = depRecords.filter(d => memberIds.includes(d.memberId));
  }

  return result.map(row => {
    const rowDependants = allDependants.filter(d => d.memberId === row.id);
    
    return {
      ...row,
      dependants: rowDependants
    };
  });
}
