import { Section, Text } from "@react-email/components";
import {
  EmailLayout,
  StatusBadge,
  headingStyle,
  paragraphStyle,
  colors,
} from "./layout.js";

export default function GracePeriodEmail({
  daysRemaining,
}: {
  daysRemaining: number;
}) {
  return (
    <EmailLayout
      preview={`Grace period: ${daysRemaining} days remaining`}
    >
      <div style={{ marginBottom: "16px" }}>
        <StatusBadge type="warning">Grace Period</StatusBadge>
      </div>
      <Text style={headingStyle}>Grace Period Notice</Text>

      <Section
        style={{
          backgroundColor: colors.amberBg,
          borderRadius: "8px",
          borderLeft: `4px solid ${colors.amber}`,
          padding: "16px 20px",
          margin: "16px 0",
        }}
      >
        <Text
          style={{
            fontSize: "14px",
            color: colors.amber,
            fontWeight: 600,
            margin: 0,
          }}
        >
          You have <strong>{daysRemaining} days</strong> remaining to make a
          payment.
        </Text>
      </Section>

      <Text style={paragraphStyle}>
        Your Skim Pintar coverage has entered a grace period.
      </Text>
      <Text style={paragraphStyle}>
        Please make a payment to avoid losing your coverage.
      </Text>
    </EmailLayout>
  );
}
