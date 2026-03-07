import { Resend } from "resend";
import { env } from "~/env.js";
import MagicLinkEmail from "~/emails/magic-link.js";
import WelcomeEmail from "~/emails/welcome.js";
import PaymentReceivedEmail from "~/emails/payment-received.js";
import PaymentFailedEmail from "~/emails/payment-failed.js";
import GracePeriodEmail from "~/emails/grace-period.js";
import CoverageLapsedEmail from "~/emails/coverage-lapsed.js";
import CoverageReactivatedEmail from "~/emails/coverage-reactivated.js";
import GiroApprovedEmail from "~/emails/giro-approved.js";
import WelcomePaymentEmail from "~/emails/welcome-payment.js";
import WelcomeBackPaymentEmail from "~/emails/welcome-back-payment.js";
import { createElement } from "react";

const resend = new Resend(env.RESEND_API_KEY);

const FROM_EMAIL = "Skim Pintar <noreply@mtc2026.msociety.dev>";

async function send(
  params: Parameters<typeof resend.emails.send>[0],
) {
  const { data, error } = await resend.emails.send(params);
  if (error) {
    console.error("[Resend] Failed to send email:", error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
  return data;
}

export async function sendMagicLinkEmail(email: string, url: string) {
  await send({
    from: FROM_EMAIL,
    to: email,
    subject: "Your Skim Pintar Login Link",
    react: createElement(MagicLinkEmail, { url }),
  });
}

export async function sendWelcomeEmail(email: string, name: string) {
  await send({
    from: FROM_EMAIL,
    to: email,
    subject: "Welcome to Skim Pintar",
    react: createElement(WelcomeEmail, { name }),
  });
}

export async function sendPaymentReceivedEmail(
  email: string,
  amount: string,
  method: string,
  periodMonth: string,
) {
  await send({
    from: FROM_EMAIL,
    to: email,
    subject: "Payment Received - Skim Pintar",
    react: createElement(PaymentReceivedEmail, { amount, method, periodMonth }),
  });
}

export async function sendPaymentFailedEmail(
  email: string,
  attemptNumber: number,
) {
  await send({
    from: FROM_EMAIL,
    to: email,
    subject: `Payment Failed - Action Required (Attempt ${attemptNumber})`,
    react: createElement(PaymentFailedEmail, { attemptNumber }),
  });
}

export async function sendGracePeriodEmail(
  email: string,
  daysRemaining: number,
) {
  await send({
    from: FROM_EMAIL,
    to: email,
    subject: "Grace Period Started - Skim Pintar",
    react: createElement(GracePeriodEmail, { daysRemaining }),
  });
}

export async function sendCoverageLapsedEmail(email: string) {
  await send({
    from: FROM_EMAIL,
    to: email,
    subject: "Coverage Lapsed - Skim Pintar",
    react: createElement(CoverageLapsedEmail),
  });
}

export async function sendCoverageReactivatedEmail(email: string) {
  await send({
    from: FROM_EMAIL,
    to: email,
    subject: "Coverage Reactivated - Skim Pintar",
    react: createElement(CoverageReactivatedEmail),
  });
}

export async function sendGiroApprovedEmail(email: string, name: string) {
  await send({
    from: FROM_EMAIL,
    to: email,
    subject: "GIRO Approved - Skim Pintar",
    react: createElement(GiroApprovedEmail, { name }),
  });
}

export async function sendWelcomePaymentEmail(
  email: string,
  name: string,
  amount: string,
  planName: string,
  coverageEndDate: string,
  loginUrl: string,
) {
  await send({
    from: FROM_EMAIL,
    to: email,
    subject: "Welcome to Skim Pintar — Your Payment is Confirmed",
    react: createElement(WelcomePaymentEmail, {
      name,
      amount,
      planName,
      coverageEndDate,
      loginUrl,
    }),
  });
}

export async function sendWelcomeBackPaymentEmail(
  email: string,
  amount: string,
  planName: string,
  coverageEndDate: string,
) {
  await send({
    from: FROM_EMAIL,
    to: email,
    subject: "Welcome Back — Your Payment is Confirmed",
    react: createElement(WelcomeBackPaymentEmail, {
      amount,
      planName,
      coverageEndDate,
    }),
  });
}
