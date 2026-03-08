import postgres from "postgres";
import { env } from "~/env.js";

const sql = postgres(env.DATABASE_URL);

async function reset() {
  console.log("⚠️  Starting database reset...");
  try {
    // Delete in order to respect foreign key constraints
    console.log("Deleting payments...");
    await sql`DELETE FROM "payments"`;
    
    console.log("Deleting dependants...");
    await sql`DELETE FROM "dependants"`;
    
    console.log("Deleting subscriptions...");
    await sql`DELETE FROM "subscriptions"`;
    
    console.log("Deleting members...");
    await sql`DELETE FROM "members"`;
    
    console.log("Deleting audit logs...");
    await sql`DELETE FROM "audit_log"`;

    console.log("Deleting non-admin users...");
    // better-auth uses user table. We assume admin accounts have role = 'admin'
    try {
      await sql`DELETE FROM "user" WHERE role != 'admin' OR role IS NULL`;
    } catch {
      console.log("Warning: 'role' column might not exist. Deleting all users...");
      await sql`DELETE FROM "user"`;
      console.log("You may need to run 'bun run db:create-admin' to recreate your login.");
    }
    
    console.log("Deleting sessions...");
    await sql`DELETE FROM "session"`;

    console.log("✅ Database reset complete!");
  } catch (error) {
    console.error("❌ Reset failed:", error);
  } finally {
    await sql.end();
  }
}

reset();
