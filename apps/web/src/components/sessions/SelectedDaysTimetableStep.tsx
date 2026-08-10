"use client";

import type {
  Dispatch,
  SetStateAction,
} from "react";

import { Button } from "@/components/ui/button";

import type { TimetableEntry } from "./ScheduleTimetableStep";

interface SelectedDaysTimetableStepProps {
  selectedDays: number[];
  setSelectedDays: Dispatch<
    SetStateAction<number[]>
  >;
  entries: TimetableEntry[];
  setEntries: Dispatch<
    SetStateAction<TimetableEntry[]>
  >;
  onBack: () => void;
  onCancel: () => void;
  onNext: () => void;
}

const days = [
  {
    value: 1,
    label: "Monday",
  },
  {
    value: 2,
    label: "Tuesday",
  },
  {
    value: 3,
    label: "Wednesday",
  },
  {
    value: 4,
    label: "Thursday",
  },
  {
    value: 5,
    label: "Friday",
  },
  {
    value: 6,
    label: "Saturday",
  },
  {
    value: 0,
    label: "Sunday",
  },
];

function createEntry(): TimetableEntry {
  return {
    id: crypto.randomUUID(),
    name: "",
    startTime: "",
    duration: 60,
    capacity: 200,
    type: "BOOKABLE",
  };
}

export function SelectedDaysTimetableStep({
  selectedDays,
  setSelectedDays,
  entries,
  setEntries,
  onBack,
  onCancel,
  onNext,
}: SelectedDaysTimetableStepProps) {
  function toggleDay(day: number) {
    setSelectedDays((currentDays) =>
      currentDays.includes(day)
        ? currentDays.filter(
            (currentDay) =>
              currentDay !== day,
          )
        : [...currentDays, day],
    );
  }

  function updateEntry(
    id: string,
    field: keyof TimetableEntry,
    value: string | number,
  ) {
    setEntries((currentEntries) =>
      currentEntries.map((entry) =>
        entry.id === id
          ? {
              ...entry,
              [field]: value,
            }
          : entry,
      ),
    );
  }

  function removeEntry(id: string) {
    setEntries((currentEntries) =>
      currentEntries.filter(
        (entry) => entry.id !== id,
      ),
    );
  }

  const hasInvalidEntry =
    entries.some(
      (entry) =>
        !entry.name.trim() ||
        !entry.startTime ||
        entry.duration <= 0 ||
        (entry.type === "BOOKABLE" &&
          entry.capacity <= 0),
    );

  const canContinue =
    selectedDays.length > 0 &&
    entries.length > 0 &&
    !hasInvalidEntry;

  return (
    <div className="w-full max-w-5xl rounded-2xl border bg-background p-6 shadow-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Step 2 of 3
          </p>

          <h2 className="mt-1 text-2xl font-semibold tracking-tight">
            Choose days and build timetable
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            Select which weekdays this
            timetable applies to, then add
            the activities for those days.
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

      <section className="mt-8 rounded-xl border bg-card p-6">
        <div>
          <h3 className="text-lg font-semibold">
            Selected days
          </h3>

          <p className="mt-1 text-sm text-muted-foreground">
            Glacier will apply this
            timetable only to the selected
            weekdays inside the schedule
            date range.
          </p>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
          {days.map((day) => {
            const isSelected =
              selectedDays.includes(
                day.value,
              );

            return (
              <button
                key={day.value}
                type="button"
                aria-pressed={isSelected}
                onClick={() =>
                  toggleDay(day.value)
                }
                className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                  isSelected
                    ? "border-foreground bg-muted"
                    : "hover:border-foreground/20 hover:bg-muted/50"
                }`}
              >
                <p className="font-medium">
                  {day.label}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  {isSelected
                    ? "Selected"
                    : "Not selected"}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-6 rounded-xl border bg-card p-6">
        <div>
          <h3 className="text-lg font-semibold">
            Timetable
          </h3>

          <p className="mt-1 text-sm text-muted-foreground">
            These activities will be
            generated on each selected day.
          </p>
        </div>

        <div className="mt-6 space-y-4">
          {entries.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center">
              <p className="font-medium">
                No timetable entries yet
              </p>

              <p className="mt-2 text-sm text-muted-foreground">
                Add the first activity for
                the selected days.
              </p>

              <Button
                type="button"
                className="mt-4"
                onClick={() =>
                  setEntries([
                    ...entries,
                    createEntry(),
                  ])
                }
              >
                + Add activity
              </Button>
            </div>
          ) : (
            <>
              {entries.map(
                (entry, index) => (
                  <div
                    key={entry.id}
                    className="rounded-xl border p-5"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-semibold">
                        Activity{" "}
                        {index + 1}
                      </p>

                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() =>
                          removeEntry(
                            entry.id,
                          )
                        }
                      >
                        Remove
                      </Button>
                    </div>

                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="text-sm font-medium">
                          Activity name
                        </label>

                        <input
                          type="text"
                          value={entry.name}
                          placeholder="e.g. Public Skate"
                          onChange={(
                            event,
                          ) =>
                            updateEntry(
                              entry.id,
                              "name",
                              event.target
                                .value,
                            )
                          }
                          className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium">
                          Start time
                        </label>

                        <input
                          type="time"
                          value={
                            entry.startTime
                          }
                          onChange={(
                            event,
                          ) =>
                            updateEntry(
                              entry.id,
                              "startTime",
                              event.target
                                .value,
                            )
                          }
                          className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium">
                          Duration
                        </label>

                        <div className="mt-2 flex items-center gap-2">
                          <input
                            type="number"
                            min={1}
                            value={
                              entry.duration
                            }
                            onChange={(
                              event,
                            ) =>
                              updateEntry(
                                entry.id,
                                "duration",
                                Number(
                                  event
                                    .target
                                    .value,
                                ),
                              )
                            }
                            className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                          />

                          <span className="text-sm text-muted-foreground">
                            minutes
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium">
                          Activity type
                        </label>

                        <select
                          value={
                            entry.type
                          }
                          onChange={(
                            event,
                          ) =>
                            updateEntry(
                              entry.id,
                              "type",
                              event.target
                                .value,
                            )
                          }
                          className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                        >
                          <option value="BOOKABLE">
                            Bookable session
                          </option>

                          <option value="OPERATIONAL">
                            Operational block
                          </option>
                        </select>
                      </div>

                      {entry.type ===
                      "BOOKABLE" ? (
                        <div>
                          <label className="text-sm font-medium">
                            Capacity
                          </label>

                          <input
                            type="number"
                            min={1}
                            value={
                              entry.capacity
                            }
                            onChange={(
                              event,
                            ) =>
                              updateEntry(
                                entry.id,
                                "capacity",
                                Number(
                                  event
                                    .target
                                    .value,
                                ),
                              )
                            }
                            className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                          />
                        </div>
                      ) : null}
                    </div>
                  </div>
                ),
              )}

              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setEntries([
                    ...entries,
                    createEntry(),
                  ])
                }
              >
                + Add another activity
              </Button>
            </>
          )}
        </div>
      </section>

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
          onClick={onNext}
          disabled={!canContinue}
        >
          Next: Review schedule
        </Button>
      </div>
    </div>
  );
}