import type { PropsWithChildren } from "react";

import { MobileHeader } from "@/components/mobile-header";
import { Sidebar } from "@/components/sidebar";

const MainLayout = ({ children }: PropsWithChildren) => {
  return (
    <>
      <MobileHeader />
      <Sidebar className="hidden lg:flex" />
      <main
        id="main-content"
        className="h-full pt-[50px] lg:pl-[256px] lg:pt-0"
      >
        <div className="mx-auto h-full max-w-[1056px] px-4 pt-6 sm:px-6 lg:px-0">
          {children}
        </div>
      </main>
    </>
  );
};

export default MainLayout;
