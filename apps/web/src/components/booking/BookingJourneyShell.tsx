"use client";

import { Check } from "lucide-react";
import { usePathname } from "next/navigation";

const steps = [
  ["session", "Session"],
  ["tickets", "Tickets"],
  ["participants", "Participants"],
  ["addons", "Add-ons"],
  ["details", "Your details"],
  ["review", "Review"],
  ["payment", "Payment"],
  ["confirmation", "Confirmation"],
] as const;

export function BookingJourneyShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const activeIndex = Math.max(
    0,
    steps.findIndex(([slug]) => pathname.endsWith(`/${slug}`)),
  );

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-6xl px-5 py-5 sm:px-8">
          <p className="text-lg font-bold">Glacier</p>
          <p className="mt-1 text-sm text-slate-500">Secure Event booking</p>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        <nav aria-label="Booking progress" className="overflow-x-auto pb-3">
          <ol className="flex min-w-max gap-2">
            {steps.map(([slug, label], index) => {
              const complete = index < activeIndex;
              const active = index === activeIndex;
              return (
                <li
                  key={slug}
                  aria-current={active ? "step" : undefined}
                  className={[
                    "flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold",
                    active ? "border-slate-950 bg-slate-950 text-white" : "bg-white text-slate-500",
                  ].join(" ")}
                >
                  <span className="grid size-5 place-items-center rounded-full border text-[11px]">
                    {complete ? <Check className="size-3" /> : index + 1}
                  </span>
                  {label}
                </li>
              );
            })}
          </ol>
        </nav>
        {children}
      </div>
    </main>
  );
}
