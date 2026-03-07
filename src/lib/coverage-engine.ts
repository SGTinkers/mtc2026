import { db } from "~/db/index.js";
import { subscriptions, members, user } from "~/db/schema.js";
import { eq, and, lt } from "drizzle-orm";
import {
  sendGracePeriodEmail,
  sendCoverageLapsedEmail,
} from "./notifications.js";

export async function processCoverageStatus() {
  const today = new Date().toISOString().split("T")[0]!;

  // Move active subscriptions past coverage_until to grace period
  const expiredActive = await db
    .select({
      subId: subscriptions.id,
      memberId: subscriptions.memberId,
      coverageUntil: subscriptions.coverageUntil,
    })
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.status, "active"),
        lt(subscriptions.coverageUntil, today),
      ),
    );

  for (const sub of expiredActive) {
    const graceEnd = new Date(sub.coverageUntil);
    graceEnd.setDate(graceEnd.getDate() + 14);
    const graceUntil = graceEnd.toISOString().split("T")[0]!;

    await db
      .update(subscriptions)
      .set({
        status: "grace",
        graceUntil,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, sub.subId));

    // Send grace period email
    try {
      const [member] = await db
        .select({ email: user.email })
        .from(members)
        .innerJoin(user, eq(members.userId, user.id))
        .where(eq(members.id, sub.memberId));
      if (member) {
        const daysRemaining = Math.ceil(
          (graceEnd.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
        );
        await sendGracePeriodEmail(member.email, daysRemaining);
      }
    } catch {
      // Don't fail processing on email error
    }
  }

  // Move grace subscriptions past grace_until to lapsed
  const expiredGrace = await db
    .select({
      subId: subscriptions.id,
      memberId: subscriptions.memberId,
    })
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.status, "grace"),
        lt(subscriptions.graceUntil, today),
      ),
    );

  for (const sub of expiredGrace) {
    await db
      .update(subscriptions)
      .set({
        status: "lapsed",
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, sub.subId));

    // Send lapsed email
    try {
      const [member] = await db
        .select({ email: user.email })
        .from(members)
        .innerJoin(user, eq(members.userId, user.id))
        .where(eq(members.id, sub.memberId));
      if (member) {
        await sendCoverageLapsedEmail(member.email);
      }
    } catch {
      // Don't fail processing on email error
    }
  }

  return {
    movedToGrace: expiredActive.length,
    movedToLapsed: expiredGrace.length,
  };
}
