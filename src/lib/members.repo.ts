import { db } from "~/db/index.js";
import { members, plans, subscriptions, user } from "~/db/schema.js";
import { eq, desc, or, ilike, sql, and, type SQL } from "drizzle-orm";

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
    address: members.address,
    createdAt: members.createdAt,
    userName: user.name,
    userEmail: user.email,
    userPhone: user.phoneNumber,
    subscriptionId: latestSub.id,
    subStatus: latestSub.status,
    planName: plans.name,
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
