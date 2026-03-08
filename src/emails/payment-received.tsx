import { Text } from "@react-email/components";
import {
  EmailLayout,
  StatusBadge,
  DetailBox,
  headingStyle,
  paragraphStyle,
  colors,
  fonts,
} from "./layout.js";

export default function PaymentReceivedEmail({
  amount = "8.00",
  method = "Credit Card",
  periodMonth = "March 2026",
  reference = "PAY-20260308-001",
}: {
  amount: string;
  method: string;
  periodMonth: string;
  reference?: string;
}) {
  return (
    <EmailLayout preview={`Payment of $${amount} received`}>
      <div style={{ marginBottom: "16px" }}>
        <StatusBadge type="success">Payment Confirmed</StatusBadge>
      </div>
      <Text style={headingStyle}>Payment Received</Text>

      <DetailBox>
        <Text
          style={{
            fontFamily: fonts.heading,
            fontSize: "28px",
            fontWeight: 700,
            color: colors.greenSuccess,
            margin: "0 0 12px 0",
          }}
        >
          ${amount}
        </Text>
        <Text
          style={{
            fontSize: "14px",
            color: colors.textMuted,
            margin: "0 0 4px 0",
          }}
        >
          <strong style={{ color: colors.text }}>Method:</strong> {method}
        </Text>
        <Text
          style={{
            fontSize: "14px",
            color: colors.textMuted,
            margin: 0,
          }}
        >
          <strong style={{ color: colors.text }}>Period:</strong> {periodMonth}
        </Text>
        {reference && (
          <Text
            style={{
              fontSize: "14px",
              color: colors.textMuted,
              margin: "4px 0 0 0",
            }}
          >
            <strong style={{ color: colors.text }}>Ref:</strong> {reference}
          </Text>
        )}
      </DetailBox>

      <Text style={paragraphStyle}>
        Your coverage has been extended. Thank you for your continued support.
      </Text>
    </EmailLayout>
  );
}
