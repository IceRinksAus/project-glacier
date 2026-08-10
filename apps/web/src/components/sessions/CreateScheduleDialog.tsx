"use client";

import { X } from "lucide-react";

import { Button } from "@/components/ui/button";

export type SchedulePattern =
  | "DAILY"
  | "WEEKDAY_WEEKEND"
  | "SELECTED_DAYS"
  | "MANUAL";

interface CreateScheduleDialogProps {
  open: boolean;
  onClose: () => void;
  onSelectPattern: (pattern: SchedulePattern) => void;
}

const schedulePatterns: {
  value: SchedulePattern;
  title: string;
  description: string;
}[] = [
  {
    value: "DAILY",
    title: "Same timetable every day",
    description:
      "Create one operating timetable and apply it across all event dates.",
  },
  {
    value: "WEEKDAY_WEEKEND",
    title: "Weekday and weekend timetables",
    description:
      "Use one timetable for weekdays and another for weekends.",
  },
  {
    value: "SELECTED_DAYS",
    title: "Selected days",
    description:
      "Choose specific weekdays or event dates for this timetable.",
  },
  {
    value: "MANUAL",
    title: "Build manually",
    description:
      "Create individual sessions without applying a recurring pattern.",
  },
];

export function CreateScheduleDialog({
  open,
  onClose,
  onSelectPattern,
}: CreateScheduleDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-schedule-title"
        className="w-full max-w-2xl rounded-2xl border bg-background p-6 shadow-xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id="create-schedule-title"
              className="text-2xl font-semibold tracking-tight"
            >
              Create schedule
            </h2>

            <p className="mt-2 text-sm text-muted-foreground">
              Choose how this event normally operates.
            </p>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Close schedule builder"
            onClick={onClose}
          >
            <X className="size-5" />
          </Button>
        </div>

        <div className="mt-6 grid gap-3">
          {schedulePatterns.map((pattern) => (
            <button
              key={pattern.value}
              type="button"
              className="rounded-xl border p-5 text-left transition-colors hover:border-foreground/20 hover:bg-muted/50"
              onClick={() => onSelectPattern(pattern.value)}
            >
              <p className="font-semibold">{pattern.title}</p>

              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {pattern.description}
              </p>
            </button>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>
        </div>
      </section>
    </div>
  );
}