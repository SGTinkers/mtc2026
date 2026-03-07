import { db } from "./index.js";
import { plans } from "./schema.js";


import { user, members, subscriptions, payments, dependants } from "./schema.js";
import { faker } from "@faker-js/faker";

async function seed() {
  console.log("Seeding plans...");

  const [pintar, pintarPlus] = await db
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
    .onConflictDoUpdate({
      target: plans.slug,
      set: { name: plans.name } // Force returning IDs
    })
    .returning();

  console.log("Seeding dummy members & payments...");
  
  // Create 50 dummy members
  for (let i = 0; i < 50; i++) {
    // 1. Create User
    const [newUser] = await db.insert(user).values({
      id: crypto.randomUUID(),
      name: faker.person.fullName(),
      email: faker.internet.email().toLowerCase(),
      phoneNumber: faker.phone.number(),
    }).returning();

    // 2. Create Member
    const [newMember] = await db.insert(members).values({
      userId: newUser!.id,
      nric: "S" + faker.string.numeric(7) + "A",
      dob: faker.date.birthdate({ mode: "age", min: 18, max: 65 }).toISOString().split('T')[0],
      address: faker.location.streetAddress(),
      postalCode: faker.location.zipCode('######'),
    }).returning();

    // 3. Create Subscription (80% Active, 20% Pending/Cancelled)
    const isPintarPlus = Math.random() > 0.5;
    const plan = isPintarPlus ? pintarPlus : pintar;
    const isActive = Math.random() > 0.2;
    
    // Distribute creation dates over the last 11 months
    const createdDate = faker.date.recent({ days: 330 });
    const coverageStart = new Date(createdDate);
    const coverageUntil = new Date(createdDate);
    if (isActive) {
      coverageUntil.setMonth(coverageUntil.getMonth() + 1); // Valid for 1 month initially
    }
    
    const [sub] = await db.insert(subscriptions).values({
      memberId: newMember!.id as any,
      planId: plan!.id as any,
      monthlyAmount: isPintarPlus ? faker.helpers.arrayElement(["20.00", "30.00", "50.00"]) : faker.helpers.arrayElement(["5.00", "10.00"]),
      status: (isActive ? "active" : "pending_payment") as any,
      paymentMethod: faker.helpers.arrayElement(["manual", "stripe"]) as any,
      coverageStart: coverageStart.toISOString().split('T')[0] as any,
      coverageUntil: coverageUntil.toISOString().split('T')[0] as any,
      createdAt: createdDate as any,
      updatedAt: createdDate as any,
    } as any).returning();

    // 4. Create Dependants (If Pintar Plus)
    if (isPintarPlus && isActive) {
      const depCount = faker.number.int({ min: 1, max: 3 });
      for (let j = 0; j < depCount; j++) {
        await db.insert(dependants).values({
          memberId: newMember!.id,
          name: faker.person.fullName(),
          relationship: faker.helpers.arrayElement(["spouse", "child", "parent"]),
          sameAddress: true,
        });
      }
    }

    // 5. Create Payments over time (if active)
    if (isActive) {
      // Simulate monthly payments from creation date to now
      let currentPaymentDate = new Date(createdDate);
      const now = new Date();
      
      while (currentPaymentDate <= now) {
        await db.insert(payments).values({
          subscriptionId: sub!.id,
          amount: sub!.monthlyAmount,
          method: faker.helpers.arrayElement(["giro", "paynow", "stripe", "bank_transfer"]),
          createdAt: new Date(currentPaymentDate), // Important for graphs
        });
        
        // Advance 1 month
        currentPaymentDate.setMonth(currentPaymentDate.getMonth() + 1);
      }
      
      // Update subscription coverage based on final payment
      const finalCoverage = new Date(currentPaymentDate);
      await db.update(subscriptions).set({
        coverageUntil: finalCoverage.toISOString().split('T')[0],
        updatedAt: new Date()
      }).where({ id: sub!.id } as any); // Type cast since eq() isn't imported here
    }
  }

  console.log("Seeding complete.");
  process.exit(0);
}


seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
