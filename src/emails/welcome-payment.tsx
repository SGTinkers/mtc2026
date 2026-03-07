import { Text } from "@react-email/components";
import {
  EmailLayout,
  StatusBadge,
  DetailBox,
  GoldButton,
  headingStyle,
  paragraphStyle,
  colors,
  fonts,
} from "./layout.js";

export default function WelcomePaymentEmail({
  name,
  amount,
  planName,
  coverageEndDate,
  loginUrl,
}: {
  name: string;
  amount: string;
  planName: string;
  coverageEndDate: string;
  loginUrl: string;
}) {
  return (
    <EmailLayout preview={`Welcome to Skim Pintar — Payment of $${amount} confirmed`}>
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
        <StatusBadge type="success">Payment Confirmed</StatusBadge>
      </div>
      <Text style={{ ...headingStyle, textAlign: "center" as const }}>
        Welcome, {name}!
      </Text>
      <Text style={paragraphStyle}>
        Thank you for joining the Skim Pintar welfare scheme at Masjid
        Ar-Raudhah. Your payment has been received and your coverage is now
        active.
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
        Log in to your member portal to view your coverage status and manage
        your subscription.
      </Text>

      <div style={{ textAlign: "center" as const, margin: "24px 0" }}>
        <GoldButton href={loginUrl}>
          Manage Your Donation
        </GoldButton>
      </div>
    </EmailLayout>
  );
}
