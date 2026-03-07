import { Text } from "@react-email/components";
import {
  EmailLayout,
  headingStyle,
  paragraphStyle,
  colors,
} from "./layout.js";

export default function GiroApprovedEmail({ name = "Ahmad" }: { name: string }) {
  return (
    <EmailLayout preview="Your GIRO has been approved - Skim Pintar">
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
        GIRO Approved
      </Text>
      <Text style={paragraphStyle}>
        Hi {name}, your GIRO payment has been approved and your Skim Pintar
        coverage is now active.
      </Text>
      <Text style={paragraphStyle}>
        Your subscription will be automatically deducted via GIRO each month.
        You can log in to your member portal to view your coverage status.
      </Text>
    </EmailLayout>
  );
}
