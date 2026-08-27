"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { PlatformShell } from "@/components/layout/PlatformShell";
import { Button } from "@/components/ui/button";
import { getAuthUser } from "@/lib/auth";
import {
  bookingOperationsService,
  PaymentInvestigation,
} from "@/services/booking-operations.service";
import { BookingReschedulePanel } from "./BookingReschedulePanel";
import { FlexibleTicketRequestPanel } from "./FlexibleTicketRequestPanel";
import { TicketAdjustmentPanel } from "./TicketAdjustmentPanel";

function money(value: number, currency = "AUD") {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency,
  }).format(value);
}

function dateTime(value: string | null) {
  return value ? new Date(value).toLocaleString("en-AU") : "—";
}

export default function BookingPaymentPage() {
  const params = useParams<{ bookingId: string }>();
  const bookingId = params.bookingId;
  const [investigation, setInvestigation] =
    useState<PaymentInvestigation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReconciling, setIsReconciling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [bookingOperationVersion, setBookingOperationVersion] = useState(0);
  const role = getAuthUser()?.role;
  const canManageBooking = role === "OWNER" || role === "MANAGER";

  async function refreshInvestigation() {
    const response = await bookingOperationsService.investigate(bookingId);
    setInvestigation(response);
  }

  useEffect(() => {
    let cancelled = false;

    bookingOperationsService
      .investigate(bookingId)
      .then((response) => {
        if (!cancelled) {
          setInvestigation(response);
        }
      })
      .catch((requestError: unknown) => {
        if (!cancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load payment investigation.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  async function reconcile() {
    setIsReconciling(true);
    setError(null);
    setMessage(null);

    try {
      const response = await bookingOperationsService.reconcile(bookingId);
      setInvestigation(response.investigation);
      setMessage(
        response.investigation.requiresReconciliation
          ? "Provider state remains pending. No local status was changed."
          : "Payment state was reconciled with the provider.",
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Payment reconciliation failed.",
      );
    } finally {
      setIsReconciling(false);
    }
  }

  return (
    <PlatformShell>
      <div className="space-y-8">
        <div>
          <Link
            href="/bookings"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            ← Back to bookings
          </Link>
          <div className="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Payment investigation
              </p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight">
                {investigation?.bookingNumber ?? "Booking"}
              </h1>
            </div>
            {investigation?.requiresReconciliation ? (
              <Button
                size="lg"
                disabled={isReconciling}
                onClick={() => void reconcile()}
              >
                {isReconciling ? "Reconciling..." : "Reconcile payment"}
              </Button>
            ) : null}
          </div>
        </div>

        {isLoading ? (
          <div className="rounded-xl border bg-card p-6">
            Loading payment investigation...
          </div>
        ) : null}
        {error ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
            {error}
          </div>
        ) : null}
        {message ? (
          <div className="rounded-xl border bg-muted/50 p-4 text-sm">
            {message}
          </div>
        ) : null}

        {investigation ? (
          <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                ["Booking state", investigation.status],
                ["Payment state", investigation.paymentStatus],
                ["Total", money(investigation.total)],
                ["Ticket records", String(investigation.tickets.length)],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-xl border bg-card p-5 shadow-sm"
                >
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="mt-2 text-xl font-semibold">{value}</p>
                </div>
              ))}
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-xl border bg-card p-6 shadow-sm">
                <h2 className="text-lg font-semibold">Booking context</h2>
                <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-5 gap-y-3 text-sm">
                  <dt className="text-muted-foreground">Customer</dt>
                  <dd>
                    {investigation.customer.firstName}{" "}
                    {investigation.customer.lastName}
                  </dd>
                  <dt className="text-muted-foreground">Email</dt>
                  <dd>{investigation.customer.email ?? "No email recorded"}</dd>
                  <dt className="text-muted-foreground">Event</dt>
                  <dd>{investigation.event.name}</dd>
                  <dt className="text-muted-foreground">Booking source</dt>
                  <dd>
                    {investigation.source === "WALK_UP" ? "Walk-up" : "Online"}
                  </dd>
                  <dt className="text-muted-foreground">Session</dt>
                  <dd>{investigation.session?.name ?? "—"}</dd>
                  <dt className="text-muted-foreground">Reserved until</dt>
                  <dd>{dateTime(investigation.reservedUntil)}</dd>
                  <dt className="text-muted-foreground">Paid</dt>
                  <dd>{dateTime(investigation.paidAt)}</dd>
                  <dt className="text-muted-foreground">Confirmed</dt>
                  <dd>{dateTime(investigation.confirmedAt)}</dd>
                  <dt className="text-muted-foreground">Expired</dt>
                  <dd>{dateTime(investigation.expiredAt)}</dd>
                </dl>
              </div>

              <div className="rounded-xl border bg-card p-6 shadow-sm">
                <h2 className="text-lg font-semibold">Tickets</h2>
                <div className="mt-5 space-y-3">
                  {investigation.tickets.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No Tickets have been issued.
                    </p>
                  ) : (
                    investigation.tickets.map((ticket) => (
                      <div
                        key={ticket.ticketNumber}
                        className="rounded-lg border p-4 text-sm"
                      >
                        <p className="font-medium">{ticket.ticketNumber}</p>
                        <p className="mt-1 text-muted-foreground">
                          {ticket.status} · issued {dateTime(ticket.issuedAt)}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>

            <section className="rounded-xl border bg-card p-6 shadow-sm">
              <h2 className="text-lg font-semibold">
                Flexible Ticket entitlements
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Immutable purchased rights and remaining uses. Customer
                requests and controlled decisions are shown below.
              </p>
              <div className="mt-5 space-y-3">
                {(investigation.flexibleTicketEntitlements ?? []).length ===
                0 ? (
                  <p className="text-sm text-muted-foreground">
                    No Flexible Ticket coverage was purchased.
                  </p>
                ) : (
                  (investigation.flexibleTicketEntitlements ?? []).map(
                    (entitlement) => (
                      <article
                        key={entitlement.entitlementNumber}
                        className="rounded-lg border p-4 text-sm"
                      >
                        <div className="flex flex-col justify-between gap-2 sm:flex-row">
                          <div>
                            <p className="font-semibold">
                              {entitlement.participant.firstName}{" "}
                              {entitlement.participant.lastName}
                            </p>
                            <p className="mt-1 text-muted-foreground">
                              {entitlement.initialTicket?.ticketNumber ??
                                "Pending Ticket linkage"}{" "}
                              · {entitlement.status}
                            </p>
                          </div>
                          <p className="font-semibold">
                            {money(entitlement.feeAmount, entitlement.currency)}
                          </p>
                        </div>
                        <p className="mt-3">
                          {entitlement.customerSummarySnapshot}
                        </p>
                        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-muted-foreground">
                          <dt>Policy</dt>
                          <dd>Version {entitlement.policyVersion}</dd>
                          <dt>Uses</dt>
                          <dd>
                            {entitlement.remainingUses} of{" "}
                            {entitlement.permittedUseLimitSnapshot} remaining
                          </dd>
                          <dt>Cut-off</dt>
                          <dd>
                            {entitlement.cutoffMinutesBeforeSessionSnapshot}{" "}
                            minutes before Session
                          </dd>
                        </dl>
                      </article>
                    ),
                  )
                )}
              </div>
            </section>

            <section className="rounded-xl border bg-card p-6 shadow-sm">
              <h2 className="text-lg font-semibold">Payment attempts</h2>
              <div className="mt-5 space-y-4">
                {investigation.payments.map((payment) => (
                  <div key={payment.id} className="rounded-lg border p-5">
                    <div className="flex flex-col justify-between gap-2 sm:flex-row">
                      <div>
                        <p className="font-semibold">
                          {payment.method === "STANDALONE_EFTPOS"
                            ? "Standalone EFTPOS"
                            : payment.method === "CASH"
                              ? "Cash"
                              : "Online card"}
                          {payment.providerReferenceSummary
                            ? ` ${payment.providerReferenceSummary}`
                            : ""}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Provider: {payment.provider}
                        </p>
                        {payment.receivedByUser ? (
                          <p className="mt-1 text-sm text-muted-foreground">
                            Confirmed by {payment.receivedByUser.name}{" "}
                            {dateTime(payment.receivedAt)}
                          </p>
                        ) : null}
                        <p className="mt-1 text-sm text-muted-foreground">
                          Created {dateTime(payment.createdAt)}
                        </p>
                      </div>
                      <div className="sm:text-right">
                        <p className="font-semibold">
                          {money(payment.amount, payment.currency)}
                        </p>
                        <p className="mt-1 text-sm">{payment.status}</p>
                      </div>
                    </div>
                    {payment.failureMessage ? (
                      <p className="mt-4 rounded-lg bg-destructive/5 p-3 text-sm text-destructive">
                        {payment.failureCode ? `${payment.failureCode}: ` : ""}
                        {payment.failureMessage}
                      </p>
                    ) : null}
                    {payment.refunds.map((refund) => (
                      <div
                        key={refund.id}
                        className="mt-4 rounded-lg bg-muted/60 p-4 text-sm"
                      >
                        Refund {money(refund.amount, refund.currency)} ·{" "}
                        {refund.status}
                        {refund.reason ? ` · ${refund.reason}` : ""}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </section>

            {canManageBooking ? (
              <>
                <FlexibleTicketRequestPanel
                  bookingId={bookingId}
                  onCompleted={async () => {
                    await refreshInvestigation();
                    setBookingOperationVersion((version) => version + 1);
                  }}
                />
                <BookingReschedulePanel
                  bookingId={bookingId}
                  onCompleted={async () => {
                    await refreshInvestigation();
                    setBookingOperationVersion((version) => version + 1);
                  }}
                />
                <TicketAdjustmentPanel
                  key={bookingOperationVersion}
                  bookingId={bookingId}
                />
              </>
            ) : null}

            <section className="rounded-xl border bg-card p-6 shadow-sm">
              <h2 className="text-lg font-semibold">Reconciliation history</h2>
              <div className="mt-5 space-y-3">
                {investigation.paymentReconciliationAttempts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No manual reconciliation attempts recorded.
                  </p>
                ) : (
                  investigation.paymentReconciliationAttempts.map((attempt) => (
                    <div
                      key={attempt.id}
                      className="rounded-lg border p-4 text-sm"
                    >
                      <div className="flex flex-col justify-between gap-1 sm:flex-row">
                        <p className="font-medium">{attempt.outcome}</p>
                        <p className="text-muted-foreground">
                          {dateTime(attempt.attemptedAt)}
                        </p>
                      </div>
                      <p className="mt-1 text-muted-foreground">
                        Requested by {attempt.user.name}
                      </p>
                      {attempt.errorMessage ? (
                        <p className="mt-2 text-destructive">
                          {attempt.errorMessage}
                        </p>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </section>
          </>
        ) : null}
      </div>
    </PlatformShell>
  );
}
