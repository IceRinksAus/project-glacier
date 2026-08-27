"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  FlexibleTicketRequestReason,
  FlexibleTicketRequestType,
  FlexibleTicketRequestSummary,
  PublicFlexibleTicketRequestContext,
  flexibleTicketRequestService,
} from "@/services/flexible-ticket-request.service";

const reasonLabels: Record<FlexibleTicketRequestReason, string> = {
  CHANGE_OF_PLANS: "Change of plans",
  ILLNESS_OR_INJURY: "Illness or injury",
  BOOKING_ERROR: "Booking error",
  OTHER: "Other",
};

function dateTime(value: string) {
  return new Date(value).toLocaleString("en-AU");
}

function money(value: number, currency: string) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency,
  }).format(value);
}

export function FlexibleTicketRequestCustomerPanel({
  bookingId,
  publicAccessToken,
}: {
  bookingId: string;
  publicAccessToken: string;
}) {
  const [context, setContext] =
    useState<PublicFlexibleTicketRequestContext | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [requestType, setRequestType] =
    useState<FlexibleTicketRequestType | null>(null);
  const [selectedEntitlementIds, setSelectedEntitlementIds] = useState<
    string[]
  >([]);
  const [destinationSessionId, setDestinationSessionId] = useState("");
  const [reason, setReason] =
    useState<FlexibleTicketRequestReason>("CHANGE_OF_PLANS");
  const [note, setNote] = useState("");

  const refresh = useCallback(async () => {
    const response = await flexibleTicketRequestService.publicContext(
      bookingId,
      publicAccessToken,
    );
    setContext(response);
  }, [bookingId, publicAccessToken]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    flexibleTicketRequestService
      .publicContext(bookingId, publicAccessToken)
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
  }, [bookingId, publicAccessToken]);

  function beginRefund(entitlementId: string) {
    setRequestType("REFUND");
    setSelectedEntitlementIds([entitlementId]);
    setDestinationSessionId("");
    setError(null);
    setMessage(null);
  }

  function beginSessionChange() {
    setRequestType("SESSION_CHANGE");
    setSelectedEntitlementIds(
      context?.entitlements
        .filter(({ canRequestSessionChange }) => canRequestSessionChange)
        .map(({ id }) => id) ?? [],
    );
    setError(null);
    setMessage(null);
  }

  async function submit() {
    if (!requestType || selectedEntitlementIds.length === 0) return;
    if (requestType === "SESSION_CHANGE" && !destinationSessionId) {
      setError("Choose the Session you would like to request.");
      return;
    }
    setIsSaving(true);
    setError(null);
    setMessage(null);
    try {
      const created = await flexibleTicketRequestService.createPublic(
        bookingId,
        {
          publicAccessToken,
          idempotencyKey: globalThis.crypto.randomUUID(),
          type: requestType,
          entitlementIds: selectedEntitlementIds,
          destinationSessionId:
            requestType === "SESSION_CHANGE" ? destinationSessionId : undefined,
          customerReason: reason,
          customerNote: note.trim() || undefined,
        },
      );
      setMessage(
        `Request ${created.requestNumber} was submitted. No Ticket or payment has changed yet.`,
      );
      setRequestType(null);
      setSelectedEntitlementIds([]);
      setDestinationSessionId("");
      setNote("");
      await refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to submit the request.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function withdraw(request: FlexibleTicketRequestSummary) {
    setIsSaving(true);
    setError(null);
    setMessage(null);
    try {
      await flexibleTicketRequestService.withdrawPublic(
        bookingId,
        request.requestNumber,
        publicAccessToken,
      );
      setMessage(`Request ${request.requestNumber} was withdrawn.`);
      await refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to withdraw the request.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <section className="mt-8 rounded-2xl border bg-white p-6">
        Loading Flexible Ticket request options…
      </section>
    );
  }

  return (
    <section className="mt-8 rounded-2xl border border-sky-200 bg-sky-50 p-6">
      <h2 className="text-xl font-bold">Manage Flexible Tickets</h2>
      <p className="mt-2 text-sm leading-6 text-slate-700">
        Submit a request under your purchased coverage. Submitting does not
        cancel a Ticket, move a Session or guarantee a refund. The organiser
        must review and approve it.
      </p>

      {error ? (
        <p
          role="alert"
          className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      ) : null}
      {message ? (
        <p aria-live="polite" className="mt-4 rounded-xl bg-white p-3 text-sm">
          {message}
        </p>
      ) : null}

      <div className="mt-5 grid gap-3">
        {(context?.entitlements ?? []).map((entitlement) => (
          <article
            key={entitlement.entitlementNumber}
            className="rounded-xl border border-sky-200 bg-white p-4"
          >
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
              <div>
                <p className="font-bold">{entitlement.participantName}</p>
                <p className="mt-1 text-sm text-slate-600">
                  {entitlement.ticketNumber} · {entitlement.remainingUses} use
                  {entitlement.remainingUses === 1 ? "" : "s"} remaining
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Request deadline: {dateTime(entitlement.cutoffAt)}
                </p>
              </div>
              {entitlement.canRequestRefund ? (
                <Button
                  variant="outline"
                  onClick={() => beginRefund(entitlement.id)}
                >
                  Request cancellation/refund
                </Button>
              ) : (
                <span className="text-sm text-slate-500">
                  Refund request unavailable
                </span>
              )}
            </div>
          </article>
        ))}
      </div>

      {context?.canRequestSessionChange ? (
        <Button className="mt-4" variant="outline" onClick={beginSessionChange}>
          Request a different Session
        </Button>
      ) : context?.entitlements.length ? (
        <p className="mt-4 text-sm text-slate-600">
          A whole-Booking Session change is available only when every active
          Ticket has eligible Flexible Ticket coverage. Contact the organiser if
          only some attendees need to change.
        </p>
      ) : null}

      {requestType ? (
        <div className="mt-6 rounded-xl border border-sky-300 bg-white p-5">
          <h3 className="font-bold">
            Review {requestType === "REFUND" ? "refund" : "Session-change"}{" "}
            request
          </h3>
          {requestType === "REFUND" ? (
            <div className="mt-3 text-sm text-slate-700">
              {context?.entitlements
                .filter(({ id }) => selectedEntitlementIds.includes(id))
                .map((entitlement) => (
                  <p key={entitlement.id}>
                    {entitlement.participantName} · {entitlement.ticketNumber} ·{" "}
                    Ticket value{" "}
                    {money(entitlement.ticketValue, entitlement.currency)}
                  </p>
                ))}
              <p className="mt-2">
                The organiser will calculate the authoritative Ticket refund
                value. The Flexible Ticket fee may remain non-refundable under
                your purchased terms.
              </p>
            </div>
          ) : (
            <label className="mt-4 block text-sm font-semibold">
              Requested Session
              <select
                className="mt-2 w-full rounded-xl border px-3 py-2 font-normal"
                value={destinationSessionId}
                onChange={(event) =>
                  setDestinationSessionId(event.target.value)
                }
              >
                <option value="">Choose a Session</option>
                {(context?.destinations ?? []).map((session) => (
                  <option key={session.id} value={session.id}>
                    {session.name} · {dateTime(session.startDate)}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="mt-4 block text-sm font-semibold">
            Reason
            <select
              className="mt-2 w-full rounded-xl border px-3 py-2 font-normal"
              value={reason}
              onChange={(event) =>
                setReason(event.target.value as FlexibleTicketRequestReason)
              }
            >
              {Object.entries(reasonLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="mt-4 block text-sm font-semibold">
            Optional note
            <textarea
              className="mt-2 min-h-24 w-full rounded-xl border px-3 py-2 font-normal"
              maxLength={500}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Add concise information for the organiser. Do not include payment or sensitive health details."
            />
          </label>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button disabled={isSaving} onClick={() => void submit()}>
              {isSaving ? "Submitting…" : "Submit request"}
            </Button>
            <Button
              variant="outline"
              disabled={isSaving}
              onClick={() => setRequestType(null)}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      {(context?.requests ?? []).length ? (
        <div className="mt-8">
          <h3 className="font-bold">Request history</h3>
          <div className="mt-3 grid gap-3">
            {context!.requests.map((request) => (
              <article
                key={request.requestNumber}
                className="rounded-xl border border-sky-200 bg-white p-4 text-sm"
              >
                <div className="flex flex-col justify-between gap-2 sm:flex-row">
                  <div>
                    <p className="font-bold">{request.requestNumber}</p>
                    <p className="mt-1 text-slate-600">
                      {request.type === "REFUND"
                        ? "Cancellation/refund"
                        : "Session change"}{" "}
                      · {request.status}
                    </p>
                    <p className="mt-1 text-slate-600">
                      Submitted {dateTime(request.submittedAt)}
                    </p>
                  </div>
                  {request.canWithdraw ? (
                    <Button
                      variant="outline"
                      disabled={isSaving}
                      onClick={() => void withdraw(request)}
                    >
                      Withdraw request
                    </Button>
                  ) : null}
                </div>
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
        </div>
      ) : null}
    </section>
  );
}
