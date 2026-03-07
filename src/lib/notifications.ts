import { Resend } from "resend";
import { env } from "~/env.js";

const resend = new Resend(env.RESEND_API_KEY);

const FROM_EMAIL = "Skim Pintar <onboarding@resend.dev>";

export async function sendMagicLinkEmail(email: string, url: string) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "Your Skim Pintar Login Link",
    html: `
      <h2>Login to Skim Pintar</h2>
      <p>Click the link below to sign in to your account:</p>
      <a href="${url}" style="display:inline-block;padding:12px 24px;background:#0f766e;color:#fff;text-decoration:none;border-radius:6px;">
        Sign In
      </a>
      <p style="color:#666;margin-top:16px;">This link expires in 10 minutes.</p>
    `,
  });
}

export async function sendWelcomeEmail(email: string, name: string) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "Welcome to Skim Pintar",
    html: `
      <h2>Welcome, ${name}!</h2>
      <p>You have been registered for the Skim Pintar welfare scheme at Masjid Ar-Raudhah.</p>
      <p>You can log in to your member portal to view your coverage status and manage your subscription.</p>
    `,
  });
}

export async function sendPaymentReceivedEmail(
  email: string,
  amount: string,
  method: string,
  periodMonth: string,
) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "Payment Received - Skim Pintar",
    html: `
      <h2>Payment Confirmed</h2>
      <p>We have received your payment of <strong>$${amount}</strong> via ${method} for ${periodMonth}.</p>
      <p>Your coverage has been extended. Thank you for your continued support.</p>
    `,
  });
}

export async function sendPaymentFailedEmail(
  email: string,
  attemptNumber: number,
) {
  const urgency =
    attemptNumber >= 3
      ? "URGENT: This is the final attempt."
      : `This is attempt ${attemptNumber} of 3.`;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: `Payment Failed - Action Required (Attempt ${attemptNumber})`,
    html: `
      <h2>Payment Failed</h2>
      <p>We were unable to process your Skim Pintar subscription payment. ${urgency}</p>
      <p>Please update your payment method to avoid coverage interruption.</p>
    `,
  });
}

export async function sendGracePeriodEmail(
  email: string,
  daysRemaining: number,
) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "Grace Period Started - Skim Pintar",
    html: `
      <h2>Grace Period Notice</h2>
      <p>Your Skim Pintar coverage has entered a grace period. You have <strong>${daysRemaining} days</strong> remaining to make a payment.</p>
      <p>Please make a payment to avoid losing your coverage.</p>
    `,
  });
}

export async function sendCoverageLapsedEmail(email: string) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "Coverage Lapsed - Skim Pintar",
    html: `
      <h2>Coverage Lapsed</h2>
      <p>Your Skim Pintar coverage has lapsed due to non-payment. You are no longer covered under the welfare scheme.</p>
      <p>Please contact the mosque or make a payment to reactivate your coverage.</p>
    `,
  });
}

export async function sendCoverageReactivatedEmail(email: string) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "Coverage Reactivated - Skim Pintar",
    html: `
      <h2>Coverage Reactivated</h2>
      <p>Your Skim Pintar coverage has been reactivated. You are now covered under the welfare scheme again.</p>
    `,
  });
}
