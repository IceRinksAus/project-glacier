"use client";

import { Button } from "@/components/ui/button";

import type { OperationalSchedulePattern } from "@/services/operational-schedule.service";
import type { ManualScheduleDay } from "./ManualScheduleStep";
import type { TimetableEntry } from "./ScheduleTimetableStep";

interface ScheduleReviewStepProps {
  scheduleName: string;
  pattern: OperationalSchedulePattern;
  startDate: string;
  endDate: string;

  entries: TimetableEntry[];
  weekdayEntries?: TimetableEntry[];
  weekendEntries?: TimetableEntry[];
  selectedDays?: number[];
  manualDays?: ManualScheduleDay[];

  isGenerating: boolean;
  generateError: string;

  onBack: () => void;
  onCancel: () => void;
  onGenerate: () => void;
}

const dayNames: Record<number, string> = {
  0: "Sunday",
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
};

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

  const millisecondsPerDay =
    1000 * 60 * 60 * 24;

  return (
    Math.floor(
      (end.getTime() - start.getTime()) /
        millisecondsPerDay,
    ) + 1
  );
}

function calculateWeekdayWeekendDays(
  startDate: string,
  endDate: string,
) {
  const currentDate = parseDate(startDate);
  const finalDate = parseDate(endDate);

  let weekdayDays = 0;
  let weekendDays = 0;

  while (currentDate <= finalDate) {
    const dayOfWeek =
      currentDate.getUTCDay();

    if (
      dayOfWeek === 0 ||
      dayOfWeek === 6
    ) {
      weekendDays += 1;
    } else {
      weekdayDays += 1;
    }

    currentDate.setUTCDate(
      currentDate.getUTCDate() + 1,
    );
  }

  return {
    weekdayDays,
    weekendDays,
  };
}

function calculateSelectedOperatingDays(
  startDate: string,
  endDate: string,
  selectedDays: number[],
) {
  const currentDate = parseDate(startDate);
  const finalDate = parseDate(endDate);

  let matchingDays = 0;

  while (currentDate <= finalDate) {
    const dayOfWeek =
      currentDate.getUTCDay();

    if (selectedDays.includes(dayOfWeek)) {
      matchingDays += 1;
    }

    currentDate.setUTCDate(
      currentDate.getUTCDate() + 1,
    );
  }

  return matchingDays;
}

function formatTime(time: string) {
  const [hours, minutes] = time
    .split(":")
    .map(Number);

  const date = new Date();

  date.setHours(
    hours,
    minutes,
    0,
    0,
  );

  return date.toLocaleTimeString(
    "en-AU",
    {
      hour: "2-digit",
      minute: "2-digit",
    },
  );
}

function calculateCapacity(
  entries: TimetableEntry[],
) {
  return entries
    .filter(
      (entry) =>
        entry.type === "BOOKABLE",
    )
    .reduce(
      (total, entry) =>
        total + entry.capacity,
      0,
    );
}

function renderTimetable(
  title: string,
  description: string,
  entries: TimetableEntry[],
) {
  return (
    <section className="rounded-xl border bg-card p-6">
      <div>
        <h3 className="text-lg font-semibold">
          {title}
        </h3>

        <p className="mt-1 text-sm text-muted-foreground">
          {description}
        </p>
      </div>

      <div className="mt-6 space-y-3">
        {entries
          .slice()
          .sort((a, b) =>
            a.startTime.localeCompare(
              b.startTime,
            ),
          )
          .map((entry) => (
            <div
              key={entry.id}
              className="flex flex-col justify-between gap-3 rounded-lg border p-4 sm:flex-row sm:items-center"
            >
              <div className="flex items-start gap-5">
                <div className="min-w-20">
                  <p className="font-semibold">
                    {formatTime(
                      entry.startTime,
                    )}
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
                {entry.type ===
                "BOOKABLE" ? (
                  <>
                    <p className="font-medium">
                      Bookable session
                    </p>

                    <p className="mt-1 text-muted-foreground">
                      Capacity{" "}
                      {entry.capacity}
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
  );
}

export function ScheduleReviewStep({
  scheduleName,
  pattern,
  startDate,
  endDate,
  entries,
  weekdayEntries = [],
  weekendEntries = [],
  selectedDays = [],
  manualDays = [],
  isGenerating,
  generateError,
  onBack,
  onCancel,
  onGenerate,
}: ScheduleReviewStepProps) {
  const calendarDays =
    calculateInclusiveDays(
      startDate,
      endDate,
    );

  let operatingDays = calendarDays;
  let generatedSessions = 0;
  let generatedOperationalBlocks = 0;
  let totalAdmissionCapacity = 0;

  let weekdayDays = 0;
  let weekendDays = 0;

  if (
    pattern === "WEEKDAY_WEEKEND"
  ) {
    const dayCounts =
      calculateWeekdayWeekendDays(
        startDate,
        endDate,
      );

    weekdayDays =
      dayCounts.weekdayDays;

    weekendDays =
      dayCounts.weekendDays;

    const weekdayBookableEntries =
      weekdayEntries.filter(
        (entry) =>
          entry.type === "BOOKABLE",
      );

    const weekendBookableEntries =
      weekendEntries.filter(
        (entry) =>
          entry.type === "BOOKABLE",
      );

    const weekdayOperationalEntries =
      weekdayEntries.filter(
        (entry) =>
          entry.type === "OPERATIONAL",
      );

    const weekendOperationalEntries =
      weekendEntries.filter(
        (entry) =>
          entry.type === "OPERATIONAL",
      );

    generatedSessions =
      weekdayBookableEntries.length *
        weekdayDays +
      weekendBookableEntries.length *
        weekendDays;

    generatedOperationalBlocks =
      weekdayOperationalEntries.length *
        weekdayDays +
      weekendOperationalEntries.length *
        weekendDays;

    totalAdmissionCapacity =
      calculateCapacity(
        weekdayEntries,
      ) *
        weekdayDays +
      calculateCapacity(
        weekendEntries,
      ) *
        weekendDays;
  } else if (
    pattern === "SELECTED_DAYS"
  ) {
    operatingDays =
      calculateSelectedOperatingDays(
        startDate,
        endDate,
        selectedDays,
      );

    const bookableEntries =
      entries.filter(
        (entry) =>
          entry.type === "BOOKABLE",
      );

    const operationalEntries =
      entries.filter(
        (entry) =>
          entry.type === "OPERATIONAL",
      );

    generatedSessions =
      bookableEntries.length *
      operatingDays;

    generatedOperationalBlocks =
      operationalEntries.length *
      operatingDays;

    totalAdmissionCapacity =
      calculateCapacity(entries) *
      operatingDays;
  } else if (
    pattern === "MANUAL"
  ) {
    operatingDays = manualDays.length;

    generatedSessions =
      manualDays.reduce(
        (total, manualDay) =>
          total +
          manualDay.timetable.filter(
            (entry) =>
              entry.type === "BOOKABLE",
          ).length,
        0,
      );

    generatedOperationalBlocks =
      manualDays.reduce(
        (total, manualDay) =>
          total +
          manualDay.timetable.filter(
            (entry) =>
              entry.type === "OPERATIONAL",
          ).length,
        0,
      );

    totalAdmissionCapacity =
      manualDays.reduce(
        (total, manualDay) =>
          total +
          calculateCapacity(
            manualDay.timetable,
          ),
        0,
      );
  } else {
    const bookableEntries =
      entries.filter(
        (entry) =>
          entry.type === "BOOKABLE",
      );

    const operationalEntries =
      entries.filter(
        (entry) =>
          entry.type === "OPERATIONAL",
      );

    generatedSessions =
      bookableEntries.length *
      operatingDays;

    generatedOperationalBlocks =
      operationalEntries.length *
      operatingDays;

    totalAdmissionCapacity =
      calculateCapacity(entries) *
      operatingDays;
  }

  const selectedDayNames =
    selectedDays
      .slice()
      .sort((a, b) => {
        const order = [
          1, 2, 3, 4, 5, 6, 0,
        ];

        return (
          order.indexOf(a) -
          order.indexOf(b)
        );
      })
      .map(
        (day) =>
          dayNames[day] ??
          `Day ${day}`,
      );

  const sortedManualDays =
    manualDays
      .slice()
      .sort((a, b) =>
        a.date.localeCompare(b.date),
      );

  return (
    <div className="w-full max-w-5xl rounded-2xl border bg-background p-6 shadow-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Step 3 of 3
          </p>

          <h2 className="mt-1 text-2xl font-semibold tracking-tight">
            Review schedule
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            Review what Glacier will
            generate before creating the
            schedule.
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
          {formatDate(startDate)} —{" "}
          {formatDate(endDate)}
        </p>

        {pattern ===
        "WEEKDAY_WEEKEND" ? (
          <p className="mt-2 text-sm text-muted-foreground">
            {weekdayDays} weekday
            {weekdayDays === 1
              ? ""
              : "s"}{" "}
            · {weekendDays} weekend day
            {weekendDays === 1
              ? ""
              : "s"}
          </p>
        ) : null}

        {pattern ===
        "SELECTED_DAYS" ? (
          <div className="mt-3">
            <p className="text-sm font-medium">
              Selected weekdays
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              {selectedDayNames.join(
                ", ",
              )}
            </p>
          </div>
        ) : null}

        {pattern ===
        "MANUAL" ? (
          <div className="mt-3">
            <p className="text-sm font-medium">
              Manual dates
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              {sortedManualDays
                .map((manualDay) =>
                  formatDate(
                    manualDay.date,
                  ),
                )
                .join(", ")}
            </p>
          </div>
        ) : null}
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">
            Operating days
          </p>

          <p className="mt-2 text-2xl font-semibold">
            {operatingDays}
          </p>

          {pattern ===
          "SELECTED_DAYS" ? (
            <p className="mt-1 text-xs text-muted-foreground">
              matching selected weekdays
            </p>
          ) : null}

          {pattern ===
          "MANUAL" ? (
            <p className="mt-1 text-xs text-muted-foreground">
              exact manual dates
            </p>
          ) : null}
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
            {totalAdmissionCapacity.toLocaleString(
              "en-AU",
            )}
          </p>
        </div>
      </section>

      {pattern ===
      "WEEKDAY_WEEKEND" ? (
        <div className="mt-6 space-y-6">
          {renderTimetable(
            "Weekday timetable",
            `Applies Monday through Friday across ${weekdayDays} operating day${
              weekdayDays === 1
                ? ""
                : "s"
            }.`,
            weekdayEntries,
          )}

          {renderTimetable(
            "Weekend timetable",
            `Applies Saturday and Sunday across ${weekendDays} operating day${
              weekendDays === 1
                ? ""
                : "s"
            }.`,
            weekendEntries,
          )}
        </div>
      ) : pattern ===
        "SELECTED_DAYS" ? (
        <div className="mt-6">
          {renderTimetable(
            "Selected days timetable",
            `Applies on ${selectedDayNames.join(
              ", ",
            )} across ${operatingDays} matching operating day${
              operatingDays === 1
                ? ""
                : "s"
            }.`,
            entries,
          )}
        </div>
      ) : pattern === "MANUAL" ? (
        <div className="mt-6 space-y-6">
          {sortedManualDays.map(
            (manualDay) =>
              renderTimetable(
                formatDate(
                  manualDay.date,
                ),
                "Applies only to this exact date.",
                manualDay.timetable,
              ),
          )}
        </div>
      ) : (
        <div className="mt-6">
          {renderTimetable(
            "Daily timetable",
            "This timetable will be applied to each operating day in the schedule.",
            entries,
          )}
        </div>
      )}

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