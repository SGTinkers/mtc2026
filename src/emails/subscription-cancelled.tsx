import { Section, Text } from "@react-email/components";
import {
  EmailLayout,
  StatusBadge,
  headingStyle,
  paragraphStyle,
  colors,
} from "./layout.js";

export default function SubscriptionCancelledEmail({
  name = "Ahmad",
}: {
  name: string;
}) {
  return (
    <EmailLayout preview="Your Skim Pintar subscription has been cancelled">
      <div style={{ marginBottom: "16px" }}>
        <StatusBadge type="error">Cancelled</StatusBadge>
      </div>
      <Text style={headingStyle}>Subscription Cancelled</Text>

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
          Your Skim Pintar subscription has been cancelled by the
          administrator. You are no longer covered under the welfare scheme.
        </Text>
      </Section>

      <Text style={paragraphStyle}>
        Dear {name}, if you believe this is an error, please contact the mosque
        to resolve the issue.
      </Text>
    </EmailLayout>
  );
}
