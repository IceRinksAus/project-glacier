"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { createReportPdf, ReportPdfData } from "@/components/reporting/report-pdf";
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
  initialFrom = "",
  initialTo = "",
  initialStage = "SETUP",
}: {
  events: GlacierEvent[];
  groups: EventGroup[];
  initialView: PortfolioReportView;
  initialScope?: string;
  initialFrom?: string;
  initialTo?: string;
  initialStage?: "SETUP" | "RESULT";
}) {
  const [view, setView] = useState(initialView);
  const initialEventIds = selectionFromScope(initialScope, events, groups);
  const [selectedEventIds, setSelectedEventIds] = useState(initialEventIds);
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const [eventSearch, setEventSearch] = useState("");
  const [report, setReport] = useState<PortfolioReport | null>(null);
  const [stage, setStage] = useState<"SETUP" | "RESULT">(initialStage);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState("");
  const authorisedEventIds = new Set(events.map(({ id }) => id));
  const accessibleGroups = groups.filter(
    (group) =>
      group.status === "ACTIVE" &&
      group.events.every(({ event }) => authorisedEventIds.has(event.id)),
  );

  const visibleEvents = events.filter((event) => event.name.toLocaleLowerCase().includes(eventSearch.trim().toLocaleLowerCase()));

  function syncUrl(nextStage: "SETUP" | "RESULT", nextView = view, nextSelection = selectedEventIds, nextFrom = from, nextTo = to) {
    const query = new URLSearchParams();
    query.set("report", nextView);
    const allSelected = nextSelection.length === events.length && events.every(({ id }) => nextSelection.includes(id));
    query.set("scope", allSelected ? "ALL" : "SELECTED");
    if (!allSelected) query.set("eventIds", nextSelection.join(","));
    if (nextFrom) query.set("from", nextFrom);
    if (nextTo) query.set("to", nextTo);
    query.set("stage", nextStage.toLowerCase());
    window.history.replaceState(null, "", `/reports?${query.toString()}`);
  }

  function load(nextView = view, nextSelection = selectedEventIds, nextFrom = from, nextTo = to) {
    if (nextSelection.length === 0) { setReport(null); setError("Select at least one Event."); return; }
    if (!!nextFrom !== !!nextTo) { setReport(null); setError("Choose both a from and to date, or leave both blank."); return; }
    if (nextFrom && nextTo && nextFrom > nextTo) { setReport(null); setError("From date must be on or before to date."); return; }
    const allSelected = nextSelection.length === events.length && events.every(({ id }) => nextSelection.includes(id));
    setIsLoading(true);
    setStage("RESULT");
    syncUrl("RESULT", nextView, nextSelection, nextFrom, nextTo);
    setError("");
    reportingService.getPortfolioReport(reportPaths[nextView], allSelected ? "ALL" : "SELECTED", undefined, nextFrom || undefined, nextTo || undefined, allSelected ? undefined : nextSelection)
      .then(setReport)
      .catch((requestError: unknown) => setError(requestError instanceof Error ? requestError.message : "Unable to load this organisational report."))
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    setView(initialView);
    setSelectedEventIds(selectionFromScope(initialScope, events, groups));
    setFrom(initialFrom);
    setTo(initialTo);
    setEventSearch("");
    setReport(null);
    setError("");
    setStage(initialStage);
  }, [initialView, initialScope, initialFrom, initialTo, initialStage, events, groups]);

  useEffect(() => {
    if (initialStage === "RESULT") load(initialView, selectionFromScope(initialScope, events, groups), initialFrom, initialTo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialStage, initialView, initialScope, initialFrom, initialTo]);

  function changeView(next: PortfolioReportView) { setView(next); setReport(null); setError(""); syncUrl("SETUP", next); }
  function toggleEvent(eventId: string) { setSelectedEventIds((current) => current.includes(eventId) ? current.filter((id) => id !== eventId) : [...current, eventId]); }
  function choose(selection: string[]) { setSelectedEventIds(selection); }

  async function exportCsv() {
    const allSelected = selectedEventIds.length === events.length && events.every(({ id }) => selectedEventIds.includes(id));
    setIsExporting(true);
    setError("");
    try {
      const file = await reportingService.downloadPortfolioCsv(reportPaths[view], allSelected ? "ALL" : "SELECTED", from || undefined, to || undefined, allSelected ? undefined : selectedEventIds);
      downloadFile(file.blob, file.filename);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to export this organisational report.");
    } finally {
      setIsExporting(false);
    }
  }

  function exportPdf() {
    if (!report) { setError("Unable to prepare this report as a PDF."); return; }
    const blob = createReportPdf(portfolioPdfData(view, report));
    downloadFile(blob, pdfFilename(view, report));
  }

  if (stage === "RESULT") return <section className="space-y-6" aria-labelledby="organisational-report-heading">
    <div className="rounded-xl border bg-card p-6 shadow-sm print:border-0 print:p-0 print:shadow-none">
      <p className="text-sm font-semibold text-primary">Report result</p>
      <h2 id="organisational-report-heading" className="mt-1 text-2xl font-semibold">{reportLabel(view)}</h2>
      <p className="mt-2 text-sm text-muted-foreground">Authoritative operational results for the applied Event selection. Each Event retains its own timezone.</p>
      {report ? <p className="mt-4 text-xs text-muted-foreground">Scope: {report.scope.name} · {report.reports.length} Event{report.reports.length === 1 ? "" : "s"}{report.filter.from && report.filter.to ? ` · ${report.filter.from} to ${report.filter.to} in each Event timezone` : ""} · AUD · Generated {new Date(report.generatedAt).toLocaleString("en-AU")}</p> : null}
      <div className="mt-4 flex flex-wrap gap-3 print:hidden"><Button variant="outline" onClick={() => { setStage("SETUP"); syncUrl("SETUP"); }}>Change report settings</Button><Button variant="outline" onClick={exportCsv} disabled={!report || isExporting}>{isExporting ? "Preparing CSV..." : "Download CSV"}</Button><Button variant="outline" onClick={exportPdf} disabled={!report}>Download PDF</Button></div>
    </div>
    {isLoading ? <StateCard>Loading organisational report...</StateCard> : null}
    {error ? <StateCard error>{error}</StateCard> : null}
    {!isLoading && report ? <PortfolioTable report={report} view={view} /> : null}
  </section>;

  return <section className="space-y-6" aria-labelledby="organisational-report-heading">
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <p className="text-sm font-semibold text-primary">Report setup</p>
      <h2 id="organisational-report-heading" className="mt-1 text-2xl font-semibold">{reportLabel(view)}</h2>
      <p className="mt-2 text-sm text-muted-foreground">Choose the authorised Events and optional Event-local date range to include before generating the result.</p>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <label className="text-sm font-medium">Report<select aria-label="Organisational report" value={view} onChange={(event) => changeView(event.target.value as PortfolioReportView)} className="mt-2 h-11 w-full rounded-lg border bg-background px-3 font-normal"><option value="OVERVIEW">Sales Summary</option><option value="TICKET_TYPES">Sales by Ticket Type</option><option value="SESSIONS">Sales by Session</option><option value="DATES">Sales by Event Date</option><option value="PRODUCTS">Product and Add-on Performance</option><option value="SALES_PACE">Booking Pace</option></select></label>
        <label className="text-sm font-medium">From<input aria-label="Portfolio from date" type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="mt-2 h-11 w-full rounded-lg border bg-background px-3 font-normal" /></label>
        <label className="text-sm font-medium">To<input aria-label="Portfolio to date" type="date" value={to} onChange={(event) => setTo(event.target.value)} className="mt-2 h-11 w-full rounded-lg border bg-background px-3 font-normal" /></label>
      </div>
      <fieldset className="mt-5 rounded-lg border p-4"><legend className="px-1 text-sm font-medium">Reporting scope</legend><p className="text-xs text-muted-foreground">Select one or more Events to include. {selectedEventIds.length} selected.</p><div className="mt-3 flex flex-wrap gap-2"><Button type="button" size="sm" variant="outline" onClick={() => choose(events.map(({ id }) => id))}>All Events</Button><Button type="button" size="sm" variant="outline" onClick={() => choose([])}>Clear</Button>{accessibleGroups.map((group) => <Button key={group.id} type="button" size="sm" variant="outline" onClick={() => choose(group.events.map(({ event }) => event.id))}>{group.name}</Button>)}</div><label className="mt-4 block text-sm font-medium">Find an Event<input type="search" aria-label="Find an Event" value={eventSearch} onChange={(event) => setEventSearch(event.target.value)} placeholder="Search by Event name" className="mt-2 h-10 w-full rounded-lg border bg-background px-3 font-normal sm:max-w-md" /></label><div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{visibleEvents.map((event) => <label key={event.id} className="flex cursor-pointer items-start gap-3 rounded-lg border bg-background p-3 text-sm"><input type="checkbox" checked={selectedEventIds.includes(event.id)} onChange={() => toggleEvent(event.id)} className="mt-0.5 h-4 w-4" /><span><span className="font-medium">{event.name}</span><span className="block text-xs text-muted-foreground">{event.timezone}</span></span></label>)}</div>{visibleEvents.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">No authorised Events match that search.</p> : null}</fieldset>
      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
      <div className="mt-5 flex flex-wrap gap-3"><Button onClick={() => load()} disabled={selectedEventIds.length === 0}>Generate report</Button><Button variant="outline" onClick={() => { setFrom(""); setTo(""); }}>Clear dates</Button></div>
    </div>
  </section>;
}

function selectionFromScope(scope: string, events: GlacierEvent[], groups: EventGroup[]) {
  if (scope.startsWith("SELECTED:")) { const selected = new Set(scope.slice(9).split(",").filter(Boolean)); return events.filter(({ id }) => selected.has(id)).map(({ id }) => id); }
  if (scope.startsWith("EVENT:")) return events.filter(({ id }) => id === scope.slice(6)).map(({ id }) => id);
  if (scope.startsWith("GROUP:")) return groups.find(({ id }) => id === scope.slice(6))?.events.map(({ event }) => event.id).filter((id) => events.some((candidate) => candidate.id === id)) ?? [];
  return events.map(({ id }) => id);
}

function PortfolioTable({ report, view }: { report: PortfolioReport; view: PortfolioReportView }) {
  if (report.reports.length === 0) return <StateCard>No Events match this reporting scope.</StateCard>;
  if (view === "OVERVIEW") return <OverviewTable report={report} />;
  if (view === "TICKET_TYPES") return <TicketTypesTable report={report} />;
  if (view === "SESSIONS") return <SessionsTable report={report} />;
  if (view === "PRODUCTS") return <ProductsTable report={report} />;
  if (view === "DATES") return <DatesTable report={report} />;
  return <PaceTable report={report} />;
}

function OverviewTable({ report }: { report: PortfolioReport }) { const rows = report.reports.map(({ event, report: data }) => ({ event, data: data as EventReport })); const totals = rows.reduce((value, row) => ({ bookings: value.bookings + row.data.commercial.confirmedBookings, gross: value.gross + row.data.commercial.grossCollected, refunded: value.refunded + row.data.commercial.refunded, net: value.net + row.data.commercial.netCollected, tickets: value.tickets + row.data.tickets.issued, admissions: value.admissions + row.data.tickets.admissions }), { bookings: 0, gross: 0, refunded: 0, net: 0, tickets: 0, admissions: 0 }); return <ReportBody metrics={[{ label: "Gross collected", value: money.format(totals.gross) }, { label: "Refunded", value: money.format(totals.refunded) }, { label: "Net collected", value: money.format(totals.net) }, { label: "Confirmed bookings", value: totals.bookings }, { label: "Average booking", value: money.format(totals.bookings ? totals.gross / totals.bookings : 0) }]} definition="Successful operational collections less successful refunds. This is not processor settlement, payout, accounting, profit or tax evidence."><Table headings={["Event", "Bookings", "Gross", "Refunded", "Net", "Tickets", "Admissions", "Attendance"]}>{rows.map(({ event, data }) => <tr key={event.id} className="border-b last:border-0"><EventCell event={event} /><Td>{data.commercial.confirmedBookings}</Td><Td>{money.format(data.commercial.grossCollected)}</Td><Td>{money.format(data.commercial.refunded)}</Td><Td>{money.format(data.commercial.netCollected)}</Td><Td>{data.tickets.issued}</Td><Td>{data.tickets.admissions}</Td><Td>{data.tickets.attendanceRate}%</Td></tr>)}</Table></ReportBody>; }

function TicketTypesTable({ report }: { report: PortfolioReport }) { const reports = report.reports.map(({ event, report: data }) => ({ event, data: data as TicketTypeSalesReport })); const rows = reports.flatMap(({ data }) => data.rows); if (!rows.length) return <NoData />; const totals = reports.reduce((total, { data }) => ({ units: total.units + data.totals.unitsSold, gross: total.gross + data.totals.grossItemSales, refunds: total.refunds + data.totals.allocatedTicketRefunds, net: total.net + data.totals.netTicketSales, admissions: total.admissions + data.totals.admissions }), { units: 0, gross: 0, refunds: 0, net: 0, admissions: 0 }); return <ReportBody metrics={[{ label: "Ticket units", value: totals.units }, { label: "Gross Ticket sales", value: money.format(totals.gross) }, { label: "Allocated refunds", value: money.format(totals.refunds) }, { label: "Net Ticket sales", value: money.format(totals.net) }, { label: "Admissions", value: totals.admissions }]} definition="Ticket-level net sales include only refunds Glacier can allocate authoritatively to Ticket items; Event-level unallocated refunds remain in Sales Summary."><Table headings={["Event", "Ticket Type", "Units", "Gross sales", "Refunds allocated", "Net Ticket sales", "Admissions"]}>{reports.flatMap(({ event, data }) => data.rows.map((row) => <tr key={`${event.id}:${row.id}`} className="border-b last:border-0"><EventCell event={event} /><Td>{row.name}</Td><Td>{row.unitsSold}</Td><Td>{money.format(row.grossItemSales)}</Td><Td>{money.format(row.allocatedTicketRefunds)}</Td><Td>{money.format(row.netTicketSales)}</Td><Td>{row.admissions}</Td></tr>))}</Table></ReportBody>; }

function SessionsTable({ report }: { report: PortfolioReport }) { const reports = report.reports.map(({ event, report: data }) => ({ event, data: data as SessionSalesReport })); const rows = reports.flatMap(({ data }) => data.rows); if (!rows.length) return <NoData />; const totals = rows.reduce((total, row) => ({ tickets: total.tickets + row.ticketUnits, net: total.net + row.netCollected, reserved: total.reserved + row.reservedAttendance, capacity: total.capacity + row.capacity, remaining: total.remaining + row.remainingCapacity, admissions: total.admissions + row.admissions }), { tickets: 0, net: 0, reserved: 0, capacity: 0, remaining: 0, admissions: 0 }); return <ReportBody metrics={[{ label: "Ticket units", value: totals.tickets }, { label: "Net collected", value: money.format(totals.net) }, { label: "Capacity utilised", value: `${percent(totals.reserved, totals.capacity)}%` }, { label: "Places remaining", value: totals.remaining }, { label: "Admissions", value: totals.admissions }]} definition="Capacity utilisation is reserved attendance divided by configured Session capacity. Remaining places never drops below zero."><Table headings={["Event", "Session", "Start", "Tickets", "Net collected", "Capacity used", "Remaining", "Admissions"]}>{reports.flatMap(({ event, data }) => data.rows.map((row) => <tr key={`${event.id}:${row.id}`} className="border-b last:border-0"><EventCell event={event} /><Td>{row.name}</Td><Td>{localDateTime(row.startDate, event.timezone)}</Td><Td>{row.ticketUnits}</Td><Td>{money.format(row.netCollected)}</Td><Td>{row.utilisationPercent}%</Td><Td>{row.remainingCapacity}</Td><Td>{row.admissions}</Td></tr>))}</Table></ReportBody>; }

function ProductsTable({ report }: { report: PortfolioReport }) { const reports = report.reports.map(({ event, report: data }) => ({ event, data: data as ProductSalesReport })); const rows = reports.flatMap(({ data }) => data.rows); if (!rows.length) return <NoData />; const totals = reports.reduce((total, { data }) => ({ bookings: total.bookings + data.totals.confirmedBookings, attached: total.attached + data.totals.bookingsWithProducts, units: total.units + data.totals.unitsSold, gross: total.gross + data.totals.grossItemSales }), { bookings: 0, attached: 0, units: 0, gross: 0 }); const tracked = rows.filter(({ inventory }) => inventory.tracked); return <ReportBody metrics={[{ label: "Product units", value: totals.units }, { label: "Gross Product sales", value: money.format(totals.gross) }, { label: "Bookings with Products", value: totals.attached }, { label: "Portfolio attach rate", value: `${percent(totals.attached, totals.bookings)}%` }, { label: "Inventory tracked", value: `${tracked.length} of ${rows.length}` }]} definition="Attach rate is confirmed Bookings containing at least one Product. ‘Not tracked’ is distinct from zero remaining inventory; reusable capacity is governed per Session."><Table headings={["Event", "Product", "Units", "Gross sales", "Bookings", "Attach rate", "Inventory remaining"]}>{reports.flatMap(({ event, data }) => data.rows.map((row) => <tr key={`${event.id}:${row.id}`} className="border-b last:border-0"><EventCell event={event} /><Td>{row.name}</Td><Td>{row.unitsSold}</Td><Td>{money.format(row.grossItemSales)}</Td><Td>{row.bookingCount}</Td><Td>{row.attachRatePercent}%</Td><Td>{row.inventory.remaining ?? "Not tracked"}</Td></tr>))}</Table></ReportBody>; }

function DatesTable({ report }: { report: PortfolioReport }) { const reports = report.reports.map(({ event, report: data }) => ({ event, data: data as DateSalesReport })); const rows = reports.flatMap(({ data }) => data.rows); if (!rows.length) return <NoData />; const totals = rows.reduce((total, row) => ({ sessions: total.sessions + row.sessionCount, tickets: total.tickets + row.ticketUnits, net: total.net + row.netCollected, reserved: total.reserved + row.reservedAttendance, capacity: total.capacity + row.capacity, admissions: total.admissions + row.admissions }), { sessions: 0, tickets: 0, net: 0, reserved: 0, capacity: 0, admissions: 0 }); return <ReportBody metrics={[{ label: "Operating dates", value: rows.length }, { label: "Sessions", value: totals.sessions }, { label: "Ticket units", value: totals.tickets }, { label: "Net collected", value: money.format(totals.net) }, { label: "Capacity utilised", value: `${percent(totals.reserved, totals.capacity)}%` }]} definition="Rows use each Event’s local operating date. Cross-Event ranges are not reinterpreted as one UTC calendar day."><Table headings={["Event", "Event-local date", "Sessions", "Tickets", "Net collected", "Capacity used", "Admissions"]}>{reports.flatMap(({ event, data }) => data.rows.map((row) => <tr key={`${event.id}:${row.date}`} className="border-b last:border-0"><EventCell event={event} /><Td>{row.date}</Td><Td>{row.sessionCount}</Td><Td>{row.ticketUnits}</Td><Td>{money.format(row.netCollected)}</Td><Td>{row.utilisationPercent}%</Td><Td>{row.admissions}</Td></tr>))}</Table></ReportBody>; }

function PaceTable({ report }: { report: PortfolioReport }) { const reports = report.reports.map(({ event, report: data }) => ({ event, data: data as SalesPaceReport })); const rows = reports.flatMap(({ data }) => data.rows); if (!rows.length) return <NoData />; const totals = reports.reduce((total, { data }) => ({ bookings: total.bookings + data.totals.confirmedBookings, tickets: total.tickets + data.totals.ticketUnits, gross: total.gross + data.totals.grossBookingValue }), { bookings: 0, tickets: 0, gross: 0 }); return <ReportBody metrics={[{ label: "Confirmed bookings", value: totals.bookings }, { label: "Ticket units", value: totals.tickets }, { label: "Gross Booking value", value: money.format(totals.gross) }, { label: "Average tickets / Booking", value: totals.bookings ? (totals.tickets / totals.bookings).toFixed(1) : "0.0" }]} definition="Booking Pace groups confirmed demand by recorded lead time. It is historical operational evidence, not a conversion funnel or revenue forecast."><Table headings={["Event", "Lead time", "Bookings", "Tickets", "Gross Booking value", "Cumulative bookings"]}>{reports.flatMap(({ event, data }) => data.rows.map((row) => <tr key={`${event.id}:${row.key}`} className="border-b last:border-0"><EventCell event={event} /><Td>{row.label}</Td><Td>{row.confirmedBookings}</Td><Td>{row.ticketUnits}</Td><Td>{money.format(row.grossBookingValue)}</Td><Td>{row.cumulativeBookings}</Td></tr>))}</Table></ReportBody>; }

function ReportBody({ metrics, definition, children }: { metrics: Array<{ label: string; value: string | number }>; definition: string; children: React.ReactNode }) { return <div className="space-y-5"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{metrics.map((metric) => <Metric key={metric.label} {...metric} />)}</div>{children}<div className="rounded-lg border bg-muted/30 p-4 text-xs text-muted-foreground"><span className="font-semibold text-foreground">How to read this report: </span>{definition}</div></div>; }
function NoData() { return <StateCard>No report data matches the selected Events and date range. Try changing the report settings.</StateCard>; }
function percent(part: number, whole: number) { return whole > 0 ? Number(((part / whole) * 100).toFixed(1)) : 0; }
function Table({ headings, children }: { headings: string[]; children: React.ReactNode }) { return <div className="overflow-x-auto rounded-xl border bg-card shadow-sm"><table className="w-full min-w-[900px] text-left text-sm"><thead className="border-b bg-muted/40 text-muted-foreground"><tr>{headings.map((heading) => <th key={heading} className="px-5 py-3 font-medium">{heading}</th>)}</tr></thead><tbody>{children}</tbody></table></div>; }
function EventCell({ event }: { event: { name: string; timezone: string } }) { return <td className="px-5 py-4"><p className="font-medium">{event.name}</p><p className="mt-1 text-xs text-muted-foreground">{event.timezone}</p></td>; }
function Td({ children }: { children: React.ReactNode }) { return <td className="px-5 py-4">{children}</td>; }
function Metric({ label, value }: { label: string; value: string | number }) { return <div className="rounded-xl border bg-card p-5 shadow-sm"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></div>; }
function StateCard({ children, error = false }: { children: React.ReactNode; error?: boolean }) { return <div className={`rounded-xl border bg-card p-6 ${error ? "border-destructive/30 text-destructive" : ""}`}>{children}</div>; }
function localDateTime(value: string, timezone: string) { return new Intl.DateTimeFormat("en-AU", { timeZone: timezone, dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }
function reportLabel(view: PortfolioReportView) { return { OVERVIEW: "Sales Summary", TICKET_TYPES: "Sales by Ticket Type", SESSIONS: "Sales by Session", PRODUCTS: "Product and Add-on Performance", DATES: "Sales by Event Date", SALES_PACE: "Booking Pace" }[view]; }
function portfolioPdfData(view: PortfolioReportView, report: PortfolioReport): ReportPdfData {
  const base = {
    title: reportLabel(view),
    scope: `${report.scope.name} (${report.reports.length} Event${report.reports.length === 1 ? "" : "s"})`,
    period: report.filter.from && report.filter.to ? `${report.filter.from} to ${report.filter.to} in each Event timezone` : "All available dates in each Event timezone",
    generatedAt: new Date(report.generatedAt).toLocaleString("en-AU"),
  };
  if (view === "OVERVIEW") {
    const rows = report.reports.map(({ event, report: value }) => ({ event, value: value as EventReport }));
    const totals = rows.reduce((total, row) => ({ bookings: total.bookings + row.value.commercial.confirmedBookings, gross: total.gross + row.value.commercial.grossCollected, refunded: total.refunded + row.value.commercial.refunded, net: total.net + row.value.commercial.netCollected, tickets: total.tickets + row.value.tickets.issued }), { bookings: 0, gross: 0, refunded: 0, net: 0, tickets: 0 });
    return { ...base, metrics: [{ label: "Gross collected", value: money.format(totals.gross) }, { label: "Refunded", value: money.format(totals.refunded) }, { label: "Net collected", value: money.format(totals.net) }, { label: "Confirmed bookings", value: String(totals.bookings) }, { label: "Average booking", value: money.format(totals.bookings ? totals.gross / totals.bookings : 0) }], columns: [{ label: "Event", width: 2.4 }, { label: "Bookings", width: 1, align: "right" }, { label: "Gross", width: 1.15, align: "right" }, { label: "Refunded", width: 1.15, align: "right" }, { label: "Net", width: 1.15, align: "right" }, { label: "Tickets", width: 0.9, align: "right" }, { label: "Admissions", width: 1, align: "right" }, { label: "Attendance", width: 1.1, align: "right" }], rows: rows.map(({ event, value }) => [event.name, String(value.commercial.confirmedBookings), money.format(value.commercial.grossCollected), money.format(value.commercial.refunded), money.format(value.commercial.netCollected), String(value.tickets.issued), String(value.tickets.admissions), `${value.tickets.attendanceRate}%`]), note: "Successful operational collections less successful refunds. This is not processor settlement, payout, accounting, profit or tax evidence." };
  }
  if (view === "TICKET_TYPES") {
    const reports = report.reports.map(({ event, report: value }) => ({ event, value: value as TicketTypeSalesReport }));
    const rows = reports.flatMap(({ event, value }) => value.rows.map((row) => ({ event, row })));
    const totals = reports.reduce((total, { value }) => ({ units: total.units + value.totals.unitsSold, gross: total.gross + value.totals.grossItemSales, refunds: total.refunds + value.totals.allocatedTicketRefunds, net: total.net + value.totals.netTicketSales, admissions: total.admissions + value.totals.admissions }), { units: 0, gross: 0, refunds: 0, net: 0, admissions: 0 });
    return { ...base, metrics: [{ label: "Ticket units", value: String(totals.units) }, { label: "Gross ticket sales", value: money.format(totals.gross) }, { label: "Allocated refunds", value: money.format(totals.refunds) }, { label: "Net ticket sales", value: money.format(totals.net) }, { label: "Admissions", value: String(totals.admissions) }], columns: [{ label: "Event", width: 2 }, { label: "Ticket type", width: 1.6 }, { label: "Units", width: 0.7, align: "right" }, { label: "Gross", width: 1, align: "right" }, { label: "Refunds", width: 1, align: "right" }, { label: "Net", width: 1, align: "right" }, { label: "Admissions", width: 0.9, align: "right" }], rows: rows.map(({ event, row }) => [event.name, row.name, String(row.unitsSold), money.format(row.grossItemSales), money.format(row.allocatedTicketRefunds), money.format(row.netTicketSales), String(row.admissions)]), note: "Ticket-level net sales include only refunds Glacier can allocate authoritatively to Ticket items; Event-level unallocated refunds remain in Sales Summary." };
  }
  if (view === "SESSIONS") {
    const rows = report.reports.flatMap(({ event, report: value }) => (value as SessionSalesReport).rows.map((row) => ({ event, row })));
    const totals = rows.reduce((total, { row }) => ({ tickets: total.tickets + row.ticketUnits, net: total.net + row.netCollected, reserved: total.reserved + row.reservedAttendance, capacity: total.capacity + row.capacity, remaining: total.remaining + row.remainingCapacity }), { tickets: 0, net: 0, reserved: 0, capacity: 0, remaining: 0 });
    return { ...base, metrics: [{ label: "Ticket units", value: String(totals.tickets) }, { label: "Net collected", value: money.format(totals.net) }, { label: "Capacity utilised", value: `${percent(totals.reserved, totals.capacity)}%` }, { label: "Places remaining", value: String(totals.remaining) }, { label: "Sessions", value: String(rows.length) }], columns: [{ label: "Event", width: 1.8 }, { label: "Session", width: 1.5 }, { label: "Start", width: 1.4 }, { label: "Tickets", width: 0.7, align: "right" }, { label: "Net", width: 1, align: "right" }, { label: "Capacity", width: 0.9, align: "right" }, { label: "Remaining", width: 0.9, align: "right" }], rows: rows.map(({ event, row }) => [event.name, row.name, localDateTime(row.startDate, event.timezone), String(row.ticketUnits), money.format(row.netCollected), `${row.utilisationPercent}%`, String(row.remainingCapacity)]), note: "Capacity utilisation is reserved attendance divided by configured Session capacity. Remaining places never drops below zero." };
  }
  if (view === "PRODUCTS") {
    const reports = report.reports.map(({ event, report: value }) => ({ event, value: value as ProductSalesReport }));
    const rows = reports.flatMap(({ event, value }) => value.rows.map((row) => ({ event, row })));
    const totals = reports.reduce((total, { value }) => ({ bookings: total.bookings + value.totals.confirmedBookings, attached: total.attached + value.totals.bookingsWithProducts, units: total.units + value.totals.unitsSold, gross: total.gross + value.totals.grossItemSales }), { bookings: 0, attached: 0, units: 0, gross: 0 });
    return { ...base, metrics: [{ label: "Product units", value: String(totals.units) }, { label: "Gross product sales", value: money.format(totals.gross) }, { label: "Bookings with products", value: String(totals.attached) }, { label: "Portfolio attach rate", value: `${percent(totals.attached, totals.bookings)}%` }, { label: "Products", value: String(rows.length) }], columns: [{ label: "Event", width: 1.8 }, { label: "Product", width: 1.7 }, { label: "Units", width: 0.7, align: "right" }, { label: "Gross", width: 1, align: "right" }, { label: "Bookings", width: 0.9, align: "right" }, { label: "Attach rate", width: 0.9, align: "right" }, { label: "Inventory", width: 1, align: "right" }], rows: rows.map(({ event, row }) => [event.name, row.name, String(row.unitsSold), money.format(row.grossItemSales), String(row.bookingCount), `${row.attachRatePercent}%`, row.inventory.remaining === null ? "Not tracked" : String(row.inventory.remaining)]), note: "Attach rate is confirmed Bookings containing at least one Product. Not tracked is distinct from zero remaining inventory; reusable capacity is governed per Session." };
  }
  if (view === "DATES") {
    const rows = report.reports.flatMap(({ event, report: value }) => (value as DateSalesReport).rows.map((row) => ({ event, row })));
    const totals = rows.reduce((total, { row }) => ({ sessions: total.sessions + row.sessionCount, tickets: total.tickets + row.ticketUnits, net: total.net + row.netCollected, reserved: total.reserved + row.reservedAttendance, capacity: total.capacity + row.capacity }), { sessions: 0, tickets: 0, net: 0, reserved: 0, capacity: 0 });
    return { ...base, metrics: [{ label: "Operating dates", value: String(rows.length) }, { label: "Sessions", value: String(totals.sessions) }, { label: "Ticket units", value: String(totals.tickets) }, { label: "Net collected", value: money.format(totals.net) }, { label: "Capacity utilised", value: `${percent(totals.reserved, totals.capacity)}%` }], columns: [{ label: "Event", width: 2 }, { label: "Event-local date", width: 1.4 }, { label: "Sessions", width: 0.8, align: "right" }, { label: "Tickets", width: 0.8, align: "right" }, { label: "Net", width: 1.1, align: "right" }, { label: "Capacity", width: 1, align: "right" }, { label: "Admissions", width: 0.9, align: "right" }], rows: rows.map(({ event, row }) => [event.name, row.date, String(row.sessionCount), String(row.ticketUnits), money.format(row.netCollected), `${row.utilisationPercent}%`, String(row.admissions)]), note: "Rows use each Event's local operating date. Cross-Event ranges are not reinterpreted as one UTC calendar day." };
  }
  const reports = report.reports.map(({ event, report: value }) => ({ event, value: value as SalesPaceReport }));
  const rows = reports.flatMap(({ event, value }) => value.rows.map((row) => ({ event, row })));
  const totals = reports.reduce((total, { value }) => ({ bookings: total.bookings + value.totals.confirmedBookings, tickets: total.tickets + value.totals.ticketUnits, gross: total.gross + value.totals.grossBookingValue }), { bookings: 0, tickets: 0, gross: 0 });
  return { ...base, metrics: [{ label: "Confirmed bookings", value: String(totals.bookings) }, { label: "Ticket units", value: String(totals.tickets) }, { label: "Gross booking value", value: money.format(totals.gross) }, { label: "Average tickets", value: totals.bookings ? (totals.tickets / totals.bookings).toFixed(1) : "0.0" }, { label: "Lead-time bands", value: String(rows.length) }], columns: [{ label: "Event", width: 2 }, { label: "Lead time", width: 1.4 }, { label: "Bookings", width: 0.9, align: "right" }, { label: "Tickets", width: 0.8, align: "right" }, { label: "Gross value", width: 1.1, align: "right" }, { label: "Cumulative", width: 1, align: "right" }], rows: rows.map(({ event, row }) => [event.name, row.label, String(row.confirmedBookings), String(row.ticketUnits), money.format(row.grossBookingValue), String(row.cumulativeBookings)]), note: "Booking Pace groups confirmed demand by recorded lead time. It is historical operational evidence, not a conversion funnel or revenue forecast." };
}
function pdfFilename(view: PortfolioReportView, report: PortfolioReport) { const reportName = reportLabel(view).toLocaleLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); const scopeName = report.scope.name.toLocaleLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); const range = report.filter.from && report.filter.to ? `${report.filter.from}-to-${report.filter.to}` : "all-dates"; const date = report.generatedAt.slice(0, 10); return `${scopeName}-${reportName}-${range}-${date}.pdf`; }
function downloadFile(blob: Blob, filename: string) { const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = filename; anchor.click(); URL.revokeObjectURL(url); }
