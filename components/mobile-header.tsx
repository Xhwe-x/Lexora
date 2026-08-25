import { MobileSidebar } from "./mobile-sidebar";

export const MobileHeader = () => {
  return (
    <nav className="fixed top-0 z-50 flex h-[54px] w-full items-center border-b border-teal-800/20 bg-teal-700 px-4 shadow-md lg:hidden">
      <MobileSidebar />
    </nav>
  );
};
