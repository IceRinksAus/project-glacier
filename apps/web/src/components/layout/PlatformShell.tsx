import { ReactNode } from "react";

import { PlatformSidebar } from "@/components/navigation/PlatformSidebar";
import { PlatformTopBar } from "@/components/navigation/PlatformTopBar";

interface PlatformShellProps {
  children: ReactNode;
}

export function PlatformShell({
  children,
}: PlatformShellProps) {
  return (
    <div className="flex min-h-screen bg-muted/30">
      <PlatformSidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <PlatformTopBar />

        <main className="flex-1 p-6 lg:p-8">
          <div className="mx-auto w-full max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}