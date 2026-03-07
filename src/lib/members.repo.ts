import { db } from "~/db/index.js";
import { members, plans, subscriptions, user } from "~/db/schema.js";
import { eq, desc } from "drizzle-orm";

export async function queryMembersWithLatestSub() {
  const latestSub = db
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

  return db
    .select({
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
    })
    .from(members)
    .leftJoin(user, eq(members.userId, user.id))
    .leftJoin(latestSub, eq(latestSub.memberId, members.id))
    .leftJoin(plans, eq(latestSub.planId, plans.id))
    .orderBy(desc(members.createdAt));
}
