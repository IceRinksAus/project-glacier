"use client";

import { Button } from "@/components/ui/button";

import type { TimetableEntry } from "./ScheduleTimetableStep";

interface ScheduleReviewStepProps {
  scheduleName: string;
  startDate: string;
  endDate: string;
  entries: TimetableEntry[];
  isGenerating: boolean;
  generateError: string;
  onBack: () => void;
  onCancel: () => void;
  onGenerate: () => void;
}

function parseDate(date: string) {
  return new Date(`${date}T00:00:00Z`);
}

function formatDate(date: string) {
  return parseDate(date).toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function calculateInclusiveDays(
  startDate: string,
  endDate: string,
) {
  const start = parseDate(startDate);
  const end = parseDate(endDate);

  const millisecondsPerDay = 1000 * 60 * 60 * 24;

  return (
    Math.floor(
      (end.getTime() - start.getTime()) /
        millisecondsPerDay,
    ) + 1
  );
}

function formatTime(time: string) {
  const [hours, minutes] = time.split(":").map(Number);

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);

  return date.toLocaleTimeString("en-AU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ScheduleReviewStep({
  scheduleName,
  startDate,
  endDate,
  entries,
  isGenerating,
  generateError,
  onBack,
  onCancel,
  onGenerate,
}: ScheduleReviewStepProps) {
  const operatingDays = calculateInclusiveDays(
    startDate,
    endDate,
  );

  const bookableEntries = entries.filter(
    (entry) => entry.type === "BOOKABLE",
  );

  const operationalEntries = entries.filter(
    (entry) => entry.type === "OPERATIONAL",
  );

  const generatedSessions =
    bookableEntries.length * operatingDays;

  const generatedOperationalBlocks =
    operationalEntries.length * operatingDays;

  const capacityPerDay = bookableEntries.reduce(
    (total, entry) => total + entry.capacity,
    0,
  );

  const totalAdmissionCapacity =
    capacityPerDay * operatingDays;

  return (
    <div className="w-full max-w-4xl rounded-2xl border bg-background p-6 shadow-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Step 3 of 3
          </p>

          <h2 className="mt-1 text-2xl font-semibold tracking-tight">
            Review schedule
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            Review what Glacier will generate before creating
            the schedule.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isGenerating}
        >
          Cancel
        </Button>
      </div>

      <section className="mt-8 rounded-xl border bg-card p-6">
        <h3 className="text-xl font-semibold">
          {scheduleName}
        </h3>

        <p className="mt-2 text-sm text-muted-foreground">
          {formatDate(startDate)} — {formatDate(endDate)}
        </p>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">
            Operating days
          </p>

          <p className="mt-2 text-2xl font-semibold">
            {operatingDays}
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">
            Bookable sessions
          </p>

          <p className="mt-2 text-2xl font-semibold">
            {generatedSessions}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            sessions to generate
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">
            Operational blocks
          </p>

          <p className="mt-2 text-2xl font-semibold">
            {generatedOperationalBlocks}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            blocks in schedule
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">
            Total admission capacity
          </p>

          <p className="mt-2 text-2xl font-semibold">
            {totalAdmissionCapacity.toLocaleString("en-AU")}
          </p>
        </div>
      </section>

      <section className="mt-6 rounded-xl border bg-card p-6">
        <div>
          <h3 className="text-lg font-semibold">
            Daily timetable
          </h3>

          <p className="mt-1 text-sm text-muted-foreground">
            This timetable will be applied to each operating
            day in the schedule.
          </p>
        </div>

        <div className="mt-6 space-y-3">
          {entries
            .slice()
            .sort((a, b) =>
              a.startTime.localeCompare(b.startTime),
            )
            .map((entry) => (
              <div
                key={entry.id}
                className="flex flex-col justify-between gap-3 rounded-lg border p-4 sm:flex-row sm:items-center"
              >
                <div className="flex items-start gap-5">
                  <div className="min-w-20">
                    <p className="font-semibold">
                      {formatTime(entry.startTime)}
                    </p>
                  </div>

                  <div>
                    <p className="font-medium">
                      {entry.name}
                    </p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {entry.duration} minutes
                    </p>
                  </div>
                </div>

                <div className="text-sm sm:text-right">
                  {entry.type === "BOOKABLE" ? (
                    <>
                      <p className="font-medium">
                        Bookable session
                      </p>

                      <p className="mt-1 text-muted-foreground">
                        Capacity {entry.capacity}
                      </p>
                    </>
                  ) : (
                    <p className="font-medium text-muted-foreground">
                      Operational block
                    </p>
                  )}
                </div>
              </div>
            ))}
        </div>
      </section>

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
          disabled={isGenerating}
        >
          Back
        </Button>

        <Button
          type="button"
          onClick={onGenerate}
          disabled={isGenerating}
        >
          {isGenerating
            ? "Generating..."
            : "Generate Schedule"}
        </Button>
      </div>
    </div>
  );
}