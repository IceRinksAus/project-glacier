"use client";

import type { Dispatch, SetStateAction } from "react";

import { Button } from "@/components/ui/button";

export interface TimetableEntry {
  id: string;
  name: string;
  startTime: string;
  duration: number;
  capacity: number;
  type: "BOOKABLE" | "OPERATIONAL";
}

interface ScheduleTimetableStepProps {
  entries: TimetableEntry[];
  setEntries: Dispatch<SetStateAction<TimetableEntry[]>>;
  onBack: () => void;
  onCancel: () => void;
  onNext: () => void;
}

export function ScheduleTimetableStep({
  entries,
  setEntries,
  onBack,
  onCancel,
  onNext,
}: ScheduleTimetableStepProps) {


  function addEntry() {
    const newEntry: TimetableEntry = {
      id: crypto.randomUUID(),
      name: "",
      startTime: "",
      duration: 60,
      capacity: 200,
      type: "BOOKABLE",
    };

    setEntries((currentEntries) => [
      ...currentEntries,
      newEntry,
    ]);
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
      currentEntries.filter((entry) => entry.id !== id),
    );
  }

  return (
    <div className="w-full max-w-4xl rounded-2xl border bg-background p-6 shadow-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Step 2 of 3
          </p>

          <h2 className="mt-1 text-2xl font-semibold tracking-tight">
            Build timetable
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            Add the activities that make up a normal operating day.
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

      <div className="mt-8 space-y-4">
        {entries.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center">
            <p className="font-medium">
              No timetable entries yet
            </p>

            <p className="mt-2 text-sm text-muted-foreground">
              Add the first activity in this operating timetable.
            </p>

            <Button
              type="button"
              className="mt-4"
              onClick={addEntry}
            >
              + Add activity
            </Button>
          </div>
        ) : (
          <>
            {entries.map((entry, index) => (
              <section
                key={entry.id}
                className="rounded-xl border bg-card p-5"
              >
                <div className="flex items-center justify-between gap-4">
                  <p className="font-semibold">
                    Activity {index + 1}
                  </p>

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => removeEntry(entry.id)}
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
                            entry.id,
                            "duration",
                            Number(event.target.value),
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
                            entry.id,
                            "capacity",
                            Number(event.target.value),
                          )
                        }
                        className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  ) : null}
                </div>
              </section>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={addEntry}
            >
              + Add another activity
            </Button>
          </>
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
          disabled={
            entries.length === 0 ||
            entries.some(
              (entry) =>
                !entry.name.trim() ||
                !entry.startTime ||
                entry.duration <= 0 ||
                (entry.type === "BOOKABLE" &&
                  entry.capacity <= 0),
            )
          }
        >
          Next: Review schedule
        </Button>
      </div>
    </div>
  );
}