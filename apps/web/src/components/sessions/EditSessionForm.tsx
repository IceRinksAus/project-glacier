"use client";

import { useMemo, useState } from "react";

import {
  formatInTimeZone,
  fromZonedTime,
} from "date-fns-tz";

import { Button } from "@/components/ui/button";

import {
  SessionDetail,
  sessionService,
} from "@/services/session.service";

interface EditSessionFormProps {
  session: SessionDetail;
  eventTimezone: string | null;
  onCancel: () => void;
  onSaved: (
    session: SessionDetail,
  ) => Promise<void> | void;
}

function getTimeZone(
  eventTimezone: string | null,
) {
  return eventTimezone ?? "UTC";
}

function getLocalDate(
  value: string,
  timeZone: string,
) {
  return formatInTimeZone(
    new Date(value),
    timeZone,
    "yyyy-MM-dd",
  );
}

function getLocalTime(
  value: string,
  timeZone: string,
) {
  return formatInTimeZone(
    new Date(value),
    timeZone,
    "HH:mm",
  );
}

export function EditSessionForm({
  session,
  eventTimezone,
  onCancel,
  onSaved,
}: EditSessionFormProps) {
  const timeZone = getTimeZone(
    session.event.timezone ??
      eventTimezone,
  );

  const initialValues = useMemo(
    () => ({
      name: session.name,
      date: getLocalDate(
        session.startDate,
        timeZone,
      ),
      startTime: getLocalTime(
        session.startDate,
        timeZone,
      ),
      endTime: getLocalTime(
        session.endDate,
        timeZone,
      ),
      capacity: session.capacity,
    }),
    [session, timeZone],
  );

  const [name, setName] = useState(
    initialValues.name,
  );

  const [date, setDate] = useState(
    initialValues.date,
  );

  const [startTime, setStartTime] =
    useState(
      initialValues.startTime,
    );

  const [endTime, setEndTime] =
    useState(
      initialValues.endTime,
    );

  const [capacity, setCapacity] =
    useState(
      initialValues.capacity,
    );

  const [isSaving, setIsSaving] =
    useState(false);

  const [saveError, setSaveError] =
    useState("");

  const canSave =
    name.trim().length > 0 &&
    date.length > 0 &&
    startTime.length > 0 &&
    endTime.length > 0 &&
    Number.isInteger(capacity) &&
    capacity > 0 &&
    !isSaving;

  async function handleSave() {
    if (!canSave) {
      return;
    }

    try {
      setIsSaving(true);
      setSaveError("");

      const localStart =
        `${date}T${startTime}:00`;

      const localEnd =
        `${date}T${endTime}:00`;

      const startDate =
        fromZonedTime(
          localStart,
          timeZone,
        ).toISOString();

      const endDate =
        fromZonedTime(
          localEnd,
          timeZone,
        ).toISOString();

      const updatedSession =
        await sessionService.updateSession(
          session.id,
          {
            name: name.trim(),
            startDate,
            endDate,
            capacity,
          },
        );

      await onSaved(
        updatedSession,
      );
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "Unable to update session",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border bg-card p-5">
        <h3 className="font-semibold">
          Edit session
        </h3>

        <p className="mt-1 text-sm text-muted-foreground">
          Times are shown in the
          event&apos;s local timezone.
        </p>

        <p className="mt-1 text-xs text-muted-foreground">
          {timeZone}
        </p>
      </section>

      <div>
        <label
          htmlFor="edit-session-name"
          className="text-sm font-medium"
        >
          Session name
        </label>

        <input
          id="edit-session-name"
          type="text"
          value={name}
          onChange={(event) =>
            setName(
              event.target.value,
            )
          }
          className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div>
        <label
          htmlFor="edit-session-date"
          className="text-sm font-medium"
        >
          Date
        </label>

        <input
          id="edit-session-date"
          type="date"
          value={date}
          onChange={(event) =>
            setDate(
              event.target.value,
            )
          }
          className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />

        <p className="mt-2 text-sm text-muted-foreground">
          The session must remain
          within the Event dates.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="edit-session-start-time"
            className="text-sm font-medium"
          >
            Start time
          </label>

          <input
            id="edit-session-start-time"
            type="time"
            value={startTime}
            onChange={(event) =>
              setStartTime(
                event.target.value,
              )
            }
            className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label
            htmlFor="edit-session-end-time"
            className="text-sm font-medium"
          >
            End time
          </label>

          <input
            id="edit-session-end-time"
            type="time"
            value={endTime}
            onChange={(event) =>
              setEndTime(
                event.target.value,
              )
            }
            className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="edit-session-capacity"
          className="text-sm font-medium"
        >
          Capacity
        </label>

        <input
          id="edit-session-capacity"
          type="number"
          min={1}
          value={capacity}
          onChange={(event) =>
            setCapacity(
              Number(
                event.target.value,
              ),
            )
          }
          className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />

        <p className="mt-2 text-sm text-muted-foreground">
          Capacity cannot be reduced
          below the number of reserved
          and confirmed admissions.
        </p>
      </div>

      {session.operationalScheduleId ? (
        <div className="rounded-xl border bg-muted/30 p-4">
          <p className="text-sm font-medium">
            Schedule exception
          </p>

          <p className="mt-1 text-sm text-muted-foreground">
            Editing this generated
            Session will mark it as a
            modified exception to its
            Operational Schedule.
          </p>
        </div>
      ) : null}

      {saveError ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {saveError}
        </div>
      ) : null}

      <div className="flex items-center justify-end gap-3 border-t pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSaving}
        >
          Cancel
        </Button>

        <Button
          type="button"
          onClick={() =>
            void handleSave()
          }
          disabled={!canSave}
        >
          {isSaving
            ? "Saving..."
            : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}