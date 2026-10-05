"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { PlatformShell } from "@/components/layout/PlatformShell";
import { customerService, CustomerDetail } from "@/services/customer.service";

function money(value: string | number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(Number(value));
}

export default function CustomerDetailPage() {
  const { customerId } = useParams<{ customerId: string }>();
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [error, setError] = useState("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const currentMarketingEvidence = customer?.marketingConsentEvidence.filter(
    (evidence, index, allEvidence) =>
      evidence.event &&
      allEvidence.findIndex(
        (candidate) => candidate.eventId === evidence.eventId,
      ) === index,
  );

  async function withdrawMarketing(eventId: string) {
    setIsWithdrawing(true);
    setError("");
    try {
      await customerService.withdrawMarketing(customerId, eventId);
      setCustomer(await customerService.findOne(customerId));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to record the withdrawal.");
    } finally {
      setIsWithdrawing(false);
    }
  }

  useEffect(() => {
    void customerService
      .findOne(customerId)
      .then(setCustomer)
      .catch((cause) =>
        setError(
          cause instanceof Error ? cause.message : "Unable to load Customer.",
        ),
      );
  }, [customerId]);

  return (
    <PlatformShell>
      <div className="space-y-6">
        <Link
          href="/customers"
          className="text-sm font-medium text-primary hover:underline"
        >
          ← Customers
        </Link>
        {error ? (
          <p
            role="alert"
            className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 text-destructive"
          >
            {error}
          </p>
        ) : null}
        {!customer && !error ? (
          <p className="rounded-xl border bg-card p-6">Loading Customer...</p>
        ) : null}
        {customer ? (
          <>
            <header className="rounded-xl border bg-card p-6 shadow-sm">
              <p className="text-sm font-medium text-primary">Customer</p>
              <h1 className="mt-1 text-3xl font-semibold">
                {customer.firstName} {customer.lastName}
              </h1>
              <div className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-sm text-muted-foreground">
                <span>{customer.email || "No email"}</span>
                <span>{customer.phone || "No phone"}</span>
              </div>
            </header>
            <section className="rounded-xl border bg-card p-6 shadow-sm">
              <h2 className="text-xl font-semibold">Marketing choice</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                This applies only to the purchasing adult. Transactional Tickets, receipts and safety information remain available after withdrawal.
              </p>
              <div className="mt-5 space-y-3">
                {currentMarketingEvidence?.map((evidence) => (
                  <article key={evidence.eventId} className="flex flex-col justify-between gap-3 rounded-lg border p-4 sm:flex-row sm:items-center">
                    <div>
                      <p className="font-semibold">{evidence.event?.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {evidence.decision === "GRANTED" ? "Marketing permitted" : evidence.decision === "WITHDRAWN" ? "Permission withdrawn" : "Marketing declined"} · {new Date(evidence.occurredAt).toLocaleString("en-AU")}
                      </p>
                    </div>
                    {evidence.decision === "GRANTED" && evidence.eventId ? (
                      <button type="button" disabled={isWithdrawing} onClick={() => void withdrawMarketing(evidence.eventId!)} className="rounded-lg border px-3 py-2 text-sm font-semibold disabled:opacity-50">
                        Record withdrawal
                      </button>
                    ) : null}
                  </article>
                ))}
                {currentMarketingEvidence?.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No checkout marketing choice has been recorded.</p>
                ) : null}
              </div>
            </section>
            <section className="rounded-xl border bg-card p-6 shadow-sm">
              <h2 className="text-xl font-semibold">Booking history</h2>
              <div className="mt-5 space-y-3">
                {customer.bookings.map((booking) => (
                  <article
                    key={booking.id}
                    className="flex flex-col justify-between gap-4 rounded-lg border p-4 sm:flex-row sm:items-center"
                  >
                    <div>
                      <Link
                        href={`/bookings/${booking.id}`}
                        className="font-semibold text-primary hover:underline"
                      >
                        {booking.bookingNumber}
                      </Link>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {booking.event.name} ·{" "}
                        {new Date(booking.createdAt).toLocaleString("en-AU")}
                      </p>
                    </div>
                    <div className="text-sm sm:text-right">
                      <p className="font-semibold">{money(booking.total)}</p>
                      <p className="mt-1 text-muted-foreground">
                        {booking.status} · {booking.paymentStatus}
                      </p>
                    </div>
                  </article>
                ))}
                {customer.bookings.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No authorised Bookings are available.
                  </p>
                ) : null}
              </div>
            </section>
          </>
        ) : null}
      </div>
    </PlatformShell>
  );
}
