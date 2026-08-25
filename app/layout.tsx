import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";

import { ExitModal } from "@/components/modals/exit-modal";
import { HeartsModal } from "@/components/modals/hearts-modal";
import { PracticeModal } from "@/components/modals/practice-modal";
import { SkipLink } from "@/components/skip-link";
import { Toaster } from "@/components/ui/sonner";
import { siteConfig } from "@/config";
import { LocaleProvider } from "@/lib/i18n/provider";
import { getRequestLocale } from "@/lib/i18n/server";
import { isClerkConfigured } from "@/lib/preview-mode";

import "./globals.css";

const font = Nunito({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: "#0f766e",
};

export const metadata: Metadata = siteConfig;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialLocale = await getRequestLocale();
  const clerkConfigured = isClerkConfigured({
    publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    secretKey: process.env.CLERK_SECRET_KEY,
  });
  const document = (
    <html lang={initialLocale}>
      <body className={font.className}>
        <LocaleProvider initialLocale={initialLocale}>
          <SkipLink />
          <Toaster theme="light" richColors closeButton />
          <ExitModal />
          <HeartsModal />
          <PracticeModal />
          {children}
        </LocaleProvider>
      </body>
    </html>
  );

  if (!clerkConfigured) return document;

  return (
    <ClerkProvider
      appearance={{
        options: {
          logoImageUrl: "/favicon.ico",
        },
        variables: {
          colorPrimary: "#22C55E",
        },
      }}
      telemetry={false}
      afterSignOutUrl="/"
    >
      {document}
    </ClerkProvider>
  );
}
