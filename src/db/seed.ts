import { db } from "./index.js";
import { plans } from "./schema.js";

async function seed() {
  console.log("Seeding plans...");

  await db
    .insert(plans)
    .values([
      {
        slug: "pintar",
        name: "Skim Pintar",
        minAmount: "5.00",
        courseDiscount: 10,
        maxDependants: 0,
      },
      {
        slug: "pintar_plus",
        name: "Skim Pintar Plus",
        minAmount: "20.00",
        courseDiscount: 20,
        maxDependants: 4,
      },
    ])
    .onConflictDoNothing({ target: plans.slug });

  console.log("Seeding complete.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
