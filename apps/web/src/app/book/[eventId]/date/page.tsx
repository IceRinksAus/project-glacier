"use client";

import { ArrowRight, CalendarDays } from "lucide-react";
import { useRouter } from "next/navigation";
import { use, useEffect, useMemo, useState } from "react";

import { useBookingJourney } from "@/components/booking/BookingJourneyProvider";
import { BookingJourneyShell } from "@/components/booking/BookingJourneyShell";
import { formatEventDate, getEventDateKey } from "@/components/booking/event-date";
import {
  PublicEvent,
  PublicSession,
  publicBookingService,
} from "@/services/public-booking.service";

export default function DatePage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);
  const router = useRouter();
  const { selectedDateKey, selectDate } = useBookingJourney();
  const [event, setEvent] = useState<PublicEvent | null>(null);
  const [sessions, setSessions] = useState<PublicSession[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([
      publicBookingService.getEvent(eventId),
      publicBookingService.getSessions(eventId),
    ])
      .then(([eventResult, sessionResults]) => {
        if (!active) return;
        setEvent(eventResult);
        setSessions(sessionResults);
      })
      .catch(() => {
        if (active) setError("We couldn’t load the available Event dates.");
      });
    return () => {
      active = false;
    };
  }, [eventId]);

  const timeZone = event?.timezone ?? "Australia/Melbourne";
  const dates = useMemo(() => {
    const uniqueDates = new Map<string, string>();
    sessions.forEach((session) => {
      const key = getEventDateKey(session.startDate, timeZone);
      if (!uniqueDates.has(key)) uniqueDates.set(key, session.startDate);
    });
    return [...uniqueDates.entries()]
      .map(([key, firstSessionStart]) => ({
        key,
        label: formatEventDate(firstSessionStart, timeZone),
        sessionCount: sessions.filter(
          (session) => getEventDateKey(session.startDate, timeZone) === key,
        ).length,
      }))
      .sort((left, right) => left.key.localeCompare(right.key));
  }, [sessions, timeZone]);

  return (
    <BookingJourneyShell>
      <section className="mx-auto mt-5 max-w-3xl rounded-3xl border bg-white p-6 shadow-sm sm:p-9">
        <p className="text-sm font-semibold uppercase tracking-widest text-slate-500">Step 1 of 9</p>
        <h1 className="mt-3 text-3xl font-bold">Choose your date</h1>
        <p className="mt-2 text-slate-600">
          Start with the day you would like to attend. You’ll choose a Session next.
        </p>

        {error ? <p role="alert" className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p> : null}
        {!event && !error ? <p className="mt-8 text-sm text-slate-500">Loading Event dates…</p> : null}
        {event && dates.length === 0 ? <p className="mt-8 rounded-xl border border-dashed p-5 text-sm text-slate-600">There are currently no dates available for online booking.</p> : null}

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {dates.map((date) => {
            const selected = selectedDateKey === date.key;
            return (
              <button
                key={date.key}
                type="button"
                aria-pressed={selected}
                onClick={() => selectDate(date.key)}
                className={[
                  "rounded-2xl border-2 p-5 text-left transition",
                  selected ? "border-slate-950 bg-slate-50" : "border-slate-200 hover:border-slate-400",
                ].join(" ")}
              >
                <CalendarDays className="size-5" />
                <p className="mt-4 font-bold">{date.label}</p>
                <p className="mt-2 text-sm text-slate-600">
                  {date.sessionCount} {date.sessionCount === 1 ? "Session" : "Sessions"} available
                </p>
                <p className="mt-3 text-sm font-semibold">{selected ? "Selected" : "Choose date"}</p>
              </button>
            );
          })}
        </div>

        <div className="mt-8 flex justify-end">
          <button
            type="button"
            disabled={!selectedDateKey}
            onClick={() => router.push(`/book/${eventId}/session`)}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-6 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Continue to Sessions <ArrowRight className="size-4" />
          </button>
        </div>
      </section>
    </BookingJourneyShell>
  );
}
