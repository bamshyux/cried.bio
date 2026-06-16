import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { GlobalSiteBanner } from "@/components/admin/global-site-banner";
import { CookieConsentBanner } from "@/components/cookie-consent-banner";
import { SchemaErrorBanner } from "@/components/dev/schema-error-banner";
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
  const schema = await getProfileSettingsSchemaValidation();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {!schema.ok && (
          <SchemaErrorBanner message={schema.message} missing={schema.missing} />
        )}
        <GlobalSiteBanner />
        {children}
        <CookieConsentBanner />
      </body>
    </html>
  );
}
