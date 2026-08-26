"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  AdjustmentAction,
  AdjustmentReason,
  TicketAdjustmentContext,
  TicketAdjustmentPreview,
  ticketAdjustmentService,
} from "@/services/ticket-adjustment.service";

const reasons: Array<[AdjustmentReason, string]> = [
  ["MEDICAL_COMPASSIONATE", "Medical or compassionate exception"],
  ["EVENT_SESSION_ISSUE", "Event or Session operational issue"],
  ["DUPLICATE_PURCHASE", "Duplicate purchase"],
  ["ORGANISER_CORRECTION", "Organiser correction"],
  ["OTHER", "Other"],
];

const money = (value: number) =>
  new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(
    value,
  );

export function TicketAdjustmentPanel({ bookingId }: { bookingId: string }) {
  const [context, setContext] = useState<TicketAdjustmentContext | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [action, setAction] = useState<AdjustmentAction>("CANCEL_AND_REFUND");
  const [reason, setReason] = useState<AdjustmentReason>(
    "MEDICAL_COMPASSIONATE",
  );
  const [note, setNote] = useState("");
  const [preview, setPreview] = useState<TicketAdjustmentPreview | null>(null);
  const [reference, setReference] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setContext(await ticketAdjustmentService.context(bookingId));
  }

  useEffect(() => {
    load().catch((cause) =>
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to load Ticket adjustments.",
      ),
    );
  }, [bookingId]);

  async function review() {
    setBusy(true);
    setError("");
    try {
      setPreview(
        await ticketAdjustmentService.preview(bookingId, {
          action,
          reason,
          note,
          ticketIds: selected,
        }),
      );
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to review adjustment.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function confirm() {
    if (!preview) return;
    setBusy(true);
    setError("");
    try {
      await ticketAdjustmentService.execute(bookingId, {
        action,
        reason,
        note,
        ticketIds: selected,
        previewHash: preview.previewHash,
        idempotencyKey: crypto.randomUUID(),
        manualRefundConfirmed: preview.payment?.method !== "ONLINE_CARD",
        standaloneReference: reference || undefined,
      });
      setSelected([]);
      setPreview(null);
      setNote("");
      setReference("");
      await load();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to complete adjustment.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (!context)
    return (
      <section className="rounded-xl border bg-card p-6">
        Loading Ticket adjustment authority…
      </section>
    );

  return (
    <section className="rounded-xl border bg-card p-6 shadow-sm">
      <h2 className="text-lg font-semibold">Adjust Tickets</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Tickets are non-refundable by default. OWNER and MANAGER may record a
        documented discretionary exception. Scanned Tickets cannot be adjusted.
      </p>
      {error ? (
        <p className="mt-4 rounded-lg bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <div className="mt-5 space-y-3">
        {context.tickets.map((ticket) => (
          <label
            key={ticket.id}
            className="flex items-start gap-3 rounded-lg border p-4"
          >
            <input
              type="checkbox"
              disabled={!ticket.eligible || Boolean(preview)}
              checked={selected.includes(ticket.id)}
              onChange={(event) =>
                setSelected((current) =>
                  event.target.checked
                    ? [...current, ticket.id]
                    : current.filter((id) => id !== ticket.id),
                )
              }
            />
            <span className="flex-1 text-sm">
              <strong>{ticket.participantName}</strong> ·{" "}
              {ticket.ticketTypeName} ·{" "}
              {ticket.unitValue === null
                ? "Price unavailable"
                : money(ticket.unitValue)}
              <span className="mt-1 block text-muted-foreground">
                {ticket.ticketNumber} · {ticket.status}
                {ticket.checkedInAt ? " · already scanned" : ""}
                {!ticket.eligible && !ticket.checkedInAt
                  ? " · unavailable"
                  : ""}
              </span>
            </span>
          </label>
        ))}
      </div>
      {!preview ? (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium">
            Action
            <select
              className="mt-1 w-full rounded-md border p-2"
              value={action}
              onChange={(event) =>
                setAction(event.target.value as AdjustmentAction)
              }
            >
              <option value="CANCEL_AND_REFUND">Cancel and refund</option>
              <option value="CANCEL_ONLY">Cancel only</option>
            </select>
          </label>
          <label className="text-sm font-medium">
            Reason
            <select
              className="mt-1 w-full rounded-md border p-2"
              value={reason}
              onChange={(event) =>
                setReason(event.target.value as AdjustmentReason)
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
              className="mt-1 min-h-24 w-full rounded-md border p-3"
              maxLength={500}
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </label>
          <Button
            disabled={busy || selected.length === 0 || note.trim().length < 3}
            onClick={() => void review()}
          >
            {busy ? "Reviewing…" : "Review adjustment"}
          </Button>
        </div>
      ) : (
        <div className="mt-5 rounded-xl border border-primary/30 bg-primary/5 p-5">
          <h3 className="font-semibold">Confirm high-impact action</h3>
          <p className="mt-2 text-sm">
            Cancel {preview.allocations.length} Ticket(s), release{" "}
            {preview.capacityPlacesReleased} admission place(s), and{" "}
            {preview.action === "CANCEL_AND_REFUND"
              ? `refund ${money(preview.refundAmount)}`
              : "make no refund"}
            .
          </p>
          {preview.productsUnchanged.length ? (
            <p className="mt-2 text-sm font-medium">
              Products remain unchanged:{" "}
              {preview.productsUnchanged
                .map((item) => `${item.quantity} × ${item.name}`)
                .join(", ")}
              .
            </p>
          ) : null}
          {preview.payment?.method === "CASH" ? (
            <p className="mt-3 text-sm">
              Confirm only after the cash has physically been returned.
            </p>
          ) : null}
          {preview.payment?.method === "STANDALONE_EFTPOS" ? (
            <label className="mt-3 block text-sm font-medium">
              Terminal refund reference
              <input
                className="mt-1 w-full rounded-md border p-2"
                value={reference}
                onChange={(event) => setReference(event.target.value)}
              />
            </label>
          ) : null}
          <div className="mt-4 flex gap-3">
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => setPreview(null)}
            >
              Back
            </Button>
            <Button
              disabled={
                busy ||
                (preview.payment?.method === "STANDALONE_EFTPOS" &&
                  !reference.trim())
              }
              onClick={() => void confirm()}
            >
              {busy
                ? "Processing…"
                : preview.action === "CANCEL_ONLY"
                  ? "Cancel selected Tickets"
                  : `Confirm ${money(preview.refundAmount)} refund`}
            </Button>
          </div>
        </div>
      )}
      <div className="mt-8">
        <h3 className="font-semibold">Adjustment history</h3>
        {context.adjustments.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            No Ticket adjustments recorded.
          </p>
        ) : (
          <div className="mt-3 space-y-3">
            {context.adjustments.map((item) => (
              <div key={item.id} className="rounded-lg border p-4 text-sm">
                <strong>{item.adjustmentNumber}</strong> · {item.status}
                <p className="mt-1 text-muted-foreground">
                  {item.allocations
                    .map((allocation) => allocation.ticketNumberSnapshot)
                    .join(", ")}{" "}
                  · {item.reason} · {item.requestedByUser.name}
                </p>
                <p className="mt-1">{item.note}</p>
                {item.paymentRefund ? (
                  <p className="mt-1">
                    Refund {money(item.paymentRefund.amount)} ·{" "}
                    {item.paymentRefund.status}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
