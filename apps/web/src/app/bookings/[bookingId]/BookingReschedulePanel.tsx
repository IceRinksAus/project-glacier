"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  BookingRescheduleContext,
  BookingReschedulePreview,
  BookingRescheduleReason,
  BookingRescheduleResult,
  bookingRescheduleService,
} from "@/services/booking-reschedule.service";

const reasons: Array<[BookingRescheduleReason, string]> = [
  ["CUSTOMER_REQUEST", "Customer request"],
  ["EVENT_SESSION_ISSUE", "Event or Session operational issue"],
  ["ORGANISER_CORRECTION", "Organiser correction"],
  ["OTHER", "Other"],
];

const dateTime = (value: string) => new Date(value).toLocaleString("en-AU");
const money = (value: number) =>
  new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(value);

export function BookingReschedulePanel({
  bookingId,
  onCompleted,
}: {
  bookingId: string;
  onCompleted?: () => void | Promise<void>;
}) {
  const [context, setContext] = useState<BookingRescheduleContext | null>(null);
  const [destinationSessionId, setDestinationSessionId] = useState("");
  const [reason, setReason] =
    useState<BookingRescheduleReason>("CUSTOMER_REQUEST");
  const [note, setNote] = useState("");
  const [preview, setPreview] = useState<BookingReschedulePreview | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState("");
  const [completed, setCompleted] = useState<BookingRescheduleResult | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const next = await bookingRescheduleService.context(bookingId);
    setContext(next);
    if (
      next.destinations.length > 0 &&
      !next.destinations.some(({ id }) => id === destinationSessionId)
    ) {
      setDestinationSessionId(next.destinations[0].id);
    }
  }

  useEffect(() => {
    load().catch((cause) =>
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to load Session-change authority.",
      ),
    );
  }, [bookingId]);

  async function review() {
    setBusy(true);
    setError("");
    setCompleted(null);
    try {
      const next = await bookingRescheduleService.preview(bookingId, {
        destinationSessionId,
        reason,
        note,
      });
      setPreview(next);
      setIdempotencyKey(crypto.randomUUID());
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to review the Session change.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function confirm() {
    if (!preview || !idempotencyKey) return;
    setBusy(true);
    setError("");
    try {
      const result = await bookingRescheduleService.execute(bookingId, {
        destinationSessionId,
        reason,
        note,
        previewHash: preview.previewHash,
        idempotencyKey,
      });
      setCompleted(result);
      setPreview(null);
      setIdempotencyKey("");
      setNote("");
      await load();
      await onCompleted?.();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to complete the Session change.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (!context) {
    return (
      <section className="rounded-xl border bg-card p-6">
        Loading Session-change authority…
      </section>
    );
  }

  return (
    <section className="rounded-xl border bg-card p-6 shadow-sm">
      <h2 className="text-lg font-semibold">Change Session</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Move the whole Booking within this Event. Every current Ticket will be
        invalidated and replaced. Booking contents and price cannot change.
      </p>

      {error ? (
        <p
          role="alert"
          className="mt-4 rounded-lg bg-destructive/5 p-3 text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}

      {completed ? (
        <div
          role="status"
          className="mt-5 rounded-xl border border-emerald-300 bg-emerald-50 p-5 text-sm text-emerald-950"
        >
          <h3 className="font-semibold">Session change completed</h3>
          <p className="mt-2">
            {completed.rescheduleNumber} moved {completed.ticketCount} Ticket(s)
            to {completed.destinationSession.name}. Replacement Tickets are now
            active.
          </p>
        </div>
      ) : null}

      {!context.eligible ? (
        <div className="mt-5 rounded-lg bg-muted/60 p-4 text-sm">
          <p className="font-medium">This Booking cannot change Session.</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
            {context.eligibilityReasons.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : context.destinations.length === 0 ? (
        <p className="mt-5 rounded-lg bg-muted/60 p-4 text-sm">
          No eligible destination Sessions currently have the required
          admission, Product and Rule availability.
        </p>
      ) : !preview ? (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium md:col-span-2">
            Destination Session
            <select
              aria-label="Destination Session"
              className="mt-1 w-full rounded-md border p-2"
              value={destinationSessionId}
              onChange={(event) => setDestinationSessionId(event.target.value)}
            >
              {context.destinations.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.name} — {dateTime(session.startDate)} ·{" "}
                  {session.remainingAdmissionBeforeMove} places available
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium">
            Reason
            <select
              aria-label="Session-change reason"
              className="mt-1 w-full rounded-md border p-2"
              value={reason}
              onChange={(event) =>
                setReason(event.target.value as BookingRescheduleReason)
              }
            >
              {reasons.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium md:col-span-2">
            Required explanation
            <textarea
              aria-label="Session-change explanation"
              className="mt-1 min-h-24 w-full rounded-md border p-3"
              maxLength={500}
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </label>
          <Button
            disabled={busy || !destinationSessionId || note.trim().length < 3}
            onClick={() => void review()}
          >
            {busy ? "Reviewing…" : "Review Session change"}
          </Button>
        </div>
      ) : (
        <div className="mt-5 rounded-xl border border-primary/30 bg-primary/5 p-5">
          <h3 className="font-semibold">Confirm high-impact action</h3>
          <p className="mt-2 text-sm font-medium">
            {preview.originalSession.name} → {preview.destinationSession.name}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {dateTime(preview.originalSession.startDate)} →{" "}
            {dateTime(preview.destinationSession.startDate)}
          </p>
          <p className="mt-3 text-sm">
            Move all {preview.ticketCount} Ticket(s) and transfer{" "}
            {preview.admissionPlacesTransferred} shared admission place(s).
            Every original Ticket will become unusable and exactly one
            replacement will be issued per participant.
          </p>
          <p className="mt-2 text-sm font-medium">
            Booking contents and total remain unchanged at{" "}
            {money(preview.totalUnchanged)}. No Payment or refund will occur.
          </p>
          {preview.productEffects.length ? (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
              {preview.productEffects.map((item) => (
                <li key={item.bookingProductId}>
                  {item.quantity} × {item.name}:{" "}
                  {item.capacityTransferred > 0
                    ? `${item.capacityTransferred} reusable place(s) transfer`
                    : "finite inventory remains unchanged"}
                </li>
              ))}
            </ul>
          ) : null}
          <div className="mt-4 flex gap-3">
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => {
                setPreview(null);
                setIdempotencyKey("");
              }}
            >
              Back
            </Button>
            <Button disabled={busy} onClick={() => void confirm()}>
              {busy ? "Changing Session…" : "Confirm Session change"}
            </Button>
          </div>
        </div>
      )}

      <div className="mt-8">
        <h3 className="font-semibold">Session-change history</h3>
        {context.history.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            No Session changes recorded.
          </p>
        ) : (
          <div className="mt-3 space-y-3">
            {context.history.map((item) => (
              <div key={item.id} className="rounded-lg border p-4 text-sm">
                <strong>{item.rescheduleNumber}</strong> · {item.status}
                <p className="mt-1 text-muted-foreground">
                  {item.originalSession.name} → {item.destinationSession.name} ·{" "}
                  {item.requestedByUser.name}
                </p>
                <p className="mt-1">{item.note}</p>
                <p className="mt-1 text-muted-foreground">
                  {item.ticketCount} Ticket replacement(s) ·{" "}
                  {dateTime(item.createdAt)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
