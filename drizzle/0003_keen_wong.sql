CREATE TYPE "public"."payment_status" AS ENUM('succeeded', 'failed');--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "status" "payment_status" DEFAULT 'succeeded' NOT NULL;--> statement-breakpoint
ALTER TABLE "dependants" ADD COLUMN "member_id" uuid;--> statement-breakpoint
UPDATE "dependants" SET "member_id" = s."member_id" FROM "subscriptions" s WHERE "dependants"."subscription_id" = s."id";--> statement-breakpoint
ALTER TABLE "dependants" ALTER COLUMN "member_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "dependants" ADD CONSTRAINT "dependants_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dependants" DROP CONSTRAINT "dependants_subscription_id_subscriptions_id_fk";--> statement-breakpoint
ALTER TABLE "dependants" DROP COLUMN "subscription_id";
