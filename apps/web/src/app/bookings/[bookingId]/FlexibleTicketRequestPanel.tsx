"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  FlexibleTicketDecisionPreview,
  FlexibleTicketDecisionReason,
  FlexibleTicketRequestSummary,
  OperatorFlexibleTicketRequestContext,
  flexibleTicketRequestService,
} from "@/services/flexible-ticket-request.service";

function dateTime(value: string | null) {
  return value ? new Date(value).toLocaleString("en-AU") : "—";
}

function money(value: number, currency = "AUD") {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency,
  }).format(value);
}

const declineReasons: Array<{
  value: FlexibleTicketDecisionReason;
  label: string;
}> = [
  { value: "OUTSIDE_ENTITLEMENT", label: "Outside purchased entitlement" },
  { value: "INELIGIBLE_TICKET", label: "Ticket is no longer eligible" },
  { value: "CUTOFF_PASSED", label: "Request cut-off passed" },
  { value: "CAPACITY_UNAVAILABLE", label: "Requested capacity unavailable" },
  {
    value: "PAYMENT_ACTION_REQUIRED",
    label: "Unsupported payment action required",
  },
  { value: "OTHER", label: "Other controlled reason" },
];

export function FlexibleTicketRequestPanel({
  bookingId,
  onCompleted,
}: {
  bookingId: string;
  onCompleted: () => Promise<void>;
}) {
  const [context, setContext] =
    useState<OperatorFlexibleTicketRequestContext | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [activeRequest, setActiveRequest] = useState<string | null>(null);
  const [decision, setDecision] = useState<"APPROVE" | "DECLINE">("APPROVE");
  const [reason, setReason] = useState<FlexibleTicketDecisionReason>(
    "APPROVED_UNDER_ENTITLEMENT",
  );
  const [note, setNote] = useState("");
  const [preview, setPreview] = useState<FlexibleTicketDecisionPreview | null>(
    null,
  );
  const [manualRefundConfirmed, setManualRefundConfirmed] = useState(false);
  const [standaloneReference, setStandaloneReference] = useState("");

  const refresh = useCallback(async () => {
    const response =
      await flexibleTicketRequestService.operatorContext(bookingId);
    setContext(response);
  }, [bookingId]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    flexibleTicketRequestService
      .operatorContext(bookingId)
      .then((response) => {
        if (!cancelled) setContext(response);
      })
      .catch((requestError: unknown) => {
        if (!cancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load Flexible Ticket requests.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  async function beginReview(request: FlexibleTicketRequestSummary) {
    setIsSaving(true);
    setError(null);
    setMessage(null);
    try {
      if (request.status === "SUBMITTED") {
        await flexibleTicketRequestService.review(
          bookingId,
          request.requestNumber,
        );
        await refresh();
      }
      setActiveRequest(request.requestNumber);
      setDecision("APPROVE");
      setReason("APPROVED_UNDER_ENTITLEMENT");
      setNote("");
      setPreview(null);
      setManualRefundConfirmed(false);
      setStandaloneReference("");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to begin review.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  function changeDecision(value: "APPROVE" | "DECLINE") {
    setDecision(value);
    setReason(
      value === "APPROVE"
        ? "APPROVED_UNDER_ENTITLEMENT"
        : "OUTSIDE_ENTITLEMENT",
    );
    setPreview(null);
  }

  async function reviewDecision() {
    if (!activeRequest) return;
    setIsSaving(true);
    setError(null);
    setMessage(null);
    try {
      setPreview(
        await flexibleTicketRequestService.previewDecision(
          bookingId,
          activeRequest,
          { decision, reason, note },
        ),
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to preview the decision.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function confirmDecision() {
    if (!activeRequest || !preview) return;
    setIsSaving(true);
    setError(null);
    setMessage(null);
    try {
      const result = await flexibleTicketRequestService.executeDecision(
        bookingId,
        activeRequest,
        {
          decision,
          reason,
          note,
          previewHash: preview.previewHash,
          manualRefundConfirmed,
          standaloneReference: standaloneReference.trim() || undefined,
        },
      );
      setMessage(
        `${result.requestNumber} is ${result.status}. ${
          result.status === "COMPLETED"
            ? "The linked controlled action completed and entitlement use was recorded."
            : "Review the recorded status before communicating an outcome."
        }`,
      );
      setActiveRequest(null);
      setPreview(null);
      await refresh();
      await onCompleted();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to complete the decision.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  const selected = context?.requests.find(
    ({ requestNumber }) => requestNumber === activeRequest,
  );
  const requiresManualRefund =
    preview?.decision === "APPROVE" &&
    preview.request.type === "REFUND" &&
    preview.mutation?.payment?.method &&
    preview.mutation.payment.method !== "ONLINE_CARD";

  return (
    <section className="rounded-xl border bg-card p-6 shadow-sm">
      <h2 className="text-lg font-semibold">Flexible Ticket requests</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Customer submissions are requests only. Approval revalidates current
        eligibility and uses Glacier&apos;s controlled refund or Session-change
        ledger.
      </p>

      {isLoading ? <p className="mt-5 text-sm">Loading requests…</p> : null}
      {error ? (
        <p
          role="alert"
          className="mt-4 rounded-lg bg-destructive/5 p-3 text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}
      {message ? (
        <p
          aria-live="polite"
          className="mt-4 rounded-lg bg-muted/60 p-3 text-sm"
        >
          {message}
        </p>
      ) : null}

      <div className="mt-5 space-y-4">
        {context && context.requests.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No Flexible Ticket requests recorded.
          </p>
        ) : null}
        {(context?.requests ?? []).map((request) => (
          <article
            key={request.requestNumber}
            className="rounded-lg border p-4 text-sm"
          >
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
              <div>
                <p className="font-semibold">{request.requestNumber}</p>
                <p className="mt-1 text-muted-foreground">
                  {request.type === "REFUND"
                    ? "Cancellation/refund"
                    : "Session change"}{" "}
                  · {request.status} · submitted {dateTime(request.submittedAt)}
                </p>
                <p className="mt-2">
                  {request.items
                    .map(
                      (item) =>
                        `${item.participantName} (${item.ticketNumber})`,
                    )
                    .join(", ")}
                </p>
                <p className="mt-1 text-muted-foreground">
                  Customer reason: {request.customerReason.replaceAll("_", " ")}
                </p>
                {request.customerNote ? (
                  <p className="mt-2">{request.customerNote}</p>
                ) : null}
              </div>
              {request.status === "SUBMITTED" ||
              request.status === "UNDER_REVIEW" ? (
                <Button
                  variant="outline"
                  disabled={isSaving}
                  onClick={() => void beginReview(request)}
                >
                  Review request
                </Button>
              ) : null}
            </div>
            {request.decisionReason ? (
              <div className="mt-3 rounded-lg bg-muted/60 p-3">
                Decision: {request.decisionReason.replaceAll("_", " ")}
                {request.reviewedByUser
                  ? ` · ${request.reviewedByUser.name}`
                  : ""}
                {request.decisionNote ? (
                  <p className="mt-1">{request.decisionNote}</p>
                ) : null}
              </div>
            ) : null}
            {request.adjustment ? (
              <p className="mt-3">
                Adjustment {request.adjustment.adjustmentNumber} ·{" "}
                {request.adjustment.status}
              </p>
            ) : null}
            {request.reschedule ? (
              <p className="mt-3">
                Session change {request.reschedule.rescheduleNumber} ·{" "}
                {request.reschedule.status}
              </p>
            ) : null}
          </article>
        ))}
      </div>

      {selected ? (
        <div className="mt-6 rounded-xl border-2 p-5">
          <h3 className="font-semibold">
            Decision for {selected.requestNumber}
          </h3>
          <div className="mt-4 flex gap-3">
            <Button
              variant={decision === "APPROVE" ? "default" : "outline"}
              onClick={() => changeDecision("APPROVE")}
            >
              Approve
            </Button>
            <Button
              variant={decision === "DECLINE" ? "destructive" : "outline"}
              onClick={() => changeDecision("DECLINE")}
            >
              Decline
            </Button>
          </div>
          {decision === "DECLINE" ? (
            <label className="mt-4 block text-sm font-medium">
              Controlled decline reason
              <select
                className="mt-2 w-full rounded-md border bg-background px-3 py-2"
                value={reason}
                onChange={(event) =>
                  setReason(event.target.value as FlexibleTicketDecisionReason)
                }
              >
                {declineReasons.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <label className="mt-4 block text-sm font-medium">
            Decision note
            <textarea
              className="mt-2 min-h-24 w-full rounded-md border bg-background px-3 py-2"
              minLength={3}
              maxLength={1000}
              value={note}
              onChange={(event) => {
                setNote(event.target.value);
                setPreview(null);
              }}
              placeholder="Record a concise factual decision. Do not include payment credentials or unnecessary sensitive information."
            />
          </label>
          {!preview ? (
            <div className="mt-4 flex gap-3">
              <Button
                disabled={isSaving || note.trim().length < 3}
                onClick={() => void reviewDecision()}
              >
                {isSaving ? "Reviewing…" : "Review decision"}
              </Button>
              <Button variant="outline" onClick={() => setActiveRequest(null)}>
                Cancel
              </Button>
            </div>
          ) : (
            <div className="mt-5 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-slate-900">
              <p className="font-bold">High-impact confirmation</p>
              <p className="mt-2">
                {preview.decision === "DECLINE"
                  ? "This records a decline and consumes no Flexible Ticket use."
                  : `This invokes the controlled ${selected.type === "REFUND" ? "Ticket refund" : "whole-Booking Session change"} and consumes ${preview.consumesUses} entitlement use${preview.consumesUses === 1 ? "" : "s"} only after completion.`}
              </p>
              {preview.mutation?.refundAmount !== undefined ? (
                <p className="mt-2 font-semibold">
                  Authoritative Ticket refund:{" "}
                  {money(
                    preview.mutation.refundAmount,
                    preview.mutation.currency,
                  )}
                </p>
              ) : null}
              {preview.mutation?.destinationSession ? (
                <p className="mt-2 font-semibold">
                  Destination: {preview.mutation.destinationSession.name} ·{" "}
                  {dateTime(preview.mutation.destinationSession.startDate)}
                </p>
              ) : null}
              {requiresManualRefund ? (
                <div className="mt-4 space-y-3 rounded-lg bg-white p-3">
                  <label className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={manualRefundConfirmed}
                      onChange={(event) =>
                        setManualRefundConfirmed(event.target.checked)
                      }
                    />
                    I completed the matching refund outside Glacier before
                    recording it.
                  </label>
                  {preview.mutation?.payment?.method === "STANDALONE_EFTPOS" ? (
                    <label className="block font-medium">
                      Terminal refund reference
                      <input
                        className="mt-1 w-full rounded-md border px-3 py-2 font-normal"
                        value={standaloneReference}
                        onChange={(event) =>
                          setStandaloneReference(event.target.value)
                        }
                      />
                    </label>
                  ) : null}
                </div>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-3">
                <Button
                  variant={decision === "DECLINE" ? "destructive" : "default"}
                  disabled={
                    isSaving ||
                    Boolean(requiresManualRefund && !manualRefundConfirmed) ||
                    Boolean(
                      preview.mutation?.payment?.method ===
                        "STANDALONE_EFTPOS" && !standaloneReference.trim(),
                    )
                  }
                  onClick={() => void confirmDecision()}
                >
                  {isSaving
                    ? "Confirming…"
                    : decision === "APPROVE"
                      ? "Confirm approval"
                      : "Confirm decline"}
                </Button>
                <Button variant="outline" onClick={() => setPreview(null)}>
                  Back
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}
