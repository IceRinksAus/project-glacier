"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

import {
  operationalScheduleService,
  OperationalSchedulePattern,
} from "@/services/operational-schedule.service";

import { ScheduleReviewStep } from "./ScheduleReviewStep";
import {
  ScheduleTimetableStep,
  TimetableEntry,
} from "./ScheduleTimetableStep";

interface ScheduleBuilderProps {
  eventId: string;
  pattern: OperationalSchedulePattern;
  eventStartDate: string;
  eventEndDate: string;
  onBack: () => void;
  onCancel: () => void;
  onComplete: () => void;
}

function toDateInputValue(date: string) {
  return date.slice(0, 10);
}

export function ScheduleBuilder({
  eventId,
  pattern,
  eventStartDate,
  eventEndDate,
  onBack,
  onCancel,
  onComplete,
}: ScheduleBuilderProps) {
  const minimumDate = toDateInputValue(eventStartDate);
  const maximumDate = toDateInputValue(eventEndDate);

  const [step, setStep] = useState(1);

  const [scheduleName, setScheduleName] = useState("");
  const [startDate, setStartDate] = useState(minimumDate);
  const [endDate, setEndDate] = useState(maximumDate);
  const [entries, setEntries] = useState<TimetableEntry[]>([]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState("");

  if (step === 2) {
    return (
      <ScheduleTimetableStep
        entries={entries}
        setEntries={setEntries}
        onBack={() => setStep(1)}
        onCancel={onCancel}
        onNext={() => setStep(3)}
      />
    );
  }

  if (step === 3) {
    return (
      <ScheduleReviewStep
        scheduleName={scheduleName}
        startDate={startDate}
        endDate={endDate}
        entries={entries}
        onBack={() => setStep(2)}
        onCancel={onCancel}
        onGenerate={async () => {
          try {
            setIsGenerating(true);
            setGenerateError("");

            await operationalScheduleService.createSchedule({
              eventId,
              name: scheduleName,
              pattern,
              startDate,
              endDate,
              timetable: entries,
            });

            onComplete();
          } catch (error) {
            setGenerateError(
              error instanceof Error
                ? error.message
                : "Unable to generate schedule",
            );
          } finally {
            setIsGenerating(false);
          }
        }}
      />
    );
  }

  return (
    <div className="w-full max-w-3xl rounded-2xl border bg-background p-6 shadow-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Step 1 of 3
          </p>

          <h2 className="mt-1 text-2xl font-semibold tracking-tight">
            Schedule details
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            Define when this operating schedule applies.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>

      <div className="mt-8 space-y-6">
        <div>
          <label
            htmlFor="schedule-name"
            className="text-sm font-medium"
          >
            Schedule name
          </label>

          <input
            id="schedule-name"
            type="text"
            value={scheduleName}
            onChange={(event) =>
              setScheduleName(event.target.value)
            }
            placeholder="e.g. Daily Public Skating"
            className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />

          <p className="mt-2 text-sm text-muted-foreground">
            Give this schedule a name that will be easy to recognise later.
          </p>
        </div>

        <div>
          <p className="text-sm font-medium">
            Schedule dates
          </p>

          <p className="mt-1 text-sm text-muted-foreground">
            The schedule must remain within the event dates.
          </p>

          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="schedule-start-date"
                className="text-sm text-muted-foreground"
              >
                Start date
              </label>

              <input
                id="schedule-start-date"
                type="date"
                value={startDate}
                min={minimumDate}
                max={endDate}
                onChange={(event) =>
                  setStartDate(event.target.value)
                }
                className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label
                htmlFor="schedule-end-date"
                className="text-sm text-muted-foreground"
              >
                End date
              </label>

              <input
                id="schedule-end-date"
                type="date"
                value={endDate}
                min={startDate}
                max={maximumDate}
                onChange={(event) =>
                  setEndDate(event.target.value)
                }
                className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        </div>
      </div>

      {generateError ? (
        <div className="mt-6 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {generateError}
        </div>
      ) : null}

      <div className="mt-8 flex items-center justify-between border-t pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
        >
          Back
        </Button>

        <Button
          type="button"
          disabled={!scheduleName.trim() || isGenerating}
          onClick={() => setStep(2)}
        >
          Next: Build timetable
        </Button>
      </div>
    </div>
  );
}