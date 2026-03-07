import { db } from "./index.js";
import { payments, subscriptions } from "./schema.js";
import { eq } from "drizzle-orm";

const METHODS = ["stripe", "paynow", "bank_transfer", "cash", "giro"] as const;

async function seedPayments() {
  // Get active subscriptions to attach payments to
  const activeSubs = await db
    .select({ id: subscriptions.id, monthlyAmount: subscriptions.monthlyAmount })
    .from(subscriptions)
    .where(eq(subscriptions.status, "active"));

  if (activeSubs.length === 0) {
    console.log("No active subscriptions found. Nothing to seed.");
    process.exit(0);
  }

  console.log(`Found ${activeSubs.length} active subscriptions. Generating 12 months of payments...`);

  const rows: (typeof payments.$inferInsert)[] = [];
  const now = new Date();

  for (let monthsAgo = 11; monthsAgo >= 0; monthsAgo--) {
    const date = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);

    for (const sub of activeSubs) {
      // ~85% chance a payment exists for a given month (simulate occasional misses)
      if (Math.random() < 0.15) continue;

      // Pick a random day in the month (1-28)
      const day = Math.floor(Math.random() * 28) + 1;
      const createdAt = new Date(date.getFullYear(), date.getMonth(), day, 10, 0, 0);

      // Small random variation: some members pay a bit more (donations)
      const base = Number(sub.monthlyAmount);
      const extra = Math.random() < 0.2 ? Math.floor(Math.random() * 10) + 1 : 0;
      const amount = (base + extra).toFixed(2);

      const method = METHODS[Math.floor(Math.random() * METHODS.length)]!;
      const periodMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;

      rows.push({
        subscriptionId: sub.id,
        amount,
        method,
        status: "succeeded",
        periodMonth,
        createdAt,
      });
    }
  }

  console.log(`Inserting ${rows.length} payment records...`);
  await db.insert(payments).values(rows);
  console.log("Done!");
  process.exit(0);
}

seedPayments().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
