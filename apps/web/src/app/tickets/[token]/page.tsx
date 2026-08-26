"use client";

import { CalendarDays, CheckCircle2, Clock } from "lucide-react";
import { use, useEffect, useState } from "react";

import {
  PublicTicketPresentation,
  publicBookingService,
} from "@/services/public-booking.service";

export default function PublicTicketPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const [ticket, setTicket] = useState<PublicTicketPresentation | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    publicBookingService
      .getTicket(token)
      .then((result) => {
        if (active) setTicket(result);
      })
      .catch(() => {
        if (active) setError("This Ticket is not available.");
      });
    return () => {
      active = false;
    };
  }, [token]);

  if (error)
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 p-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Ticket unavailable</h1>
          <p className="mt-3 text-slate-600">{error}</p>
        </div>
      </main>
    );
  if (!ticket)
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50">
        <p>Loading Ticket…</p>
      </main>
    );

  const session = ticket.booking.session;
  const wasReplaced = Boolean(ticket.originalRescheduleMapping);
  const participantName = [
    ticket.participant.firstName,
    ticket.participant.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <main className="min-h-screen bg-slate-100 px-5 py-10 text-slate-950">
      <article className="mx-auto max-w-lg overflow-hidden rounded-3xl border bg-white shadow-xl">
        <header className="bg-slate-950 p-7 text-white">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] opacity-70">
            Glacier Ticket
          </p>
          <h1 className="mt-3 text-3xl font-bold">
            {ticket.booking.event.name}
          </h1>
        </header>
        <div className="p-7">
          <div
            className={`flex items-center gap-2 font-semibold ${ticket.status === "ACTIVE" ? "text-emerald-700" : "text-red-700"}`}
          >
            <CheckCircle2 className="size-5" />
            {ticket.status === "ACTIVE"
              ? "Ready for entry"
              : wasReplaced
                ? "Replaced after Session change"
                : ticket.status}
          </div>
          {wasReplaced ? (
            <p className="mt-3 rounded-xl bg-red-50 p-4 text-sm font-medium text-red-900">
              This credential is no longer valid. Use replacement Ticket{" "}
              {ticket.originalRescheduleMapping
                ?.replacementTicketNumberSnapshot ??
                "issued for the new Session"}
              .
            </p>
          ) : null}
          <h2 className="mt-5 text-2xl font-bold">{participantName}</h2>
          {session ? (
            <div className="mt-5 grid gap-2 text-sm text-slate-600">
              <p className="font-semibold text-slate-950">{session.name}</p>
              <p className="flex items-center gap-2">
                <CalendarDays className="size-4" />
                {new Date(session.startDate).toLocaleDateString("en-AU", {
                  dateStyle: "full",
                })}
              </p>
              <p className="flex items-center gap-2">
                <Clock className="size-4" />
                {new Date(session.startDate).toLocaleTimeString("en-AU", {
                  hour: "numeric",
                  minute: "2-digit",
                })}{" "}
                –{" "}
                {new Date(session.endDate).toLocaleTimeString("en-AU", {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
            </div>
          ) : null}
          {ticket.status === "ACTIVE" ? (
            <>
              {/* The QR contains the same high-entropy possession token as this private Ticket URL. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={publicBookingService.ticketQrUrl(token)}
                alt={`Entry QR code for ${participantName}`}
                className="mx-auto mt-7 size-72 max-w-full"
              />
            </>
          ) : null}
          <p className="mt-5 text-center font-mono text-sm font-semibold">
            {ticket.ticketNumber}
          </p>
          {ticket.status === "ACTIVE" ? (
            <p className="mt-2 text-center text-xs text-slate-500">
              Present this QR code to Event staff. Keep this Ticket link
              private.
            </p>
          ) : null}
        </div>
      </article>
    </main>
  );
}
