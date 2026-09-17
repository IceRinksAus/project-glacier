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
