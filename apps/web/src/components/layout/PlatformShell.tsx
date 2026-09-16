import { ReactNode } from "react";

import { PlatformMobileNav, PlatformSidebar } from "@/components/navigation/PlatformSidebar";
import { PlatformTopBar } from "@/components/navigation/PlatformTopBar";

interface PlatformShellProps {
  children: ReactNode;
}

export function PlatformShell({
  children,
}: PlatformShellProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="print:hidden"><PlatformSidebar /></div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="print:hidden"><PlatformTopBar /></div>
        <div className="print:hidden"><PlatformMobileNav /></div>

        <main className="flex-1 p-4 print:p-0 sm:p-6 lg:p-7">
          <div className="mx-auto w-full max-w-7xl print:max-w-none">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
