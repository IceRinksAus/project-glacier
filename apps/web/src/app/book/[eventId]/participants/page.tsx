"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { use, useEffect, useMemo, useState } from "react";

import { useBookingJourney } from "@/components/booking/BookingJourneyProvider";
import { BookingJourneyShell } from "@/components/booking/BookingJourneyShell";
import { PublicTicketType, publicBookingService } from "@/services/public-booking.service";

interface ParticipantSlot {
  key: string;
  ticketTypeId: string;
  ticketTypeName: string;
  participantNumber: number;
}

export default function ParticipantsPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);
  const router = useRouter();
  const {
    selectedSessionId,
    ticketQuantities,
    participantData,
    updateParticipant,
    setRulePreview,
    totalTicketQuantity,
  } = useBookingJourney();
  const [ticketTypes, setTicketTypes] = useState<PublicTicketType[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!selectedSessionId || totalTicketQuantity === 0) {
      router.replace(`/book/${eventId}/${selectedSessionId ? "tickets" : "session"}`);
      return;
    }
    let active = true;
    publicBookingService.getTicketTypes(eventId)
      .then((results) => { if (active) setTicketTypes(results); })
      .catch(() => { if (active) setError("We couldn’t load the participant form."); });
    return () => { active = false; };
  }, [eventId, router, selectedSessionId, totalTicketQuantity]);

  const slots = useMemo<ParticipantSlot[]>(() => ticketTypes.flatMap((ticketType) =>
    Array.from({ length: ticketQuantities[ticketType.id] ?? 0 }, (_, index) => ({
      key: `${ticketType.id}-${index}`,
      ticketTypeId: ticketType.id,
      ticketTypeName: ticketType.name,
      participantNumber: index + 1,
    })),
  ), [ticketQuantities, ticketTypes]);

  const complete = slots.length > 0 && slots.every((slot) => {
    const participant = participantData[slot.key];
    const age = Number(participant?.age);
    return Boolean(
      participant?.firstName.trim() &&
      participant.age.trim() &&
      Number.isInteger(age) &&
      age >= 0,
    );
  });

  async function continueToAddOns() {
    if (!complete || !selectedSessionId || isChecking) return;
    try {
      setIsChecking(true);
      setError("");
      const result = await publicBookingService.evaluateRules(eventId, {
        sessionId: selectedSessionId,
        flexibleBooking: false,
        participants: slots.map((slot) => ({
          firstName: participantData[slot.key].firstName.trim(),
          ...(participantData[slot.key].lastName.trim()
            ? { lastName: participantData[slot.key].lastName.trim() }
            : {}),
          age: Number(participantData[slot.key].age),
          ticketTypeId: slot.ticketTypeId,
        })),
      });
      setRulePreview(result);
      if (!result.valid || result.errors.length > 0) {
        setError(result.errors.join(" ") || "These participant details do not satisfy the Event requirements.");
        return;
      }
      router.push(`/book/${eventId}/addons`);
    } catch {
      setRulePreview(null);
      setError("We couldn’t check the Event requirements. Please try again.");
    } finally {
      setIsChecking(false);
    }
  }

  return (
    <BookingJourneyShell>
      <section className="mx-auto mt-5 max-w-3xl rounded-3xl border bg-white p-6 shadow-sm sm:p-9">
        <p className="text-sm font-semibold uppercase tracking-widest text-slate-500">Step 3 of 7</p>
        <h1 className="mt-3 text-3xl font-bold">Participant details</h1>
        <p className="mt-2 text-slate-600">Tell us who will be attending. Ages are checked against the Event’s Ticket and Product rules.</p>

        <div className="mt-8 grid gap-5">
          {slots.map((slot) => {
            const participant = participantData[slot.key] ?? { firstName: "", lastName: "", age: "" };
            return (
              <fieldset key={slot.key} className="rounded-2xl border p-5">
                <legend className="px-2 font-bold">{slot.ticketTypeName} participant {slot.participantNumber}</legend>
                <div className="mt-2 grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2"><span className="text-sm font-semibold">First name</span><input required value={participant.firstName} onChange={(event) => updateParticipant(slot.key, "firstName", event.target.value)} className="h-11 rounded-xl border px-3" /></label>
                  <label className="grid gap-2"><span className="text-sm font-semibold">Last name <span className="font-normal text-slate-500">(optional)</span></span><input value={participant.lastName} onChange={(event) => updateParticipant(slot.key, "lastName", event.target.value)} className="h-11 rounded-xl border px-3" /></label>
                  <label className="grid gap-2 sm:max-w-44"><span className="text-sm font-semibold">Age</span><input required type="number" min="0" step="1" value={participant.age} onChange={(event) => updateParticipant(slot.key, "age", event.target.value)} className="h-11 rounded-xl border px-3" /></label>
                </div>
              </fieldset>
            );
          })}
        </div>

        {error ? <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p> : null}
        <div className="mt-8 flex justify-between border-t pt-6">
          <button type="button" onClick={() => router.push(`/book/${eventId}/tickets`)} className="inline-flex items-center gap-2 rounded-xl border px-5 py-3 font-bold"><ArrowLeft className="size-4" /> Back</button>
          <button type="button" disabled={!complete || isChecking} onClick={continueToAddOns} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">{isChecking ? "Checking requirements…" : "Continue to Add-ons"}<ArrowRight className="size-4" /></button>
        </div>
      </section>
    </BookingJourneyShell>
  );
}
