"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { EventReport, reportingService } from "@/services/reporting.service";
import { Session, sessionService } from "@/services/session.service";

const money = new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" });

export function EventReportsWorkspace({ eventId }: { eventId: string }) {
  const [report, setReport] = useState<EventReport | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [date, setDate] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  function load(filters: { date?: string; sessionId?: string } = {}) {
    setIsLoading(true);
    setError("");
    reportingService.getEventReport(eventId, filters)
      .then(setReport)
      .catch((requestError: unknown) => setError(requestError instanceof Error ? requestError.message : "Unable to load this Event report."))
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    let cancelled = false;
    Promise.all([reportingService.getEventReport(eventId), sessionService.getSessions(eventId)])
      .then(([nextReport, nextSessions]) => {
        if (!cancelled) { setReport(nextReport); setSessions(nextSessions); setError(""); }
      })
      .catch((requestError: unknown) => {
        if (!cancelled) setError(requestError instanceof Error ? requestError.message : "Unable to load this Event report.");
      })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [eventId]);

  function applyFilters(event: FormEvent) {
    event.preventDefault();
    load({ date: date || undefined, sessionId: sessionId || undefined });
  }

  function clearFilters() {
    setDate("");
    setSessionId("");
    load();
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="text-2xl font-semibold tracking-tight">Event reports</h2>
        <p className="mt-1 text-sm text-muted-foreground">Authoritative operational performance from Bookings, Payments, refunds, Tickets and Sessions.</p>
        <form onSubmit={applyFilters} className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-[1fr_2fr_auto_auto] xl:items-end">
          <label className="text-sm font-medium">Event-local date<input aria-label="Event-local date" type="date" value={date} onChange={(event) => setDate(event.target.value)} className="mt-2 h-10 w-full rounded-lg border bg-background px-3 font-normal" /></label>
          <label className="text-sm font-medium">Session<select aria-label="Session" value={sessionId} onChange={(event) => setSessionId(event.target.value)} className="mt-2 h-10 w-full rounded-lg border bg-background px-3 font-normal"><option value="">All Sessions</option>{sessions.map((session) => <option key={session.id} value={session.id}>{session.name} — {localDateTime(session.startDate, report?.event.timezone)}</option>)}</select></label>
          <Button type="submit">Apply filters</Button>
          <Button type="button" variant="outline" onClick={clearFilters}>Clear</Button>
        </form>
        {report ? <p className="mt-4 text-xs text-muted-foreground">Effective window: {localDateTime(report.filter.startsAt, report.event.timezone)} to {localDateTime(report.filter.endsAt, report.event.timezone)} ({report.event.timezone})</p> : null}
      </section>

      {isLoading ? <StateCard>Loading report...</StateCard> : null}
      {error ? <StateCard error>{error}</StateCard> : null}
      {report && !isLoading ? <>
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Gross collected" value={money.format(report.commercial.grossCollected)} />
          <Metric label="Successful refunds" value={money.format(report.commercial.refunded)} />
          <Metric label="Net collected" value={money.format(report.commercial.netCollected)} />
          <Metric label="Confirmed bookings" value={report.commercial.confirmedBookings} />
          <Metric label="Average booking" value={money.format(report.commercial.averageBookingValue)} />
          <Metric label="Tickets issued" value={report.tickets.issued} />
          <Metric label="Admissions" value={report.tickets.admissions} />
          <Metric label="Attendance rate" value={`${report.tickets.attendanceRate}%`} />
        </section>

        <section className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
            <div><h3 className="text-lg font-semibold">Payment exceptions</h3><p className="mt-1 text-sm text-muted-foreground">Pending Payments or failed latest reconciliation attempts requiring investigation.</p></div>
            <span className="rounded-full border px-3 py-1 text-sm font-semibold">{report.payments.exceptionCount}</span>
          </div>
          <div className="mt-4 grid gap-2">
            {report.payments.exceptions.map((exception) => <Link key={exception.bookingId} href={`/bookings/${exception.bookingId}`} className="flex justify-between rounded-lg border p-3 text-sm hover:bg-muted/40"><span>{exception.bookingNumber}</span><span className="font-medium">Investigate →</span></Link>)}
            {report.payments.exceptionCount === 0 ? <p className="text-sm text-muted-foreground">No Payment exceptions in this reporting window.</p> : null}
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="p-6"><h3 className="text-lg font-semibold">Session utilisation</h3><p className="mt-1 text-sm text-muted-foreground">Admission capacity remains shared across Ticket Types and separate from Product inventory.</p></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[980px] text-left text-sm"><thead className="border-y bg-muted/40 text-muted-foreground"><tr><Th>Session</Th><Th>Capacity</Th><Th>Reserved</Th><Th>Confirmed</Th><Th>Remaining</Th><Th>Utilisation</Th><Th>Admitted</Th></tr></thead><tbody>{report.sessions.map((session) => <tr key={session.id} className="border-b last:border-0"><td className="px-5 py-4"><p className="font-medium">{session.name}</p><p className="mt-1 text-xs text-muted-foreground">{localDateTime(session.startDate, report.event.timezone)} · {session.status}</p></td><Td>{session.capacity}</Td><Td>{session.reservedAttendance}</Td><Td>{session.confirmedAttendance}</Td><Td>{session.remainingCapacity}</Td><Td>{session.utilisationPercent}%</Td><Td>{session.admissions}</Td></tr>)}</tbody></table></div>
          {report.sessions.length === 0 ? <p className="p-6 text-sm text-muted-foreground">No Sessions match the selected filters.</p> : null}
        </section>

        <p className="text-xs text-muted-foreground">These figures are operational Payment reporting and are not accounting, settlement, payout or tax records.</p>
      </> : null}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) { return <div className="rounded-xl border bg-card p-5 shadow-sm"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></div>; }
function StateCard({ children, error = false }: { children: React.ReactNode; error?: boolean }) { return <div className={`rounded-xl border bg-card p-6 ${error ? "border-destructive/30 text-destructive" : ""}`}>{children}</div>; }
function Th({ children }: { children: React.ReactNode }) { return <th className="px-5 py-3 font-medium">{children}</th>; }
function Td({ children }: { children: React.ReactNode }) { return <td className="px-5 py-4">{children}</td>; }
function localDateTime(value: string, timezone = "Australia/Melbourne") { return new Intl.DateTimeFormat("en-AU", { timeZone: timezone, dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }
