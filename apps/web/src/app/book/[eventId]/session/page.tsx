"use client";

import { ArrowRight, CalendarDays, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";

import { BookingJourneyShell } from "@/components/booking/BookingJourneyShell";
import { useBookingJourney } from "@/components/booking/BookingJourneyProvider";
import { PublicEvent, PublicSession, publicBookingService } from "@/services/public-booking.service";

export default function SessionPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);
  const router = useRouter();
  const { selectedSessionId, selectSession } = useBookingJourney();
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
        if (active) {
          setEvent(eventResult);
          setSessions(sessionResults);
        }
      })
      .catch(() => { if (active) setError("We couldn’t load the available Sessions."); });
    return () => { active = false; };
  }, [eventId]);

  const timezone = event?.timezone ?? "Australia/Melbourne";
  const formatDate = (value: string) => new Intl.DateTimeFormat("en-AU", {
    weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: timezone,
  }).format(new Date(value));
  const formatTime = (value: string) => new Intl.DateTimeFormat("en-AU", {
    hour: "numeric", minute: "2-digit", timeZone: timezone,
  }).format(new Date(value));

  return (
    <BookingJourneyShell>
      <section className="mx-auto mt-5 max-w-3xl rounded-3xl border bg-white p-6 shadow-sm sm:p-9">
        <p className="text-sm font-semibold uppercase tracking-widest text-slate-500">Step 1 of 7</p>
        <h1 className="mt-3 text-3xl font-bold">Choose your Session</h1>
        <p className="mt-2 text-slate-600">{event ? event.name : "Select the time you would like to attend."}</p>

        {error ? <p role="alert" className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p> : null}
        {!event && !error ? <p className="mt-8 text-sm text-slate-500">Loading Sessions…</p> : null}
        {event && sessions.length === 0 ? <p className="mt-8 rounded-xl border border-dashed p-5 text-sm text-slate-600">There are currently no Sessions available for online booking.</p> : null}

        <div className="mt-8 grid gap-3">
          {sessions.map((session) => {
            const selected = selectedSessionId === session.id;
            return (
              <button
                key={session.id}
                type="button"
                aria-pressed={selected}
                onClick={() => selectSession(session.id)}
                className={[
                  "rounded-2xl border-2 p-5 text-left transition",
                  selected ? "border-slate-950 bg-slate-50" : "border-slate-200 hover:border-slate-400",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-bold">{session.name}</p>
                    <p className="mt-2 flex items-center gap-2 text-sm text-slate-600"><CalendarDays className="size-4" />{formatDate(session.startDate)}</p>
                    <p className="mt-1 flex items-center gap-2 text-sm text-slate-600"><Clock className="size-4" />{formatTime(session.startDate)} – {formatTime(session.endDate)}</p>
                  </div>
                  <span className="text-sm font-semibold">{selected ? "Selected" : "Choose"}</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-8 flex justify-end">
          <button
            type="button"
            disabled={!selectedSessionId}
            onClick={() => router.push(`/book/${eventId}/tickets`)}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-6 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Continue to Tickets <ArrowRight className="size-4" />
          </button>
        </div>
      </section>
    </BookingJourneyShell>
  );
}
