"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { EventReport, reportingService, SessionSalesReport, TicketTypeSalesReport } from "@/services/reporting.service";
import { Session, sessionService } from "@/services/session.service";

const money = new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" });
type ReportView = "OVERVIEW" | "TICKET_TYPES" | "SESSIONS";

export function EventReportsWorkspace({ eventId }: { eventId: string }) {
  const [report, setReport] = useState<EventReport | null>(null);
  const [ticketTypeReport, setTicketTypeReport] = useState<TicketTypeSalesReport | null>(null);
  const [sessionReport, setSessionReport] = useState<SessionSalesReport | null>(null);
  const [reportView, setReportView] = useState<ReportView>("OVERVIEW");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [date, setDate] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  function load(filters: { date?: string; sessionId?: string } = {}, view = reportView) {
    setIsLoading(true);
    setError("");
    const request = view === "TICKET_TYPES"
      ? reportingService.getTicketTypeSales(eventId, filters).then(setTicketTypeReport)
      : view === "SESSIONS"
        ? reportingService.getSessionSales(eventId, filters).then(setSessionReport)
        : reportingService.getEventReport(eventId, filters).then(setReport);
    request
      .catch((requestError: unknown) => setError(requestError instanceof Error ? requestError.message : "Unable to load this Event report."))
      .finally(() => setIsLoading(false));
  }

  function changeReportView(nextView: ReportView) {
    setReportView(nextView);
    load({ date: date || undefined, sessionId: sessionId || undefined }, nextView);
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
        <form onSubmit={applyFilters} className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-[1.5fr_1fr_2fr_auto_auto] xl:items-end">
          <label className="text-sm font-medium">Report<select aria-label="Report" value={reportView} onChange={(event) => changeReportView(event.target.value as ReportView)} className="mt-2 h-10 w-full rounded-lg border bg-background px-3 font-normal"><option value="OVERVIEW">Event overview</option><option value="TICKET_TYPES">Sales by Ticket Type</option><option value="SESSIONS">Sales by Session</option></select></label>
          <label className="text-sm font-medium">Event-local date<input aria-label="Event-local date" type="date" value={date} onChange={(event) => setDate(event.target.value)} className="mt-2 h-10 w-full rounded-lg border bg-background px-3 font-normal" /></label>
          <label className="text-sm font-medium">Session<select aria-label="Session" value={sessionId} onChange={(event) => setSessionId(event.target.value)} className="mt-2 h-10 w-full rounded-lg border bg-background px-3 font-normal"><option value="">All Sessions</option>{sessions.map((session) => <option key={session.id} value={session.id}>{session.name} — {localDateTime(session.startDate, report?.event.timezone)}</option>)}</select></label>
          <Button type="submit">Apply filters</Button>
          <Button type="button" variant="outline" onClick={clearFilters}>Clear</Button>
        </form>
        {reportView === "OVERVIEW" && report ? <p className="mt-4 text-xs text-muted-foreground">Effective window: {localDateTime(report.filter.startsAt, report.event.timezone)} to {localDateTime(report.filter.endsAt, report.event.timezone)} ({report.event.timezone})</p> : null}
        {reportView !== "OVERVIEW" ? <p className="mt-4 text-xs text-muted-foreground">Reporting scope: {date || "Full Event"}{sessionId ? " · selected Session" : " · all Sessions"} ({report?.event.timezone ?? "Australia/Melbourne"})</p> : null}
      </section>

      {isLoading ? <StateCard>Loading report...</StateCard> : null}
      {error ? <StateCard error>{error}</StateCard> : null}
      {reportView === "OVERVIEW" && report && !isLoading ? <>
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

      {reportView === "TICKET_TYPES" && ticketTypeReport && !isLoading ? <>
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Ticket units sold" value={ticketTypeReport.totals.unitsSold} />
          <Metric label="Gross Ticket sales" value={money.format(ticketTypeReport.totals.grossItemSales)} />
          <Metric label="Tickets issued" value={ticketTypeReport.totals.ticketsIssued} />
          <Metric label="Admissions" value={ticketTypeReport.totals.admissions} />
        </section>
        <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="p-6"><h3 className="text-lg font-semibold">Sales by Ticket Type</h3><p className="mt-1 text-sm text-muted-foreground">Compare demand, gross item sales and attendance across Ticket Types.</p></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[980px] text-left text-sm"><thead className="border-y bg-muted/40 text-muted-foreground"><tr><Th>Ticket Type</Th><Th>Status</Th><Th>Units sold</Th><Th>Gross Ticket sales</Th><Th>Unit share</Th><Th>Tickets issued</Th><Th>Admissions</Th></tr></thead><tbody>{ticketTypeReport.rows.map((row) => <tr key={row.id} className="border-b last:border-0"><td className="px-5 py-4 font-medium">{row.name}</td><Td>{row.active ? "Active" : "Inactive"}</Td><Td>{row.unitsSold}</Td><Td>{money.format(row.grossItemSales)}</Td><Td>{row.unitSharePercent}%</Td><Td>{row.ticketsIssued}</Td><Td>{row.admissions}</Td></tr>)}</tbody></table></div>
          {ticketTypeReport.rows.length === 0 ? <p className="p-6 text-sm text-muted-foreground">No Ticket Type sales match the selected filters.</p> : null}
        </section>
        <p className="text-xs text-muted-foreground">Successful refunds are reported at Event and Session level. They are not allocated to, or subtracted from, individual Ticket Type rows. These figures are operational reporting, not accounting records.</p>
      </> : null}

      {reportView === "SESSIONS" && sessionReport && !isLoading ? <>
        <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="p-6"><h3 className="text-lg font-semibold">Sales by Session</h3><p className="mt-1 text-sm text-muted-foreground">Commercial performance, attendance and shared venue capacity in one operational view.</p></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[1500px] text-left text-sm"><thead className="border-y bg-muted/40 text-muted-foreground"><tr><Th>Session</Th><Th>Confirmed bookings</Th><Th>Booking value</Th><Th>Gross collected</Th><Th>Refunded</Th><Th>Net collected</Th><Th>Ticket units</Th><Th>Issued</Th><Th>Admissions</Th><Th>Capacity</Th><Th>Reserved</Th><Th>Remaining</Th><Th>Utilisation</Th></tr></thead><tbody>{sessionReport.rows.map((row) => <tr key={row.id} className="border-b last:border-0"><td className="px-5 py-4"><p className="font-medium">{row.name}</p><p className="mt-1 text-xs text-muted-foreground">{localDateTime(row.startDate, sessionReport.event.timezone)} · {row.status}</p></td><Td>{row.confirmedBookings}</Td><Td>{money.format(row.confirmedBookingValue)}</Td><Td>{money.format(row.grossCollected)}</Td><Td>{money.format(row.refunded)}</Td><Td>{money.format(row.netCollected)}</Td><Td>{row.ticketUnits}</Td><Td>{row.ticketsIssued}</Td><Td>{row.admissions}</Td><Td>{row.capacity}</Td><Td>{row.reservedAttendance}</Td><Td>{row.remainingCapacity}</Td><Td>{row.utilisationPercent}%</Td></tr>)}</tbody></table></div>
          {sessionReport.rows.length === 0 ? <p className="p-6 text-sm text-muted-foreground">No Sessions match the selected filters.</p> : null}
        </section>
        <p className="text-xs text-muted-foreground">Session capacity is shared across Ticket Types. These figures are operational Payment reporting and are not accounting, settlement, payout or tax records.</p>
      </> : null}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) { return <div className="rounded-xl border bg-card p-5 shadow-sm"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></div>; }
function StateCard({ children, error = false }: { children: React.ReactNode; error?: boolean }) { return <div className={`rounded-xl border bg-card p-6 ${error ? "border-destructive/30 text-destructive" : ""}`}>{children}</div>; }
function Th({ children }: { children: React.ReactNode }) { return <th className="px-5 py-3 font-medium">{children}</th>; }
function Td({ children }: { children: React.ReactNode }) { return <td className="px-5 py-4">{children}</td>; }
function localDateTime(value: string, timezone = "Australia/Melbourne") { return new Intl.DateTimeFormat("en-AU", { timeZone: timezone, dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }
