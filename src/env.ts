import { cleanEnv, str } from "envalid";

export const env = cleanEnv(process.env, {
  DATABASE_URL: str(),
  BETTER_AUTH_SECRET: str(),
  BETTER_AUTH_URL: str({ default: "http://localhost:3000" }),
  STRIPE_SECRET_KEY: str(),
  STRIPE_WEBHOOK_SECRET: str(),
  RESEND_API_KEY: str(),
});
