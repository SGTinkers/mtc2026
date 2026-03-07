import {
  pgTable,
  text,
  timestamp,
  boolean,
  uuid,
  decimal,
  integer,
  date,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";

// ─── better-auth tables (managed by better-auth, defined here for Drizzle awareness) ───

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  phoneNumber: text("phone_number"),
  role: text("role").default("member"),
  banned: boolean("banned").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ─── Enums ───

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "pending_payment",
  "pending_approval",
  "active",
  "grace",
  "lapsed",
  "cancelled",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "stripe",
  "manual",
]);

export const paymentRecordMethodEnum = pgEnum("payment_record_method", [
  "stripe",
  "giro",
  "cash",
  "bank_transfer",
  "paynow",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "succeeded",
  "failed",
]);

export const relationshipEnum = pgEnum("relationship", [
  "spouse",
  "child",
  "parent",
  "in_law",
  "sibling",
]);

// ─── Application tables ───

export const members = pgTable("members", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  nric: text("nric").unique(),
  dob: date("dob"),
  address: text("address"),
  postalCode: text("postal_code"),
  createdBy: text("created_by").references(() => user.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const plans = pgTable("plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  minAmount: decimal("min_amount", { precision: 10, scale: 2 }).notNull(),
  courseDiscount: integer("course_discount").notNull().default(0),
  maxDependants: integer("max_dependants"),
  stripePriceId: text("stripe_price_id"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  memberId: uuid("member_id")
    .notNull()
    .references(() => members.id, { onDelete: "cascade" }),
  planId: uuid("plan_id")
    .notNull()
    .references(() => plans.id),
  monthlyAmount: decimal("monthly_amount", { precision: 10, scale: 2 }).notNull(),
  status: subscriptionStatusEnum("status").notNull().default("pending_payment"),
  paymentMethod: paymentMethodEnum("payment_method").notNull().default("manual"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  coverageStart: date("coverage_start").notNull(),
  coverageUntil: date("coverage_until").notNull(),
  graceUntil: date("grace_until"),
  cancelledAt: timestamp("cancelled_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const dependants = pgTable("dependants", {
  id: uuid("id").primaryKey().defaultRandom(),
  subscriptionId: uuid("subscription_id")
    .notNull()
    .references(() => subscriptions.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  nric: text("nric"),
  dob: date("dob"),
  phone: text("phone"),
  relationship: relationshipEnum("relationship").notNull(),
  sameAddress: boolean("same_address").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  subscriptionId: uuid("subscription_id")
    .notNull()
    .references(() => subscriptions.id, { onDelete: "cascade" }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  method: paymentRecordMethodEnum("method").notNull(),
  stripeInvoiceId: text("stripe_invoice_id"),
  status: paymentStatusEnum("status").notNull().default("succeeded"),
  reference: text("reference"),
  periodMonth: date("period_month"),
  recordedBy: text("recorded_by").references(() => user.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const auditLog = pgTable("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  entityType: text("entity_type").notNull(),
  entityId: uuid("entity_id").notNull(),
  action: text("action").notNull(),
  oldValue: jsonb("old_value"),
  newValue: jsonb("new_value").notNull(),
  performedBy: text("performed_by").references(() => user.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
