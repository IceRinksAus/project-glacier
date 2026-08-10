"use client";

import type {
  Dispatch,
  SetStateAction,
} from "react";

import { Button } from "@/components/ui/button";

import type { TimetableEntry } from "./ScheduleTimetableStep";

interface WeekdayWeekendTimetableStepProps {
  weekdayEntries: TimetableEntry[];
  setWeekdayEntries: Dispatch<
    SetStateAction<TimetableEntry[]>
  >;
  weekendEntries: TimetableEntry[];
  setWeekendEntries: Dispatch<
    SetStateAction<TimetableEntry[]>
  >;
  onBack: () => void;
  onCancel: () => void;
  onNext: () => void;
}

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

export function WeekdayWeekendTimetableStep({
  weekdayEntries,
  setWeekdayEntries,
  weekendEntries,
  setWeekendEntries,
  onBack,
  onCancel,
  onNext,
}: WeekdayWeekendTimetableStepProps) {
  function updateEntry(
    entries: TimetableEntry[],
    setEntries: Dispatch<
      SetStateAction<TimetableEntry[]>
    >,
    id: string,
    field: keyof TimetableEntry,
    value: string | number,
  ) {
    setEntries(
      entries.map((entry) =>
        entry.id === id
          ? {
              ...entry,
              [field]: value,
            }
          : entry,
      ),
    );
  }

  function removeEntry(
    entries: TimetableEntry[],
    setEntries: Dispatch<
      SetStateAction<TimetableEntry[]>
    >,
    id: string,
  ) {
    setEntries(
      entries.filter((entry) => entry.id !== id),
    );
  }

  function renderTimetable(
    title: string,
    description: string,
    entries: TimetableEntry[],
    setEntries: Dispatch<
      SetStateAction<TimetableEntry[]>
    >,
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

        <div className="mt-6 space-y-4">
          {entries.length === 0 ? (
            <div className="rounded-xl border border-dashed p-6 text-center">
              <p className="font-medium">
                No activities added yet
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
              {entries.map((entry, index) => (
                <div
                  key={entry.id}
                  className="rounded-xl border p-5"
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-semibold">
                      Activity {index + 1}
                    </p>

                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() =>
                        removeEntry(
                          entries,
                          setEntries,
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
                        onChange={(event) =>
                          updateEntry(
                            entries,
                            setEntries,
                            entry.id,
                            "name",
                            event.target.value,
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
                        value={entry.startTime}
                        onChange={(event) =>
                          updateEntry(
                            entries,
                            setEntries,
                            entry.id,
                            "startTime",
                            event.target.value,
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
                          value={entry.duration}
                          onChange={(event) =>
                            updateEntry(
                              entries,
                              setEntries,
                              entry.id,
                              "duration",
                              Number(
                                event.target.value,
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
                        value={entry.type}
                        onChange={(event) =>
                          updateEntry(
                            entries,
                            setEntries,
                            entry.id,
                            "type",
                            event.target.value,
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

                    {entry.type === "BOOKABLE" ? (
                      <div>
                        <label className="text-sm font-medium">
                          Capacity
                        </label>

                        <input
                          type="number"
                          min={1}
                          value={entry.capacity}
                          onChange={(event) =>
                            updateEntry(
                              entries,
                              setEntries,
                              entry.id,
                              "capacity",
                              Number(
                                event.target.value,
                              ),
                            )
                          }
                          className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}

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
    );
  }

  const hasInvalidWeekdayEntry =
    weekdayEntries.some(
      (entry) =>
        !entry.name.trim() ||
        !entry.startTime ||
        entry.duration <= 0 ||
        (entry.type === "BOOKABLE" &&
          entry.capacity <= 0),
    );

  const hasInvalidWeekendEntry =
    weekendEntries.some(
      (entry) =>
        !entry.name.trim() ||
        !entry.startTime ||
        entry.duration <= 0 ||
        (entry.type === "BOOKABLE" &&
          entry.capacity <= 0),
    );

  const canContinue =
    weekdayEntries.length > 0 &&
    weekendEntries.length > 0 &&
    !hasInvalidWeekdayEntry &&
    !hasInvalidWeekendEntry;

  return (
    <div className="w-full max-w-5xl rounded-2xl border bg-background p-6 shadow-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Step 2 of 3
          </p>

          <h2 className="mt-1 text-2xl font-semibold tracking-tight">
            Build weekday and weekend timetables
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            Define one operating timetable for Monday
            through Friday and another for Saturday and
            Sunday.
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
        {renderTimetable(
          "Weekday timetable",
          "Applies Monday through Friday.",
          weekdayEntries,
          setWeekdayEntries,
        )}

        {renderTimetable(
          "Weekend timetable",
          "Applies Saturday and Sunday.",
          weekendEntries,
          setWeekendEntries,
        )}
      </div>

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