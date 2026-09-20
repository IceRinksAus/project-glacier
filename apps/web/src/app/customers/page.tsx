"use client";

import { Suspense } from "react";

import { CustomersWorkspace } from "@/components/customers/CustomersWorkspace";
import { PlatformShell } from "@/components/layout/PlatformShell";

export default function CustomersPage() {
  return (
    <Suspense fallback={<PlatformShell><p className="rounded-xl border bg-card p-6">Loading Customers...</p></PlatformShell>}>
      <CustomersWorkspace />
    </Suspense>
  );
}
