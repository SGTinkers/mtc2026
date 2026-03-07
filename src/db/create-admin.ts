import { auth } from "../lib/auth.js";

const email = process.argv[2];
const password = process.argv[3];
const name = process.argv[4] || "Admin";

if (!email || !password) {
  console.error("Usage: bun run src/db/create-admin.ts <email> <password> [name]");
  process.exit(1);
}

const user = await auth.api.signUpEmail({
  body: { email, password, name },
});

if (!user?.user) {
  console.error("Failed to create user");
  process.exit(1);
}

// Set role to admin
const { db } = await import("./index.js");
const { user: userTable } = await import("./schema.js");
const { eq } = await import("drizzle-orm");

await db
  .update(userTable)
  .set({ role: "admin" })
  .where(eq(userTable.id, user.user.id));

console.log(`Admin created: ${email}`);
process.exit(0);
