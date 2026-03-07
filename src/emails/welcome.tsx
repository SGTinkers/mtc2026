import { Text } from "@react-email/components";
import {
  EmailLayout,
  headingStyle,
  paragraphStyle,
  colors,
} from "./layout.js";

export default function WelcomeEmail({ name = "Ahmad" }: { name: string }) {
  return (
    <EmailLayout preview={`Welcome to Skim Pintar, ${name}!`}>
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
      <Text style={{ ...headingStyle, textAlign: "center" as const }}>
        Welcome, {name}!
      </Text>
      <Text style={paragraphStyle}>
        You have been registered for the Skim Pintar welfare scheme at Masjid
        Ar-Raudhah.
      </Text>
      <Text style={paragraphStyle}>
        You can log in to your member portal to view your coverage status and
        manage your subscription.
      </Text>
    </EmailLayout>
  );
}
