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
  const {
    selectedDateKey,
    selectedSessionId,
    ticketQuantities,
    setTicketQuantity,
    totalTicketQuantity,
    flexibleTicketQuote,
    flexibleTicketDecision,
    setFlexibleTicketQuote,
    acceptFlexibleTickets,
    declineFlexibleTickets,
  } = useBookingJourney();
  const [ticketTypes, setTicketTypes] = useState<PublicTicketType[]>([]);
  const [error, setError] = useState("");
  const [isQuoting, setIsQuoting] = useState(false);
  const [showOffer, setShowOffer] = useState(false);
  const [chooseTickets, setChooseTickets] = useState(false);
  const [flexibleQuantities, setFlexibleQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!selectedSessionId) {
      router.replace(`/book/${eventId}/${selectedDateKey ? "session" : "date"}`);
      return;
    }
    let active = true;
    publicBookingService.getTicketTypes(eventId)
      .then((results) => { if (active) setTicketTypes(results); })
      .catch(() => { if (active) setError("We couldn’t load the available Ticket Types."); });
    return () => { active = false; };
  }, [eventId, router, selectedDateKey, selectedSessionId]);

  const subtotal = useMemo(() => ticketTypes.reduce(
    (total, ticketType) => total + ticketType.price * (ticketQuantities[ticketType.id] ?? 0), 0,
  ), [ticketQuantities, ticketTypes]);
  const currency = (amount: number) => new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(amount);

  async function continueFromTickets() {
    if (!selectedSessionId || totalTicketQuantity === 0 || isQuoting) return;
    if (flexibleTicketDecision !== "UNDECIDED") {
      router.push(`/book/${eventId}/participants`);
      return;
    }
    try {
      setIsQuoting(true);
      setError("");
      const quote = await publicBookingService.quoteFlexibleTicket(eventId, {
        sessionId: selectedSessionId,
        tickets: ticketTypes
          .map((ticketType) => ({
            ticketTypeId: ticketType.id,
            quantity: ticketQuantities[ticketType.id] ?? 0,
          }))
          .filter(({ quantity }) => quantity > 0),
      });
      if (!quote.available) {
        declineFlexibleTickets();
        router.push(`/book/${eventId}/participants`);
        return;
      }
      setFlexibleTicketQuote(quote);
      setFlexibleQuantities(
        Object.fromEntries(
          (quote.tickets ?? []).map((ticket) => [ticket.ticketTypeId, ticket.quantity]),
        ),
      );
      setChooseTickets(false);
      setShowOffer(true);
    } catch {
      setError("We couldn’t check the Flexible Ticket option. Please try again.");
    } finally {
      setIsQuoting(false);
    }
  }

  function finishOffer(quantities?: Record<string, number>) {
    if (quantities) acceptFlexibleTickets(quantities);
    else declineFlexibleTickets();
    setShowOffer(false);
    router.push(`/book/${eventId}/participants`);
  }

  const selectedFlexibleCount = Object.values(flexibleQuantities).reduce(
    (total, quantity) => total + quantity,
    0,
  );
  const selectedFlexibleTotal = (flexibleTicketQuote?.tickets ?? []).reduce(
    (total, ticket) =>
      total + ticket.feePerTicket * (flexibleQuantities[ticket.ticketTypeId] ?? 0),
    0,
  );

  return (
    <BookingJourneyShell>
      <section className="mx-auto mt-5 max-w-3xl rounded-3xl border bg-white p-6 shadow-sm sm:p-9">
        <p className="text-sm font-semibold uppercase tracking-widest text-slate-500">Step 3 of 9</p>
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
            <button type="button" disabled={totalTicketQuantity === 0 || isQuoting} onClick={continueFromTickets} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">{isQuoting ? "Checking options…" : "Continue"} <ArrowRight className="size-4" /></button>
          </div>
        </div>
      </section>

      {showOffer && flexibleTicketQuote?.available ? (
        <div className="fixed inset-0 z-50 grid place-items-end bg-slate-950/55 p-0 sm:place-items-center sm:p-6" role="presentation">
          <section role="dialog" aria-modal="true" aria-labelledby="flexible-ticket-title" className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:max-w-xl sm:rounded-3xl sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-widest text-sky-700">Optional Ticket add-on</p>
            <h2 id="flexible-ticket-title" className="mt-2 text-3xl font-bold">Want peace of mind?</h2>
            <p className="mt-3 text-slate-700">Make your selected Tickets flexible for eligible changes or cancellation requests.</p>
            <p className="mt-4 rounded-2xl bg-sky-50 p-4 font-semibold text-sky-950">{flexibleTicketQuote.customerSummary}</p>
            <ul className="mt-5 grid gap-2 text-sm text-slate-700">
              {flexibleTicketQuote.allowsSessionChange ? <li>✓ Eligible Session changes before the cut-off</li> : null}
              {flexibleTicketQuote.allowsRefundRequest ? <li>✓ Eligible cancellation/refund requests before the cut-off</li> : null}
              <li>✓ Recorded separately for each covered Ticket</li>
            </ul>

            {chooseTickets ? (
              <div className="mt-6 grid gap-3">
                {(flexibleTicketQuote.tickets ?? []).map((ticket) => {
                  const quantity = flexibleQuantities[ticket.ticketTypeId] ?? 0;
                  return (
                    <div key={ticket.ticketTypeId} className="flex items-center justify-between rounded-2xl border p-4">
                      <div><p className="font-bold">{ticket.ticketTypeName}</p><p className="text-sm text-slate-600">{currency(ticket.feePerTicket)} per Ticket</p></div>
                      <div className="flex items-center gap-3" aria-label={`${ticket.ticketTypeName} Flexible Ticket quantity`}>
                        <button type="button" aria-label={`Remove ${ticket.ticketTypeName} flexibility`} disabled={quantity === 0} onClick={() => setFlexibleQuantities((current) => ({ ...current, [ticket.ticketTypeId]: Math.max(0, quantity - 1) }))} className="grid size-9 place-items-center rounded-full border disabled:opacity-30"><Minus className="size-4" /></button>
                        <span className="w-6 text-center font-bold">{quantity}</span>
                        <button type="button" aria-label={`Add ${ticket.ticketTypeName} flexibility`} disabled={quantity >= ticket.quantity} onClick={() => setFlexibleQuantities((current) => ({ ...current, [ticket.ticketTypeId]: Math.min(ticket.quantity, quantity + 1) }))} className="grid size-9 place-items-center rounded-full border disabled:opacity-30"><Plus className="size-4" /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}

            <details className="mt-5 rounded-2xl border p-4 text-sm text-slate-600"><summary className="cursor-pointer font-semibold text-slate-900">Material terms</summary><p className="mt-3 whitespace-pre-wrap">{flexibleTicketQuote.materialTerms}</p></details>
            <p className="mt-4 text-xs text-slate-500">Flexible Ticket rights are subject to the displayed terms and applicable law. Destination availability is not guaranteed.</p>

            <div className="mt-7 grid gap-3">
              {chooseTickets ? (
                <button type="button" disabled={selectedFlexibleCount === 0} onClick={() => finishOffer(flexibleQuantities)} className="rounded-xl bg-slate-950 px-5 py-3 font-bold text-white disabled:opacity-40">Add to {selectedFlexibleCount} {selectedFlexibleCount === 1 ? "Ticket" : "Tickets"} — {currency(selectedFlexibleTotal)}</button>
              ) : (
                <button type="button" onClick={() => finishOffer(Object.fromEntries((flexibleTicketQuote.tickets ?? []).map((ticket) => [ticket.ticketTypeId, ticket.quantity])))} className="rounded-xl bg-slate-950 px-5 py-3 font-bold text-white">Add to all Tickets — {currency(flexibleTicketQuote.totalFee ?? 0)}</button>
              )}
              <button type="button" onClick={() => setChooseTickets((current) => !current)} className="rounded-xl border px-5 py-3 font-bold">{chooseTickets ? "Back to all Tickets" : "Choose Tickets"}</button>
              <button type="button" onClick={() => finishOffer()} className="px-5 py-2 text-sm font-semibold text-slate-600">No thanks</button>
            </div>
          </section>
        </div>
      ) : null}
    </BookingJourneyShell>
  );
}
