"use client";

import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { eventService } from "@/services/event.service";

interface EventEntryPolicySettingsProps {
  eventId: string;
  initialOpensMinutesBeforeStart: number;
  initialClosesMinutesAfterEnd: number;
}

function parsePolicyValue(value: string) {
  if (!/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 && parsed <= 240
    ? parsed
    : null;
}

export function EventEntryPolicySettings({
  eventId,
  initialOpensMinutesBeforeStart,
  initialClosesMinutesAfterEnd,
}: EventEntryPolicySettingsProps) {
  const [opensBefore, setOpensBefore] = useState(
    String(initialOpensMinutesBeforeStart),
  );
  const [closesAfter, setClosesAfter] = useState(
    String(initialClosesMinutesAfterEnd),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedMessage, setSavedMessage] = useState("");

  async function savePolicy(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedOpensBefore = parsePolicyValue(opensBefore);
    const parsedClosesAfter = parsePolicyValue(closesAfter);

    if (parsedOpensBefore === null || parsedClosesAfter === null) {
      setError("Enter whole minutes between 0 and 240 for both settings.");
      setSavedMessage("");
      return;
    }

    setIsSaving(true);
    setError("");
    setSavedMessage("");

    try {
      const updated = await eventService.updateEntryPolicy(
        eventId,
        parsedOpensBefore,
        parsedClosesAfter,
      );
      setOpensBefore(String(updated.entryOpensMinutesBeforeStart));
      setClosesAfter(String(updated.entryClosesMinutesAfterEnd));
      setSavedMessage("Ticket entry window saved.");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save the Ticket entry window.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="rounded-xl border bg-card p-6">
      <div className="max-w-2xl">
        <p className="text-sm font-medium text-muted-foreground">
          Gate operations
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">
          Ticket entry window
        </h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Gate Entry only grants admission inside this window. For Tickets tied
          to a Session, Glacier calculates the window from that Session. Other
          Tickets use the Event start and end times.
        </p>

        <form onSubmit={savePolicy} className="mt-6 space-y-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="text-sm font-medium">
              Entry opens before start
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={240}
                  step={1}
                  required
                  value={opensBefore}
                  onChange={(event) => setOpensBefore(event.target.value)}
                  className="h-10 w-full rounded-lg border bg-background px-3"
                  aria-describedby="entry-opens-help"
                />
                <span className="text-sm text-muted-foreground">minutes</span>
              </div>
              <span
                id="entry-opens-help"
                className="mt-2 block text-xs font-normal text-muted-foreground"
              >
                Default: 30 minutes before the start time.
              </span>
            </label>

            <label className="text-sm font-medium">
              Entry closes after end
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={240}
                  step={1}
                  required
                  value={closesAfter}
                  onChange={(event) => setClosesAfter(event.target.value)}
                  className="h-10 w-full rounded-lg border bg-background px-3"
                  aria-describedby="entry-closes-help"
                />
                <span className="text-sm text-muted-foreground">minutes</span>
              </div>
              <span
                id="entry-closes-help"
                className="mt-2 block text-xs font-normal text-muted-foreground"
              >
                Default: entry closes when the Session or Event ends.
              </span>
            </label>
          </div>

          <div className="rounded-lg border bg-muted/40 p-4 text-sm">
            <span className="font-medium">Current rule:</span> entry opens{" "}
            {opensBefore || "—"} minutes before start and closes{" "}
            {closesAfter || "—"} minutes after end.
          </div>

          {error ? (
            <p role="alert" className="text-sm font-medium text-destructive">
              {error}
            </p>
          ) : null}
          {savedMessage ? (
            <p role="status" className="text-sm font-medium text-emerald-700">
              {savedMessage}
            </p>
          ) : null}

          <div className="flex items-center gap-3">
            <Button type="submit" size="lg" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save entry window"}
            </Button>
            <p className="text-xs text-muted-foreground">
              Event owners can change gate policy. Allowed range: 0–240 minutes.
            </p>
          </div>
        </form>
      </div>
    </section>
  );
}
