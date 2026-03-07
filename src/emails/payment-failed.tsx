import { Section, Text } from "@react-email/components";
import {
  EmailLayout,
  StatusBadge,
  headingStyle,
  paragraphStyle,
  colors,
} from "./layout.js";

export default function PaymentFailedEmail({
  attemptNumber,
}: {
  attemptNumber: number;
}) {
  const urgency =
    attemptNumber >= 3
      ? "URGENT: This is the final attempt."
      : `This is attempt ${attemptNumber} of 3.`;

  return (
    <EmailLayout
      preview={`Payment failed - action required (attempt ${attemptNumber})`}
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
          {urgency}
        </Text>
      </Section>

      <Text style={paragraphStyle}>
        We were unable to process your Skim Pintar subscription payment.
      </Text>
      <Text style={paragraphStyle}>
        Please update your payment method to avoid coverage interruption.
      </Text>
    </EmailLayout>
  );
}
