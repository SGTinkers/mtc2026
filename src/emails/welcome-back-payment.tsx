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

export default function WelcomeBackPaymentEmail({
  amount,
  planName,
  coverageEndDate,
}: {
  amount: string;
  planName: string;
  coverageEndDate: string;
}) {
  return (
    <EmailLayout preview={`Welcome back — Payment of $${amount} confirmed`}>
      {/* Green checkmark */}
      <div style={{ textAlign: "center" as const, marginBottom: "24px" }}>
        <div
          style={{
            display: "inline-block",
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            backgroundColor: colors.greenSuccessBg,
            lineHeight: "56px",
            textAlign: "center" as const,
            fontSize: "28px",
          }}
        >
          &#x2713;
        </div>
      </div>
      <div style={{ marginBottom: "16px", textAlign: "center" as const }}>
        <StatusBadge type="success">Active</StatusBadge>
      </div>
      <Text style={{ ...headingStyle, textAlign: "center" as const }}>
        Welcome Back!
      </Text>
      <Text style={paragraphStyle}>
        Your payment has been received and your Skim Pintar coverage has been
        reactivated. You are now covered under the welfare scheme again.
      </Text>

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
          <strong style={{ color: colors.text }}>Plan:</strong> {planName}
        </Text>
        <Text
          style={{
            fontSize: "14px",
            color: colors.textMuted,
            margin: 0,
          }}
        >
          <strong style={{ color: colors.text }}>Coverage until:</strong>{" "}
          {coverageEndDate}
        </Text>
      </DetailBox>

      <Text style={paragraphStyle}>
        Thank you for your continued support of Masjid Ar-Raudhah.
      </Text>
    </EmailLayout>
  );
}
