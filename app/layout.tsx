import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { DiscordCommunityPromo } from "@/components/discord/discord-community-promo";
import { AuthHashRecoveryRedirect } from "@/components/auth/auth-hash-recovery-redirect";
import { CookieConsentBanner } from "@/components/cookie-consent-banner";
import { SupportShell } from "@/components/support/support-shell";
import {
  DatabaseUnavailableBanner,
  SchemaErrorBanner,
} from "@/components/dev/schema-error-banner";
import { DATABASE_UNAVAILABLE_USER_MESSAGE, logDatabaseError } from "@/lib/db/errors";
import type { SchemaValidationResult } from "@/lib/db/schema";
import { getProfileSettingsSchemaValidation } from "@/lib/db/validate-schema";
import { siteMetadata } from "@/lib/metadata";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = siteMetadata;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let schema: SchemaValidationResult = { ok: true };
  try {
    schema = await getProfileSettingsSchemaValidation();
  } catch (error) {
    logDatabaseError("root layout schema validation", error);
    schema = {
      ok: false,
      kind: "unavailable",
      missing: [],
      message: DATABASE_UNAVAILABLE_USER_MESSAGE,
    };
  }

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthHashRecoveryRedirect />
        {!schema.ok && schema.kind === "unavailable" ? <DatabaseUnavailableBanner /> : null}
        {!schema.ok && schema.kind === "schema" ? (
          <SchemaErrorBanner message={schema.message} missing={schema.missing} />
        ) : null}
        {children}
        <SupportShell />
        <CookieConsentBanner />
      </body>
    </html>
  );
}
