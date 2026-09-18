"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import type { EventGroup } from "@/services/event-group.service";
import type { GlacierEvent } from "@/services/event.service";
import {
  DateSalesReport,
  EventReport,
  PortfolioReport,
  ProductSalesReport,
  reportingService,
  SalesPaceReport,
  SessionSalesReport,
  TicketTypeSalesReport,
} from "@/services/reporting.service";

export type PortfolioReportView =
  | "OVERVIEW"
  | "TICKET_TYPES"
  | "SESSIONS"
  | "PRODUCTS"
  | "DATES"
  | "SALES_PACE";

const money = new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" });
const reportPaths: Record<PortfolioReportView, string> = {
  OVERVIEW: "overview",
  TICKET_TYPES: "ticket-types",
  SESSIONS: "sessions",
  PRODUCTS: "products",
  DATES: "dates",
  SALES_PACE: "sales-pace",
};

export function parsePortfolioReportView(value: string | null): PortfolioReportView | null {
  return value && value in reportPaths ? value as PortfolioReportView : null;
}

export function PortfolioReportsWorkspace({
  events,
  groups,
  initialView,
  initialScope = "ALL",
}: {
  events: GlacierEvent[];
  groups: EventGroup[];
  initialView: PortfolioReportView;
  initialScope?: string;
}) {
  const [view, setView] = useState(initialView);
  const [scopeValue, setScopeValue] = useState(initialScope);
  const [date, setDate] = useState("");
  const [report, setReport] = useState<PortfolioReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const authorisedEventIds = new Set(events.map(({ id }) => id));
  const accessibleGroups = groups.filter(
    (group) =>
      group.status === "ACTIVE" &&
      group.events.every(({ event }) => authorisedEventIds.has(event.id)),
  );

  function scopeParts(value = scopeValue) {
    if (value.startsWith("GROUP:")) return { scope: "GROUP" as const, id: value.slice(6) };
    if (value.startsWith("EVENT:")) return { scope: "EVENT" as const, id: value.slice(6) };
    return { scope: "ALL" as const, id: undefined };
  }

  function load(nextView = view, nextScope = scopeValue, nextDate = date) {
    const scope = scopeParts(nextScope);
    setIsLoading(true);
    setError("");
    reportingService.getPortfolioReport(reportPaths[nextView], scope.scope, scope.id, nextDate || undefined)
      .then(setReport)
      .catch((requestError: unknown) => setError(requestError instanceof Error ? requestError.message : "Unable to load this organisational report."))
      .finally(() => setIsLoading(false));
  }

  useEffect(() => { load(initialView, initialScope, ""); }, [initialView, initialScope]); // eslint-disable-line react-hooks/exhaustive-deps

  function changeView(next: PortfolioReportView) { setView(next); load(next); }
  function changeScope(next: string) { setScopeValue(next); load(view, next); }

  return <section className="space-y-6" aria-labelledby="organisational-report-heading">
    <div className="rounded-xl border bg-card p-6 shadow-sm print:border-0 print:p-0 print:shadow-none">
      <p className="text-sm font-semibold text-primary">Organisational reporting workspace</p>
      <h2 id="organisational-report-heading" className="mt-1 text-2xl font-semibold">{reportLabel(view)}</h2>
      <p className="mt-2 text-sm text-muted-foreground">Compare authorised Events without leaving Reports. Each Event retains its own timezone and authoritative records.</p>
      <div className="mt-5 grid gap-4 md:grid-cols-3 print:hidden">
        <label className="text-sm font-medium">Report<select aria-label="Organisational report" value={view} onChange={(event) => changeView(event.target.value as PortfolioReportView)} className="mt-2 h-11 w-full rounded-lg border bg-background px-3 font-normal"><option value="OVERVIEW">Sales Summary</option><option value="TICKET_TYPES">Sales by Ticket Type</option><option value="SESSIONS">Sales by Session</option><option value="DATES">Sales by Event Date</option><option value="PRODUCTS">Product and Add-on Performance</option><option value="SALES_PACE">Booking Pace</option></select></label>
        <label className="text-sm font-medium">Reporting scope<select aria-label="Reporting scope" value={scopeValue} onChange={(event) => changeScope(event.target.value)} className="mt-2 h-11 w-full rounded-lg border bg-background px-3 font-normal"><option value="ALL">All authorised Events</option>{accessibleGroups.map((group) => <option key={group.id} value={`GROUP:${group.id}`}>Group — {group.name}</option>)}{events.map((event) => <option key={event.id} value={`EVENT:${event.id}`}>Event — {event.name}</option>)}</select></label>
        <label className="text-sm font-medium">Event-local date<input aria-label="Portfolio Event-local date" type="date" value={date} onChange={(event) => setDate(event.target.value)} className="mt-2 h-11 w-full rounded-lg border bg-background px-3 font-normal" /></label>
      </div>
      <div className="mt-4 flex gap-3 print:hidden"><Button onClick={() => load()}>Apply date</Button><Button variant="outline" onClick={() => { setDate(""); load(view, scopeValue, ""); }}>Clear date</Button><Button variant="outline" onClick={() => window.print()}>Print / Save PDF</Button></div>
      {report ? <p className="mt-4 text-xs text-muted-foreground">Scope: {report.scope.name} · {report.reports.length} Event{report.reports.length === 1 ? "" : "s"}{report.filter.date ? ` · ${report.filter.date} in each Event timezone` : ""}</p> : null}
    </div>
    {isLoading ? <StateCard>Loading organisational report...</StateCard> : null}
    {error ? <StateCard error>{error}</StateCard> : null}
    {!isLoading && report ? <PortfolioTable report={report} view={view} /> : null}
  </section>;
}

function PortfolioTable({ report, view }: { report: PortfolioReport; view: PortfolioReportView }) {
  if (report.reports.length === 0) return <StateCard>No Events match this reporting scope.</StateCard>;
  if (view === "OVERVIEW") return <OverviewTable report={report} />;
  if (view === "TICKET_TYPES") return <Table headings={["Event", "Ticket Type", "Units", "Gross sales", "Refunds allocated", "Net Ticket sales", "Admissions"]}>{report.reports.flatMap(({ event, report: data }) => (data as TicketTypeSalesReport).rows.map((row) => <tr key={`${event.id}:${row.id}`} className="border-b last:border-0"><EventCell event={event} /><Td>{row.name}</Td><Td>{row.unitsSold}</Td><Td>{money.format(row.grossItemSales)}</Td><Td>{money.format(row.allocatedTicketRefunds)}</Td><Td>{money.format(row.netTicketSales)}</Td><Td>{row.admissions}</Td></tr>))}</Table>;
  if (view === "SESSIONS") return <Table headings={["Event", "Session", "Start", "Tickets", "Net collected", "Capacity used", "Remaining", "Admissions"]}>{report.reports.flatMap(({ event, report: data }) => (data as SessionSalesReport).rows.map((row) => <tr key={`${event.id}:${row.id}`} className="border-b last:border-0"><EventCell event={event} /><Td>{row.name}</Td><Td>{localDateTime(row.startDate, event.timezone)}</Td><Td>{row.ticketUnits}</Td><Td>{money.format(row.netCollected)}</Td><Td>{row.utilisationPercent}%</Td><Td>{row.remainingCapacity}</Td><Td>{row.admissions}</Td></tr>))}</Table>;
  if (view === "PRODUCTS") return <Table headings={["Event", "Product", "Units", "Gross sales", "Bookings", "Attach rate", "Inventory remaining"]}>{report.reports.flatMap(({ event, report: data }) => (data as ProductSalesReport).rows.map((row) => <tr key={`${event.id}:${row.id}`} className="border-b last:border-0"><EventCell event={event} /><Td>{row.name}</Td><Td>{row.unitsSold}</Td><Td>{money.format(row.grossItemSales)}</Td><Td>{row.bookingCount}</Td><Td>{row.attachRatePercent}%</Td><Td>{row.inventory.remaining ?? "Not tracked"}</Td></tr>))}</Table>;
  if (view === "DATES") return <Table headings={["Event", "Event-local date", "Sessions", "Tickets", "Net collected", "Capacity used", "Admissions"]}>{report.reports.flatMap(({ event, report: data }) => (data as DateSalesReport).rows.map((row) => <tr key={`${event.id}:${row.date}`} className="border-b last:border-0"><EventCell event={event} /><Td>{row.date}</Td><Td>{row.sessionCount}</Td><Td>{row.ticketUnits}</Td><Td>{money.format(row.netCollected)}</Td><Td>{row.utilisationPercent}%</Td><Td>{row.admissions}</Td></tr>))}</Table>;
  return <Table headings={["Event", "Lead time", "Bookings", "Tickets", "Gross Booking value", "Cumulative bookings"]}>{report.reports.flatMap(({ event, report: data }) => (data as SalesPaceReport).rows.map((row) => <tr key={`${event.id}:${row.key}`} className="border-b last:border-0"><EventCell event={event} /><Td>{row.label}</Td><Td>{row.confirmedBookings}</Td><Td>{row.ticketUnits}</Td><Td>{money.format(row.grossBookingValue)}</Td><Td>{row.cumulativeBookings}</Td></tr>))}</Table>;
}

function OverviewTable({ report }: { report: PortfolioReport }) { const rows = report.reports.map(({ event, report: data }) => ({ event, data: data as EventReport })); const totals = rows.reduce((value, row) => ({ gross: value.gross + row.data.commercial.grossCollected, refunded: value.refunded + row.data.commercial.refunded, net: value.net + row.data.commercial.netCollected, tickets: value.tickets + row.data.tickets.issued, admissions: value.admissions + row.data.tickets.admissions }), { gross: 0, refunded: 0, net: 0, tickets: 0, admissions: 0 }); return <><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"><Metric label="Gross collected" value={money.format(totals.gross)} /><Metric label="Refunded" value={money.format(totals.refunded)} /><Metric label="Net collected" value={money.format(totals.net)} /><Metric label="Tickets issued" value={totals.tickets} /><Metric label="Admissions" value={totals.admissions} /></div><Table headings={["Event", "Bookings", "Gross", "Refunded", "Net", "Tickets", "Admissions", "Attendance"]}>{rows.map(({ event, data }) => <tr key={event.id} className="border-b last:border-0"><EventCell event={event} /><Td>{data.commercial.confirmedBookings}</Td><Td>{money.format(data.commercial.grossCollected)}</Td><Td>{money.format(data.commercial.refunded)}</Td><Td>{money.format(data.commercial.netCollected)}</Td><Td>{data.tickets.issued}</Td><Td>{data.tickets.admissions}</Td><Td>{data.tickets.attendanceRate}%</Td></tr>)}</Table><p className="text-xs text-muted-foreground">Operational collection data only; not processor settlement, payout, accounting, profit or tax records.</p></>; }
function Table({ headings, children }: { headings: string[]; children: React.ReactNode }) { return <div className="overflow-x-auto rounded-xl border bg-card shadow-sm"><table className="w-full min-w-[900px] text-left text-sm"><thead className="border-b bg-muted/40 text-muted-foreground"><tr>{headings.map((heading) => <th key={heading} className="px-5 py-3 font-medium">{heading}</th>)}</tr></thead><tbody>{children}</tbody></table></div>; }
function EventCell({ event }: { event: { name: string; timezone: string } }) { return <td className="px-5 py-4"><p className="font-medium">{event.name}</p><p className="mt-1 text-xs text-muted-foreground">{event.timezone}</p></td>; }
function Td({ children }: { children: React.ReactNode }) { return <td className="px-5 py-4">{children}</td>; }
function Metric({ label, value }: { label: string; value: string | number }) { return <div className="rounded-xl border bg-card p-5 shadow-sm"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></div>; }
function StateCard({ children, error = false }: { children: React.ReactNode; error?: boolean }) { return <div className={`rounded-xl border bg-card p-6 ${error ? "border-destructive/30 text-destructive" : ""}`}>{children}</div>; }
function localDateTime(value: string, timezone: string) { return new Intl.DateTimeFormat("en-AU", { timeZone: timezone, dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }
function reportLabel(view: PortfolioReportView) { return { OVERVIEW: "Sales Summary", TICKET_TYPES: "Sales by Ticket Type", SESSIONS: "Sales by Session", PRODUCTS: "Product and Add-on Performance", DATES: "Sales by Event Date", SALES_PACE: "Booking Pace" }[view]; }
