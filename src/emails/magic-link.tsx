import { Text } from "@react-email/components";
import {
  EmailLayout,
  GoldButton,
  headingStyle,
  paragraphStyle,
  colors,
} from "./layout.js";

export default function MagicLinkEmail({ url }: { url: string }) {
  return (
    <EmailLayout preview="Your Skim Pintar login link">
      <Text style={headingStyle}>Sign in to Skim Pintar</Text>
      <Text style={paragraphStyle}>
        Click the button below to sign in to your member portal. This link will
        expire in 10 minutes.
      </Text>
      <div style={{ textAlign: "center" as const, margin: "24px 0" }}>
        <GoldButton href={url}>Sign In</GoldButton>
      </div>
      <Text
        style={{
          fontSize: "13px",
          color: colors.textLight,
          margin: "24px 0 0 0",
          lineHeight: "20px",
        }}
      >
        If you didn't request this link, you can safely ignore this email. The
        link will expire automatically.
      </Text>
    </EmailLayout>
  );
}
