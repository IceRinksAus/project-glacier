"use client";

import { ArrowLeft, ArrowRight, Minus, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { use, useEffect, useMemo, useState } from "react";

import { useBookingJourney } from "@/components/booking/BookingJourneyProvider";
import { BookingJourneyShell } from "@/components/booking/BookingJourneyShell";
import { PublicTicketType, publicBookingService } from "@/services/public-booking.service";

export default function TicketsPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);
  const router = useRouter();
  const { selectedSessionId, ticketQuantities, setTicketQuantity, totalTicketQuantity } = useBookingJourney();
  const [ticketTypes, setTicketTypes] = useState<PublicTicketType[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!selectedSessionId) {
      router.replace(`/book/${eventId}/session`);
      return;
    }
    let active = true;
    publicBookingService.getTicketTypes(eventId)
      .then((results) => { if (active) setTicketTypes(results); })
      .catch(() => { if (active) setError("We couldn’t load the available Ticket Types."); });
    return () => { active = false; };
  }, [eventId, router, selectedSessionId]);

  const subtotal = useMemo(() => ticketTypes.reduce(
    (total, ticketType) => total + ticketType.price * (ticketQuantities[ticketType.id] ?? 0), 0,
  ), [ticketQuantities, ticketTypes]);
  const currency = (amount: number) => new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(amount);

  return (
    <BookingJourneyShell>
      <section className="mx-auto mt-5 max-w-3xl rounded-3xl border bg-white p-6 shadow-sm sm:p-9">
        <p className="text-sm font-semibold uppercase tracking-widest text-slate-500">Step 2 of 8</p>
        <h1 className="mt-3 text-3xl font-bold">Choose your Tickets</h1>
        <p className="mt-2 text-slate-600">All Ticket Types draw from the shared capacity of your selected Session.</p>

        {error ? <p role="alert" className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p> : null}
        <div className="mt-8 grid gap-3">
          {ticketTypes.map((ticketType) => {
            const quantity = ticketQuantities[ticketType.id] ?? 0;
            return (
              <article key={ticketType.id} className="flex flex-col gap-5 rounded-2xl border p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3"><h2 className="font-bold">{ticketType.name}</h2><span className="font-semibold">{currency(ticketType.price)}</span></div>
                  {ticketType.description ? <p className="mt-2 text-sm text-slate-600">{ticketType.description}</p> : null}
                </div>
                <div className="flex items-center gap-3" aria-label={`${ticketType.name} quantity`}>
                  <button type="button" aria-label={`Remove one ${ticketType.name}`} disabled={quantity === 0} onClick={() => setTicketQuantity(ticketType.id, quantity - 1)} className="grid size-10 place-items-center rounded-full border disabled:opacity-30"><Minus className="size-4" /></button>
                  <span className="w-8 text-center font-bold" aria-live="polite">{quantity}</span>
                  <button type="button" aria-label={`Add one ${ticketType.name}`} onClick={() => setTicketQuantity(ticketType.id, quantity + 1)} className="grid size-10 place-items-center rounded-full border"><Plus className="size-4" /></button>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-8 flex items-center justify-between border-t pt-6">
          <div><p className="text-sm text-slate-500">{totalTicketQuantity} {totalTicketQuantity === 1 ? "ticket" : "tickets"}</p><p className="text-xl font-bold">{currency(subtotal)}</p></div>
          <div className="flex gap-3">
            <button type="button" onClick={() => router.push(`/book/${eventId}/session`)} className="inline-flex items-center gap-2 rounded-xl border px-5 py-3 font-bold"><ArrowLeft className="size-4" /> Back</button>
            <button type="button" disabled={totalTicketQuantity === 0} onClick={() => router.push(`/book/${eventId}/participants`)} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">Continue <ArrowRight className="size-4" /></button>
          </div>
        </div>
      </section>
    </BookingJourneyShell>
  );
}
