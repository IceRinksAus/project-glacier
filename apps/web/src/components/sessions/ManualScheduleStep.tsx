"use client";

import {
  useEffect,
  type Dispatch,
  type SetStateAction,
} from "react";

import { Button } from "@/components/ui/button";

import type { TimetableEntry } from "./ScheduleTimetableStep";

export interface ManualScheduleDay {
  id: string;
  date: string;
  timetable: TimetableEntry[];
}

interface ManualScheduleStepProps {
  manualDays: ManualScheduleDay[];
  setManualDays: Dispatch<
    SetStateAction<ManualScheduleDay[]>
  >;
  minimumDate: string;
  maximumDate: string;
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

function createManualDay(
  minimumDate: string,
): ManualScheduleDay {
  return {
    id: crypto.randomUUID(),
    date: minimumDate,
    timetable: [],
  };
}

export function ManualScheduleStep({
  manualDays,
  setManualDays,
  minimumDate,
  maximumDate,
  onBack,
  onCancel,
  onNext,
}: ManualScheduleStepProps) {
  useEffect(() => {
    if (manualDays.length === 0) {
      setManualDays([
        createManualDay(minimumDate),
      ]);
    }
  }, [
    manualDays.length,
    minimumDate,
    setManualDays,
  ]);

  function updateDayDate(
    dayId: string,
    date: string,
  ) {
    
    setManualDays((currentDays) =>
      currentDays.map((day) =>
        day.id === dayId
          ? {
              ...day,
              date,
            }
          : day,
      ),
    );
  }

  function removeDay(dayId: string) {
    setManualDays((currentDays) =>
      currentDays.filter(
        (day) => day.id !== dayId,
      ),
    );
  }

  function addEntry(dayId: string) {
    setManualDays((currentDays) =>
      currentDays.map((day) =>
        day.id === dayId
          ? {
              ...day,
              timetable: [
                ...day.timetable,
                createEntry(),
              ],
            }
          : day,
      ),
    );
  }

  function removeEntry(
    dayId: string,
    entryId: string,
  ) {
    setManualDays((currentDays) =>
      currentDays.map((day) =>
        day.id === dayId
          ? {
              ...day,
              timetable:
                day.timetable.filter(
                  (entry) =>
                    entry.id !== entryId,
                ),
            }
          : day,
      ),
    );
  }

  function updateEntry(
    dayId: string,
    entryId: string,
    field: keyof TimetableEntry,
    value: string | number,
  ) {
    setManualDays((currentDays) =>
      currentDays.map((day) =>
        day.id === dayId
          ? {
              ...day,
              timetable:
                day.timetable.map(
                  (entry) =>
                    entry.id === entryId
                      ? {
                          ...entry,
                          [field]: value,
                        }
                      : entry,
                ),
            }
          : day,
      ),
    );
  }

  const duplicateDates = new Set<string>();

  const seenDates = new Set<string>();

  for (const day of manualDays) {
    if (!day.date) {
      continue;
    }

    if (seenDates.has(day.date)) {
      duplicateDates.add(day.date);
    } else {
      seenDates.add(day.date);
    }
  }

  const hasInvalidDay =
    manualDays.some((day) => {
      if (
        !day.date ||
        day.date < minimumDate ||
        day.date > maximumDate
      ) {
        return true;
      }

      if (
        duplicateDates.has(day.date)
      ) {
        return true;
      }

      if (!day.timetable.length) {
        return true;
      }

      return day.timetable.some(
        (entry) =>
          !entry.name.trim() ||
          !entry.startTime ||
          entry.duration <= 0 ||
          (entry.type === "BOOKABLE" &&
            entry.capacity <= 0),
      );
    });

  const canContinue =
    manualDays.length > 0 &&
    !hasInvalidDay;

  return (
    <div className="w-full max-w-5xl rounded-2xl border bg-background p-6 shadow-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Step 2 of 3
          </p>

          <h2 className="mt-1 text-2xl font-semibold tracking-tight">
            Build manual schedule
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            Add exact dates and define a
            separate timetable for each day.
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
        {manualDays.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center">
            <p className="font-medium">
              No manual dates added yet
            </p>

            <p className="mt-2 text-sm text-muted-foreground">
              Add the first date to begin
              building the schedule.
            </p>

            <Button
              type="button"
              className="mt-4"
              onClick={() =>
                setManualDays([
                  createManualDay(
                    minimumDate,
                  ),
                ])
              }
            >
              + Add date
            </Button>
          </div>
        ) : (
          <>
            {manualDays.map(
              (manualDay, dayIndex) => {
                const hasDuplicateDate =
                  duplicateDates.has(
                    manualDay.date,
                  );

                return (
                  <section
                    key={manualDay.id}
                    className="rounded-xl border bg-card p-6"
                  >
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Manual day{" "}
                          {dayIndex + 1}
                        </p>

                        <h3 className="mt-1 text-lg font-semibold">
                          Schedule date
                        </h3>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() =>
                          removeDay(
                            manualDay.id,
                          )
                        }
                      >
                        Remove date
                      </Button>
                    </div>

                    <div className="mt-5 max-w-sm">
                      <label
                        htmlFor={`manual-date-${manualDay.id}`}
                        className="text-sm font-medium"
                      >
                        Date
                      </label>

                      <input
                        id={`manual-date-${manualDay.id}`}
                        type="date"
                        value={
                          manualDay.date
                        }
                        min={minimumDate}
                        max={maximumDate}
                        onChange={(event) =>
                          updateDayDate(
                            manualDay.id,
                            event.target.value,
                          )
                        }
                        className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                      />

                      {hasDuplicateDate ? (
                        <p className="mt-2 text-sm text-destructive">
                          This date has
                          already been added.
                        </p>
                      ) : null}
                    </div>

                    <div className="mt-6">
                      <div>
                        <h4 className="font-semibold">
                          Timetable
                        </h4>

                        <p className="mt-1 text-sm text-muted-foreground">
                          Activities entered
                          here apply only to
                          this date.
                        </p>
                      </div>

                      <div className="mt-5 space-y-4">
                        {manualDay
                          .timetable
                          .length === 0 ? (
                          <div className="rounded-xl border border-dashed p-6 text-center">
                            <p className="font-medium">
                              No activities
                              added yet
                            </p>

                            <Button
                              type="button"
                              className="mt-4"
                              onClick={() =>
                                addEntry(
                                  manualDay.id,
                                )
                              }
                            >
                              + Add activity
                            </Button>
                          </div>
                        ) : (
                          <>
                            {manualDay.timetable.map(
                              (
                                entry,
                                entryIndex,
                              ) => (
                                <div
                                  key={
                                    entry.id
                                  }
                                  className="rounded-xl border p-5"
                                >
                                  <div className="flex items-center justify-between gap-4">
                                    <p className="font-semibold">
                                      Activity{" "}
                                      {entryIndex +
                                        1}
                                    </p>

                                    <Button
                                      type="button"
                                      variant="ghost"
                                      onClick={() =>
                                        removeEntry(
                                          manualDay.id,
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
                                        Activity
                                        name
                                      </label>

                                      <input
                                        type="text"
                                        value={
                                          entry.name
                                        }
                                        placeholder="e.g. Public Skate"
                                        onChange={(
                                          event,
                                        ) =>
                                          updateEntry(
                                            manualDay.id,
                                            entry.id,
                                            "name",
                                            event
                                              .target
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
                                            manualDay.id,
                                            entry.id,
                                            "startTime",
                                            event
                                              .target
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
                                              manualDay.id,
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
                                        Activity
                                        type
                                      </label>

                                      <select
                                        value={
                                          entry.type
                                        }
                                        onChange={(
                                          event,
                                        ) =>
                                          updateEntry(
                                            manualDay.id,
                                            entry.id,
                                            "type",
                                            event
                                              .target
                                              .value,
                                          )
                                        }
                                        className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                                      >
                                        <option value="BOOKABLE">
                                          Bookable
                                          session
                                        </option>

                                        <option value="OPERATIONAL">
                                          Operational
                                          block
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
                                              manualDay.id,
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
                                addEntry(
                                  manualDay.id,
                                )
                              }
                            >
                              + Add another activity
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </section>
                );
              },
            )}

            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setManualDays([
                  ...manualDays,
                  createManualDay(
                    minimumDate,
                  ),
                ])
              }
            >
              + Add another date
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
          disabled={!canContinue}
        >
          Next: Review schedule
        </Button>
      </div>
    </div>
  );
}