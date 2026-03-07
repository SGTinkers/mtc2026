import { Section, Text } from "@react-email/components";
import {
  EmailLayout,
  GoldButton,
  StatusBadge,
  headingStyle,
  paragraphStyle,
  colors,
} from "./layout.js";

export default function PaymentFailedEmail({
  attemptNumber = 2,
  memberPortalUrl = "https://skimpintar.org/member",
}: {
  attemptNumber: number;
  memberPortalUrl: string;
}) {
  const isFinalAttempt = attemptNumber >= 3;

  return (
    <EmailLayout
      preview={
        isFinalAttempt
          ? "Final payment attempt failed — your subscription will be deactivated"
          : `Payment failed - action required (attempt ${attemptNumber})`
      }
    >
      <div style={{ marginBottom: "16px" }}>
        <StatusBadge type="error">Payment Failed</StatusBadge>
      </div>
      <Text style={headingStyle}>Payment Failed</Text>

      <Section
        style={{
          backgroundColor: colors.redBg,
          borderRadius: "8px",
          borderLeft: `4px solid ${colors.red}`,
          padding: "16px 20px",
          margin: "16px 0",
        }}
      >
        <Text
          style={{
            fontSize: "14px",
            color: colors.red,
            fontWeight: 600,
            margin: 0,
          }}
        >
          {isFinalAttempt
            ? "URGENT: This was the final payment attempt. Your subscription will be deactivated."
            : `This is attempt ${attemptNumber} of 3. If all attempts fail, your subscription will be deactivated.`}
        </Text>
      </Section>

      <Text style={paragraphStyle}>
        We were unable to process your Skim Pintar subscription payment. Without
        a successful payment, your coverage will enter a grace period and
        eventually lapse.
      </Text>

      <Text
        style={{
          ...paragraphStyle,
          fontWeight: 600,
          color: colors.text,
        }}
      >
        What happens next:
      </Text>

      <Section
        style={{
          backgroundColor: "#f8fafc",
          borderRadius: "8px",
          padding: "16px 20px",
          margin: "0 0 16px 0",
        }}
      >
        <Text style={{ ...paragraphStyle, margin: "0 0 8px 0" }}>
          1. Your coverage will enter a <strong>14-day grace period</strong>{" "}
          after it expires.
        </Text>
        <Text style={{ ...paragraphStyle, margin: "0 0 8px 0" }}>
          2. If no payment is received during the grace period, your{" "}
          <strong>coverage will lapse</strong> and you will no longer be covered
          under the welfare scheme.
        </Text>
        <Text style={{ ...paragraphStyle, margin: 0 }}>
          3. To restore coverage, you will need to re-subscribe.
        </Text>
      </Section>

      <Text style={paragraphStyle}>
        Please update your payment method or make a manual payment as soon as
        possible to keep your coverage active.
      </Text>

      <Section style={{ textAlign: "center" as const, margin: "24px 0" }}>
        <GoldButton href={memberPortalUrl}>Go to Member Portal</GoldButton>
      </Section>
    </EmailLayout>
  );
}
