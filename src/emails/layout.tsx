import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Link,
  Hr,
} from "@react-email/components";
import type { ReactNode } from "react";

// Design tokens
const colors = {
  green: "#064234",
  greenDeep: "#032A21",
  mint: "#2DD4A8",
  gold: "#F5C842",
  goldSoft: "#FEF3C7",
  cream: "#FFFDF5",
  white: "#ffffff",
  text: "#1A1A1A",
  textMuted: "#4A5568",
  textLight: "#94A3B8",
  red: "#DC2626",
  redBg: "#FEF2F2",
  amber: "#D97706",
  amberBg: "#FFFBEB",
  greenSuccess: "#059669",
  greenSuccessBg: "#ECFDF5",
} as const;

const fonts = {
  heading: "'Fraunces', Georgia, serif",
  body: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
} as const;

// Shared layout
export function EmailLayout({
  preview,
  children,
}: {
  preview: string;
  children: ReactNode;
}) {
  return (
    <Html lang="en">
      <Head>
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:wght@600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>
      <Preview>{preview}</Preview>
      <Body
        style={{
          backgroundColor: colors.cream,
          fontFamily: fonts.body,
          margin: 0,
          padding: 0,
        }}
      >
        <Container
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            padding: "40px 20px",
          }}
        >
          {/* Header */}
          <Section
            style={{
              backgroundColor: colors.green,
              borderRadius: "12px 12px 0 0",
              padding: "32px 40px",
              textAlign: "center" as const,
            }}
          >
            <Text
              style={{
                fontFamily: fonts.heading,
                fontSize: "22px",
                fontWeight: 700,
                color: colors.white,
                margin: "0 0 4px 0",
              }}
            >
              Skim Pintar
            </Text>
            <Text
              style={{
                fontSize: "13px",
                color: "rgba(255,255,255,0.5)",
                margin: 0,
              }}
            >
              Masjid Ar-Raudhah
            </Text>
          </Section>

          {/* Mint accent line */}
          <Hr
            style={{
              borderTop: `3px solid ${colors.mint}`,
              margin: 0,
            }}
          />

          {/* Content */}
          <Section
            style={{
              backgroundColor: colors.white,
              padding: "40px",
            }}
          >
            {children}
          </Section>

          {/* Footer */}
          <Section
            style={{
              backgroundColor: "#f8fafc",
              borderRadius: "0 0 12px 12px",
              padding: "24px 40px",
              textAlign: "center" as const,
            }}
          >
            <Text
              style={{
                fontSize: "13px",
                color: colors.textMuted,
                margin: "0 0 4px 0",
                fontWeight: 600,
              }}
            >
              Masjid Ar-Raudhah
            </Text>
            <Text
              style={{
                fontSize: "12px",
                color: colors.textLight,
                margin: 0,
                lineHeight: "18px",
              }}
            >
              You received this email because you are a registered member of Skim Pintar.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Gold CTA button
export function GoldButton({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      style={{
        display: "inline-block",
        backgroundColor: colors.gold,
        color: colors.greenDeep,
        fontFamily: fonts.body,
        fontSize: "14px",
        fontWeight: 700,
        padding: "14px 32px",
        borderRadius: "8px",
        textDecoration: "none",
        textAlign: "center" as const,
      }}
    >
      {children}
    </Link>
  );
}

// Status badge pill
export function StatusBadge({
  type,
  children,
}: {
  type: "success" | "warning" | "error";
  children: ReactNode;
}) {
  const styles = {
    success: { bg: colors.greenSuccessBg, color: colors.greenSuccess },
    warning: { bg: colors.amberBg, color: colors.amber },
    error: { bg: colors.redBg, color: colors.red },
  };
  const s = styles[type];

  return (
    <span
      style={{
        display: "inline-block",
        backgroundColor: s.bg,
        color: s.color,
        fontSize: "12px",
        fontWeight: 700,
        padding: "4px 12px",
        borderRadius: "999px",
        textTransform: "uppercase" as const,
        letterSpacing: "0.5px",
      }}
    >
      {children}
    </span>
  );
}

// Detail box for key-value info
export function DetailBox({ children }: { children: ReactNode }) {
  return (
    <Section
      style={{
        backgroundColor: "#f8fafc",
        borderRadius: "8px",
        padding: "20px 24px",
        margin: "16px 0",
      }}
    >
      {children}
    </Section>
  );
}

// Reusable heading style
export const headingStyle = {
  fontFamily: fonts.heading,
  fontSize: "22px",
  fontWeight: 700 as const,
  color: colors.text,
  margin: "0 0 16px 0",
};

// Reusable paragraph style
export const paragraphStyle = {
  fontSize: "15px",
  lineHeight: "24px",
  color: colors.textMuted,
  margin: "0 0 16px 0",
};

export { colors, fonts };
