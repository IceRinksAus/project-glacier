"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { use, useEffect, useMemo, useState } from "react";

import { useBookingJourney } from "@/components/booking/BookingJourneyProvider";
import { BookingJourneyShell } from "@/components/booking/BookingJourneyShell";
import {
  PublicEvent,
  PublicSession,
  PublicTicketType,
  publicBookingService,
} from "@/services/public-booking.service";

export default function ReviewPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);
  const router = useRouter();
  const journey = useBookingJourney();
  const [event, setEvent] = useState<PublicEvent | null>(null);
  const [sessions, setSessions] = useState<PublicSession[]>([]);
  const [ticketTypes, setTicketTypes] = useState<PublicTicketType[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const customerComplete = Boolean(
    journey.customerData.firstName.trim() &&
    journey.customerData.lastName.trim() &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(journey.customerData.email.trim()),
  );

  useEffect(() => {
    if (!journey.selectedSessionId || !journey.rulePreview?.valid || !customerComplete) {
      router.replace(`/book/${eventId}/${journey.selectedSessionId ? "details" : "session"}`);
      return;
    }
    let active = true;
    Promise.all([
      publicBookingService.getEvent(eventId),
      publicBookingService.getSessions(eventId),
      publicBookingService.getTicketTypes(eventId),
    ]).then(([eventResult, sessionResults, ticketResults]) => {
      if (active) {
        setEvent(eventResult);
        setSessions(sessionResults);
        setTicketTypes(ticketResults);
      }
    }).catch(() => { if (active) setError("We couldn’t load your booking summary."); });
    return () => { active = false; };
  }, [customerComplete, eventId, journey.rulePreview, journey.selectedSessionId, router]);

  const selectedSession = sessions.find((session) => session.id === journey.selectedSessionId) ?? null;
  const selectedTickets = useMemo(() => ticketTypes.map((ticketType) => ({
    ticketType,
    quantity: journey.ticketQuantities[ticketType.id] ?? 0,
  })).filter(({ quantity }) => quantity > 0), [journey.ticketQuantities, ticketTypes]);
  const ticketSubtotal = selectedTickets.reduce(
    (total, item) => total + item.ticketType.price * item.quantity,
    0,
  );
  const total = ticketSubtotal + journey.productSubtotal;
  const currency = (amount: number) => new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(amount);

  async function reserveTickets() {
    if (!selectedSession || isSubmitting) return;
    try {
      setIsSubmitting(true);
      setError("");
      const customer = await publicBookingService.createCustomer({
        firstName: journey.customerData.firstName.trim(),
        lastName: journey.customerData.lastName.trim(),
        email: journey.customerData.email.trim(),
        ...(journey.customerData.phone.trim() ? { phone: journey.customerData.phone.trim() } : {}),
      });
      const participants = selectedTickets.flatMap(({ ticketType, quantity }) =>
        Array.from({ length: quantity }, (_, index) => {
          const participant = journey.participantData[`${ticketType.id}-${index}`];
          return {
            firstName: participant.firstName.trim(),
            ...(participant.lastName.trim() ? { lastName: participant.lastName.trim() } : {}),
            age: Number(participant.age),
            ticketTypeId: ticketType.id,
          };
        }),
      );
      const reservation = await publicBookingService.createBooking({
        customerId: customer.id,
        eventId,
        sessionId: selectedSession.id,
        flexibleBooking: false,
        participants,
        products: journey.selectedProducts.map((product) => ({
          productId: product.productId,
          ...(product.productVariantId ? { productVariantId: product.productVariantId } : {}),
          quantity: product.quantity,
        })),
      });
      journey.setReservation(reservation);
      router.push(`/book/${eventId}/payment`);
    } catch (reservationError) {
      setError(reservationError instanceof Error
        ? reservationError.message
        : "We couldn’t create your reservation.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!journey.selectedSessionId || !customerComplete) return null;

  return (
    <BookingJourneyShell>
      <section className="mx-auto mt-5 max-w-3xl rounded-3xl border bg-white p-6 shadow-sm sm:p-9">
        <p className="text-sm font-semibold uppercase tracking-widest text-slate-500">Step 6 of 8</p>
        <h1 className="mt-3 text-3xl font-bold">Review and reserve</h1>
        <p className="mt-2 text-slate-600">Nothing is charged until you complete the secure payment step.</p>
        <div className="mt-8 grid gap-4">
          <Summary title="Event" lines={[
            event?.name ?? "Loading Event…",
            selectedSession ? new Date(selectedSession.startDate).toLocaleString("en-AU") : "Loading Session…",
          ]} />
          <Summary title="Tickets" lines={selectedTickets.map(({ ticketType, quantity }) =>
            `${quantity} × ${ticketType.name} — ${currency(ticketType.price * quantity)}`,
          )} />
          <Summary title="Add-ons" lines={journey.selectedProducts.length
            ? journey.selectedProducts.map((product) =>
              `${product.quantity} × ${product.name} — ${currency(product.price * product.quantity)}`,
            )
            : ["No optional add-ons selected"]} />
          <Summary title="Booking contact" lines={[
            `${journey.customerData.firstName} ${journey.customerData.lastName}`,
            journey.customerData.email,
          ]} />
        </div>
        {error ? <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p> : null}
        <div className="mt-8 flex items-center justify-between border-t pt-6">
          <button type="button" onClick={() => router.push(`/book/${eventId}/details`)} className="inline-flex items-center gap-2 rounded-xl border px-5 py-3 font-bold"><ArrowLeft className="size-4" /> Back</button>
          <div className="text-right">
            <p className="text-sm text-slate-500">Reservation total</p>
            <p className="text-2xl font-bold">{currency(total)}</p>
            <button type="button" disabled={!selectedSession || isSubmitting} onClick={reserveTickets} className="mt-3 rounded-xl bg-slate-950 px-6 py-3 font-bold text-white disabled:opacity-40">{isSubmitting ? "Creating reservation…" : "Reserve tickets"}</button>
          </div>
        </div>
      </section>
    </BookingJourneyShell>
  );
}

function Summary({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="rounded-2xl border p-5">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">{title}</h2>
      {lines.map((line, index) => <p key={`${line}-${index}`} className="mt-2 font-medium">{line}</p>)}
    </div>
  );
}
