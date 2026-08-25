import {
  ClerkLoaded,
  ClerkLoading,
  SignInButton,
  SignUpButton,
  Show,
} from "@clerk/nextjs";
import { Loader } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { translate } from "@/lib/i18n/messages";
import { getRequestLocale } from "@/lib/i18n/server";
import { isClerkConfigured } from "@/lib/preview-mode";

export default async function MarketingPage() {
  const locale = await getRequestLocale();
  const authEnabled = isClerkConfigured({
    publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    secretKey: process.env.CLERK_SECRET_KEY,
  });

  return (
    <div className="mx-auto flex w-full max-w-[988px] flex-1 flex-col items-center justify-center gap-2 p-4 lg:flex-row">
      <div className="relative mb-8 h-[240px] w-[240px] lg:mb-0 lg:h-[424px] lg:w-[424px]">
        <Image src="/hero.svg" alt="Hero" fill loading="eager" />
      </div>

      <div className="flex flex-col items-center gap-y-8">
        <h1 className="max-w-[480px] text-center text-xl font-bold text-neutral-600 lg:text-3xl">
          {translate(locale, "marketing.headline")}
        </h1>

        <div className="flex w-full max-w-[330px] flex-col items-center gap-y-3">
          {authEnabled ? (
            <>
              <ClerkLoading>
                <Loader className="h-5 w-5 animate-spin text-muted-foreground" />
              </ClerkLoading>

              <ClerkLoaded>
                <Show when="signed-in">
                  <Button
                    size="lg"
                    variant="secondary"
                    className="w-full"
                    asChild
                  >
                    <Link href="/learn" prefetch>
                      {translate(locale, "navigation.learn")}
                    </Link>
                  </Button>
                </Show>

                <Show when="signed-out">
                  <SignUpButton mode="modal">
                    <Button size="lg" variant="secondary" className="w-full">
                      {translate(locale, "marketing.getStarted")}
                    </Button>
                  </SignUpButton>

                  <SignInButton mode="modal">
                    <Button
                      size="lg"
                      variant="primaryOutline"
                      className="w-full"
                    >
                      {translate(locale, "marketing.existingAccount")}
                    </Button>
                  </SignInButton>
                </Show>
              </ClerkLoaded>
            </>
          ) : (
            <div className="w-full rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 text-center">
              <p className="font-bold text-amber-700">
                {translate(locale, "marketing.previewTitle")}
              </p>
              <p className="mt-1 text-sm text-amber-700/80">
                {translate(locale, "marketing.previewDescription")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
