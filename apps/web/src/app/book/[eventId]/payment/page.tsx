"use client";

import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";

import { PaymentStep } from "@/components/booking/PaymentStep";
import { ReservationCountdown } from "@/components/booking/ReservationCountdown";
import { useBookingJourney } from "@/components/booking/BookingJourneyProvider";
import { BookingJourneyShell } from "@/components/booking/BookingJourneyShell";
import { publicBookingService } from "@/services/public-booking.service";

export default function PaymentPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);
  const router = useRouter();
  const {
    reservation,
    paymentSubmitted,
    setPaymentSubmitted,
    setBookingStatus,
  } = useBookingJourney();
  const [statusError, setStatusError] = useState("");

  useEffect(() => {
    if (!reservation) router.replace(`/book/${eventId}/review`);
  }, [eventId, reservation, router]);

  useEffect(() => {
    if (!reservation || !paymentSubmitted) return;

    let active = true;
    async function refreshStatus() {
      try {
        const status = await publicBookingService.getBookingStatus(
          reservation!.booking.id,
          reservation!.booking.publicAccessToken,
        );
        if (!active) return;
        setBookingStatus(status);
        setStatusError("");
        if (status.status === "CONFIRMED" && status.paymentStatus === "PAID") {
          router.replace(`/book/${eventId}/confirmation`);
        }
      } catch {
        if (active) setStatusError("We couldn’t refresh the payment status. We’ll keep trying.");
      }
    }

    void refreshStatus();
    const interval = window.setInterval(() => void refreshStatus(), 2500);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [eventId, paymentSubmitted, reservation, router, setBookingStatus]);

  if (!reservation) return null;

  return (
    <BookingJourneyShell>
      <section className="mx-auto mt-5 max-w-3xl rounded-3xl border bg-white p-6 shadow-sm sm:p-9">
        <p className="text-sm font-semibold uppercase tracking-widest text-slate-500">Step 8 of 9</p>
        <h1 className="mt-3 text-3xl font-bold">Secure payment</h1>
        <p className="mt-2 text-slate-600">Reservation {reservation.booking.bookingNumber} has been created and inventory is temporarily held.</p>
        {reservation.booking.reservedUntil ? <div className="mt-6"><ReservationCountdown reservedUntil={reservation.booking.reservedUntil} /></div> : null}
        {paymentSubmitted ? (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <h2 className="font-bold text-amber-950">Payment submitted</h2>
            <p className="mt-2 text-sm leading-6 text-amber-900">We’re waiting for secure confirmation from Stripe. Your booking will only be marked paid and tickets issued after Glacier receives the verified payment webhook.</p>
            {statusError ? <p role="alert" className="mt-3 text-sm text-red-700">{statusError}</p> : null}
          </div>
        ) : (
          <PaymentStep reservation={reservation} onPaymentSubmitted={() => setPaymentSubmitted(true)} />
        )}
      </section>
    </BookingJourneyShell>
  );
}
