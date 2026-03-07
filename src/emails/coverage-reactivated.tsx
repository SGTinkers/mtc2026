import { Text } from "@react-email/components";
import {
  EmailLayout,
  StatusBadge,
  headingStyle,
  paragraphStyle,
  colors,
} from "./layout.js";

export default function CoverageReactivatedEmail() {
  return (
    <EmailLayout preview="Your Skim Pintar coverage has been reactivated">
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
      <div
        style={{ marginBottom: "16px", textAlign: "center" as const }}
      >
        <StatusBadge type="success">Active</StatusBadge>
      </div>
      <Text style={{ ...headingStyle, textAlign: "center" as const }}>
        Coverage Reactivated
      </Text>
      <Text style={{ ...paragraphStyle, textAlign: "center" as const }}>
        Your Skim Pintar coverage has been reactivated. You are now covered
        under the welfare scheme again.
      </Text>
    </EmailLayout>
  );
}
