"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { PlatformShell } from "@/components/layout/PlatformShell";
import {
  BookingListItem,
  bookingOperationsService,
} from "@/services/booking-operations.service";

function money(value: string | number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(Number(value));
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<BookingListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    bookingOperationsService
      .list()
      .then(setBookings)
      .catch((requestError: unknown) => {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load bookings.",
        );
      })
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <PlatformShell>
      <div className="space-y-8">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Operations
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Bookings
          </h1>
          <p className="mt-2 text-muted-foreground">
            Track customer bookings, payment state and ticket issuance.
          </p>
        </div>

        {isLoading ? (
          <div className="rounded-xl border bg-card p-6">
            Loading bookings...
          </div>
        ) : null}

        {error ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {!isLoading && !error && bookings.length === 0 ? (
          <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
            No bookings have been created yet.
          </div>
        ) : null}

        {!isLoading && !error && bookings.length > 0 ? (
          <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 font-medium">Booking</th>
                    <th className="px-5 py-3 font-medium">Customer</th>
                    <th className="px-5 py-3 font-medium">Event</th>
                    <th className="px-5 py-3 font-medium">Booking state</th>
                    <th className="px-5 py-3 font-medium">Payment</th>
                    <th className="px-5 py-3 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-muted/30">
                      <td className="px-5 py-4">
                        <Link
                          href={`/bookings/${booking.id}`}
                          className="font-semibold underline-offset-4 hover:underline"
                        >
                          {booking.bookingNumber}
                        </Link>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {new Date(booking.createdAt).toLocaleString("en-AU")}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        {booking.customer.firstName} {booking.customer.lastName}
                      </td>
                      <td className="px-5 py-4">{booking.event.name}</td>
                      <td className="px-5 py-4">{booking.status}</td>
                      <td className="px-5 py-4">{booking.paymentStatus}</td>
                      <td className="px-5 py-4 text-right font-medium">
                        {money(booking.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </div>
    </PlatformShell>
  );
}
