"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { EventTab } from "./EventTabs";

const setupSteps: Array<{
  label: string;
  tab: EventTab;
  detail: string;
}> = [
  {
    label: "Sessions",
    tab: "Sessions",
    detail: "Create the operating timetable and choose draft or active Sessions.",
  },
  {
    label: "Ticket Types",
    tab: "Ticket Types",
    detail: "Set prices, age ranges and POS presentation.",
  },
  {
    label: "Products & Rules",
    tab: "Products",
    detail: "Add operational Products, capacity and Ticket requirements.",
  },
  {
    label: "Waiver",
    tab: "Waiver",
    detail: "Generate and publish the Event-specific approved version.",
  },
  {
    label: "Website",
    tab: "Website",
    detail: "Review branding and the draft public experience.",
  },
  {
    label: "Operations",
    tab: "Settings",
    detail: "Confirm Flexible Tickets, entry policy and operational settings.",
  },
  {
    label: "Review & activate",
    tab: "Overview",
    detail: "Resolve readiness items and deliberately activate the Event.",
  },
];

export function EventSetupGuide({
  activeTab,
  onNavigate,
}: {
  activeTab: EventTab;
  onNavigate: (tab: EventTab) => void;
}) {
  const currentIndex = Math.max(
    setupSteps.findIndex(({ tab }) => tab === activeTab),
    0,
  );
  const current = setupSteps[currentIndex];

  return (
    <section className="rounded-2xl border border-sky-200 bg-sky-50/70 p-5 shadow-sm">
      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-sky-700">
            Guided Event setup
          </p>
          <h2 className="mt-1 text-xl font-semibold text-sky-950">
            Step {currentIndex + 1} of {setupSteps.length}: {current.label}
          </h2>
          <p className="mt-1 text-sm text-sky-900">{current.detail}</p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={currentIndex === 0}
            onClick={() => onNavigate(setupSteps[currentIndex - 1].tab)}
          >
            <ArrowLeft /> Back
          </Button>
          {currentIndex < setupSteps.length - 1 ? (
            <Button
              type="button"
              onClick={() => onNavigate(setupSteps[currentIndex + 1].tab)}
            >
              Continue setup <ArrowRight />
            </Button>
          ) : null}
        </div>
      </div>

      <ol className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-7">
        {setupSteps.map((step, index) => (
          <li key={step.label}>
            <button
              type="button"
              onClick={() => onNavigate(step.tab)}
              className={`flex h-full w-full items-start gap-2 rounded-lg border px-3 py-3 text-left text-xs transition ${
                index === currentIndex
                  ? "border-sky-600 bg-white font-semibold text-sky-950"
                  : "border-sky-100 bg-white/70 text-slate-600 hover:bg-white"
              }`}
            >
              <span className="flex size-4 shrink-0 items-center justify-center rounded-full border text-[10px]">
                {index + 1}
              </span>
              <span>{step.label}</span>
            </button>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-xs text-sky-800">
        Save changes inside each workspace before continuing. Specialist Event
        tabs remain available for later edits, and moving forward never
        publishes drafts or bypasses readiness checks.
      </p>
    </section>
  );
}
