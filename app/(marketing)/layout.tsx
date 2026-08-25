import type { PropsWithChildren } from "react";

import { isClerkConfigured } from "@/lib/preview-mode";

import { Footer } from "./footer";
import { Header } from "./header";

const MarketingLayout = ({ children }: PropsWithChildren) => {
  const authEnabled = isClerkConfigured({
    publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    secretKey: process.env.CLERK_SECRET_KEY,
  });

  return (
    <div className="flex min-h-screen flex-col">
      <Header authEnabled={authEnabled} />

      <main
        id="main-content"
        className="flex flex-1 flex-col items-center justify-center"
      >
        {children}
      </main>

      <Footer />
    </div>
  );
};

export default MarketingLayout;
