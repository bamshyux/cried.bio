import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SchemaErrorBanner } from "@/components/dev/schema-error-banner";
import { getProfileSettingsSchemaValidation } from "@/lib/db/validate-schema";
import { SITE_HOST } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(`https://${SITE_HOST}`),
  title: "BioForge — Forge your digital identity",
  description: "The modern bio link platform for creators, gamers, and builders.",
};

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
        {children}
      </body>
    </html>
  );
}
