"use client";

import { CheckCircle2, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect } from "react";

import { useBookingJourney } from "@/components/booking/BookingJourneyProvider";
import { BookingJourneyShell } from "@/components/booking/BookingJourneyShell";

export default function ConfirmationPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);
  const router = useRouter();
  const { bookingStatus } = useBookingJourney();
  const confirmed = bookingStatus?.status === "CONFIRMED" && bookingStatus.paymentStatus === "PAID";

  useEffect(() => {
    if (!confirmed) router.replace(`/book/${eventId}/payment`);
  }, [confirmed, eventId, router]);

  if (!bookingStatus || !confirmed) return null;

  return (
    <BookingJourneyShell>
      <section className="mx-auto mt-5 max-w-3xl rounded-3xl border bg-white p-6 shadow-sm sm:p-9">
        <CheckCircle2 className="size-12 text-emerald-600" />
        <p className="mt-5 text-sm font-semibold uppercase tracking-widest text-slate-500">Step 8 of 8</p>
        <p className="mt-2 text-sm font-semibold uppercase tracking-widest text-emerald-700">Payment confirmed</p>
        <h1 className="mt-2 text-3xl font-bold">Your booking is confirmed</h1>
        <p className="mt-3 text-slate-600">Booking {bookingStatus.bookingNumber} for {bookingStatus.event.name} has been paid and your Tickets have been issued.</p>

        <div className="mt-8 grid gap-3">
          {bookingStatus.tickets.map((ticket) => (
            <Link key={ticket.ticketNumber} href={`/tickets/${ticket.secureToken}`} className="flex items-center justify-between rounded-2xl border p-5 transition hover:bg-slate-50">
              <div><p className="font-bold">{ticket.participant.firstName} {ticket.participant.lastName}</p><p className="mt-1 font-mono text-sm text-slate-500">{ticket.ticketNumber}</p></div>
              <span className="inline-flex items-center gap-2 font-semibold">View Ticket <ExternalLink className="size-4" /></span>
            </Link>
          ))}
        </div>

        {bookingStatus.event.waiverPublicSlug ? (
          <div className="mt-8 rounded-2xl border border-sky-200 bg-sky-50 p-6">
            <h2 className="text-xl font-bold">Complete the Event Waiver</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">Each adult skater should complete their own waiver before entering the ice. A responsible adult may include children in their care.</p>
            <Link href={`/waivers/${bookingStatus.event.waiverPublicSlug}`} className="mt-4 inline-flex rounded-xl bg-sky-950 px-5 py-3 font-bold text-white">Complete waiver now</Link>
          </div>
        ) : null}
      </section>
    </BookingJourneyShell>
  );
}
