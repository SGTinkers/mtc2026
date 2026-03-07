import { Section, Text } from "@react-email/components";
import {
  EmailLayout,
  StatusBadge,
  headingStyle,
  paragraphStyle,
  colors,
} from "./layout.js";

export default function CoverageLapsedEmail() {
  return (
    <EmailLayout preview="Your Skim Pintar coverage has lapsed">
      <div style={{ marginBottom: "16px" }}>
        <StatusBadge type="error">Coverage Lapsed</StatusBadge>
      </div>
      <Text style={headingStyle}>Coverage Lapsed</Text>

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
          Your coverage has lapsed due to non-payment. You are no longer covered
          under the welfare scheme.
        </Text>
      </Section>

      <Text style={paragraphStyle}>
        Please contact the mosque or make a payment to reactivate your coverage.
      </Text>
    </EmailLayout>
  );
}
