ALTER TABLE "dependants" ALTER COLUMN "nric" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "dependants" ADD COLUMN IF NOT EXISTS "dob" date;--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN IF NOT EXISTS "dob" date;--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN IF NOT EXISTS "postal_code" text;