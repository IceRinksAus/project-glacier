"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DateSalesReport,
  EventReport,
  ProductSalesReport,
  reportingService,
  SalesPaceReport,
  SessionSalesReport,
  TicketTypeSalesReport,
} from "@/services/reporting.service";
import { Session, sessionService } from "@/services/session.service";

const money = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
});
type ReportView =
  | "OVERVIEW"
  | "TICKET_TYPES"
  | "SESSIONS"
  | "PRODUCTS"
  | "DATES"
  | "SALES_PACE";

export function EventReportsWorkspace({ eventId }: { eventId: string }) {
  const [report, setReport] = useState<EventReport | null>(null);
  const [ticketTypeReport, setTicketTypeReport] =
    useState<TicketTypeSalesReport | null>(null);
  const [sessionReport, setSessionReport] = useState<SessionSalesReport | null>(
    null,
  );
  const [productReport, setProductReport] = useState<ProductSalesReport | null>(
    null,
  );
  const [dateReport, setDateReport] = useState<DateSalesReport | null>(null);
  const [salesPaceReport, setSalesPaceReport] =
    useState<SalesPaceReport | null>(null);
  const [reportView, setReportView] = useState<ReportView>("OVERVIEW");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [date, setDate] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  function load(
    filters: { date?: string; sessionId?: string } = {},
    view = reportView,
  ) {
    setIsLoading(true);
    setError("");
    const request =
      view === "TICKET_TYPES"
        ? reportingService
            .getTicketTypeSales(eventId, filters)
            .then(setTicketTypeReport)
        : view === "SESSIONS"
          ? reportingService
              .getSessionSales(eventId, filters)
              .then(setSessionReport)
          : view === "PRODUCTS"
            ? reportingService
                .getProductSales(eventId, filters)
                .then(setProductReport)
            : view === "DATES"
              ? reportingService
                  .getDateSales(eventId, filters)
                  .then(setDateReport)
              : view === "SALES_PACE"
                ? reportingService
                    .getSalesPace(eventId, filters)
                    .then(setSalesPaceReport)
                : reportingService
                    .getEventReport(eventId, filters)
                    .then(setReport);
    request
      .catch((requestError: unknown) =>
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load this Event report.",
        ),
      )
      .finally(() => setIsLoading(false));
  }

  function changeReportView(nextView: ReportView) {
    setReportView(nextView);
    load(
      { date: date || undefined, sessionId: sessionId || undefined },
      nextView,
    );
  }

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      reportingService.getEventReport(eventId),
      sessionService.getSessions(eventId),
    ])
      .then(([nextReport, nextSessions]) => {
        if (!cancelled) {
          setReport(nextReport);
          setSessions(nextSessions);
          setError("");
        }
      })
      .catch((requestError: unknown) => {
        if (!cancelled)
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load this Event report.",
          );
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
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

  async function exportCsv() {
    const exportType = {
      TICKET_TYPES: "ticket-types",
      SESSIONS: "sessions",
      PRODUCTS: "products",
      DATES: "dates",
      SALES_PACE: "sales-pace",
    }[reportView as Exclude<ReportView, "OVERVIEW">];
    if (!exportType) return;
    setIsExporting(true);
    setError("");
    try {
      const file = await reportingService.downloadEventCsv(
        eventId,
        exportType,
        { date: date || undefined, sessionId: sessionId || undefined },
      );
      downloadFile(file.blob, file.filename);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to export this report.",
      );
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border bg-card p-6 shadow-sm print:border-0 print:p-0 print:shadow-none">
        <h2 className="text-2xl font-semibold tracking-tight">Event reports</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Authoritative operational performance from Bookings, Payments,
          refunds, Tickets and Sessions.
        </p>
        <div className="mt-4 hidden text-sm print:block">
          <p>Report: {reportLabel(reportView)}</p>
          <p>
            Scope: {date || "Full Event"}
            {sessionId ? " · selected Session" : " · all Sessions"} ·{" "}
            {report?.event.timezone ?? "Australia/Melbourne"}
          </p>
          <p>Generated: {new Date().toLocaleString("en-AU")}</p>
        </div>
        <form
          onSubmit={applyFilters}
          className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-[1.5fr_1fr_2fr_auto_auto] xl:items-end print:hidden"
        >
          <label className="text-sm font-medium">
            Report
            <select
              aria-label="Report"
              value={reportView}
              onChange={(event) =>
                changeReportView(event.target.value as ReportView)
              }
              className="mt-2 h-10 w-full rounded-lg border bg-background px-3 font-normal"
            >
              <option value="OVERVIEW">Event overview</option>
              <option value="TICKET_TYPES">Sales by Ticket Type</option>
              <option value="SESSIONS">Sales by Session</option>
              <option value="DATES">Sales by Event date</option>
              <option value="SALES_PACE">Booking pace</option>
              <option value="PRODUCTS">Product and Variant sales</option>
            </select>
          </label>
          <label className="text-sm font-medium">
            Event-local date
            <input
              aria-label="Event-local date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="mt-2 h-10 w-full rounded-lg border bg-background px-3 font-normal"
            />
          </label>
          <label className="text-sm font-medium">
            Session
            <select
              aria-label="Session"
              value={sessionId}
              onChange={(event) => setSessionId(event.target.value)}
              className="mt-2 h-10 w-full rounded-lg border bg-background px-3 font-normal"
            >
              <option value="">All Sessions</option>
              {sessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.name} —{" "}
                  {localDateTime(session.startDate, report?.event.timezone)}
                </option>
              ))}
            </select>
          </label>
          <Button type="submit">Apply filters</Button>
          <Button type="button" variant="outline" onClick={clearFilters}>
            Clear
          </Button>
        </form>
        {reportView === "OVERVIEW" && report ? (
          <p className="mt-4 text-xs text-muted-foreground">
            Effective window:{" "}
            {localDateTime(report.filter.startsAt, report.event.timezone)} to{" "}
            {localDateTime(report.filter.endsAt, report.event.timezone)} (
            {report.event.timezone})
          </p>
        ) : null}
        {reportView !== "OVERVIEW" ? (
          <p className="mt-4 text-xs text-muted-foreground">
            Reporting scope: {date || "Full Event"}
            {sessionId ? " · selected Session" : " · all Sessions"} (
            {report?.event.timezone ?? "Australia/Melbourne"})
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-3 print:hidden">
          <Button
            type="button"
            variant="outline"
            disabled={reportView === "OVERVIEW" || isExporting}
            onClick={exportCsv}
          >
            {isExporting ? "Preparing CSV..." : "Export CSV"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => window.print()}
          >
            Print / Save PDF
          </Button>
          {reportView === "OVERVIEW" ? (
            <span className="self-center text-xs text-muted-foreground">
              Choose a detailed report to export CSV.
            </span>
          ) : null}
        </div>
      </section>

      {isLoading ? <StateCard>Loading report...</StateCard> : null}
      {error ? <StateCard error>{error}</StateCard> : null}
      {reportView === "OVERVIEW" && report && !isLoading ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Metric
              label="Gross collected"
              value={money.format(report.commercial.grossCollected)}
            />
            <Metric
              label="Successful refunds"
              value={money.format(report.commercial.refunded)}
            />
            <Metric
              label="Net collected"
              value={money.format(report.commercial.netCollected)}
            />
            <Metric
              label="Confirmed bookings"
              value={report.commercial.confirmedBookings}
            />
            <Metric
              label="Average booking"
              value={money.format(report.commercial.averageBookingValue)}
            />
            <Metric label="Tickets issued" value={report.tickets.issued} />
            <Metric label="Admissions" value={report.tickets.admissions} />
            <Metric
              label="Completed Session changes"
              value={report.sessionChanges.completed}
            />
            <Metric
              label="Attendance rate"
              value={`${report.tickets.attendanceRate}%`}
            />
          </section>

          {report.sessionChanges.completed > 0 ? (
            <section className="rounded-xl border bg-card p-6 shadow-sm">
              <h3 className="text-lg font-semibold">Session-change reasons</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Operational counts only; no customer or participant identity is
                included.
              </p>
              <dl className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {Object.entries(report.sessionChanges.byReason).map(
                  ([reason, count]) => (
                    <div key={reason} className="rounded-lg border p-4">
                      <dt className="text-sm text-muted-foreground">
                        {reason.replaceAll("_", " ")}
                      </dt>
                      <dd className="mt-1 text-xl font-semibold">{count}</dd>
                    </div>
                  ),
                )}
              </dl>
            </section>
          ) : null}

          <section className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
              <div>
                <h3 className="text-lg font-semibold">Payment exceptions</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Pending Payments or failed latest reconciliation attempts
                  requiring investigation.
                </p>
              </div>
              <span className="rounded-full border px-3 py-1 text-sm font-semibold">
                {report.payments.exceptionCount}
              </span>
            </div>
            <div className="mt-4 grid gap-2">
              {report.payments.exceptions.map((exception) => (
                <Link
                  key={exception.bookingId}
                  href={`/bookings/${exception.bookingId}`}
                  className="flex justify-between rounded-lg border p-3 text-sm hover:bg-muted/40"
                >
                  <span>{exception.bookingNumber}</span>
                  <span className="font-medium">Investigate →</span>
                </Link>
              ))}
              {report.payments.exceptionCount === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No Payment exceptions in this reporting window.
                </p>
              ) : null}
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
            <div className="p-6">
              <h3 className="text-lg font-semibold">Session utilisation</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Admission capacity remains shared across Ticket Types and
                separate from Product inventory.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="border-y bg-muted/40 text-muted-foreground">
                  <tr>
                    <Th>Session</Th>
                    <Th>Capacity</Th>
                    <Th>Reserved</Th>
                    <Th>Confirmed</Th>
                    <Th>Remaining</Th>
                    <Th>Utilisation</Th>
                    <Th>Admitted</Th>
                  </tr>
                </thead>
                <tbody>
                  {report.sessions.map((session) => (
                    <tr key={session.id} className="border-b last:border-0">
                      <td className="px-5 py-4">
                        <p className="font-medium">{session.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {localDateTime(
                            session.startDate,
                            report.event.timezone,
                          )}{" "}
                          · {session.status}
                        </p>
                      </td>
                      <Td>{session.capacity}</Td>
                      <Td>{session.reservedAttendance}</Td>
                      <Td>{session.confirmedAttendance}</Td>
                      <Td>{session.remainingCapacity}</Td>
                      <Td>{session.utilisationPercent}%</Td>
                      <Td>{session.admissions}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {report.sessions.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">
                No Sessions match the selected filters.
              </p>
            ) : null}
          </section>

          <p className="text-xs text-muted-foreground">
            These figures are operational Payment reporting and are not
            accounting, settlement, payout or tax records.
          </p>
        </>
      ) : null}

      {reportView === "TICKET_TYPES" && ticketTypeReport && !isLoading ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Metric
              label="Ticket units sold"
              value={ticketTypeReport.totals.unitsSold}
            />
            <Metric
              label="Gross Ticket sales"
              value={money.format(ticketTypeReport.totals.grossItemSales)}
            />
            <Metric
              label="Allocated Ticket refunds"
              value={money.format(
                ticketTypeReport.totals.allocatedTicketRefunds,
              )}
            />
            <Metric
              label="Net Ticket sales"
              value={money.format(ticketTypeReport.totals.netTicketSales)}
            />
            <Metric
              label="Unallocated refunds"
              value={money.format(ticketTypeReport.totals.unallocatedRefunds)}
            />
            <Metric
              label="Tickets issued"
              value={ticketTypeReport.totals.ticketsIssued}
            />
            <Metric
              label="Admissions"
              value={ticketTypeReport.totals.admissions}
            />
          </section>
          <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
            <div className="p-6">
              <h3 className="text-lg font-semibold">Sales by Ticket Type</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Compare demand, gross item sales and attendance across Ticket
                Types.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1180px] text-left text-sm">
                <thead className="border-y bg-muted/40 text-muted-foreground">
                  <tr>
                    <Th>Ticket Type</Th>
                    <Th>Status</Th>
                    <Th>Units sold</Th>
                    <Th>Gross Ticket sales</Th>
                    <Th>Allocated refunds</Th>
                    <Th>Net Ticket sales</Th>
                    <Th>Unit share</Th>
                    <Th>Tickets issued</Th>
                    <Th>Admissions</Th>
                  </tr>
                </thead>
                <tbody>
                  {ticketTypeReport.rows.map((row) => (
                    <tr key={row.id} className="border-b last:border-0">
                      <td className="px-5 py-4 font-medium">{row.name}</td>
                      <Td>{row.active ? "Active" : "Inactive"}</Td>
                      <Td>{row.unitsSold}</Td>
                      <Td>{money.format(row.grossItemSales)}</Td>
                      <Td>{money.format(row.allocatedTicketRefunds)}</Td>
                      <Td>{money.format(row.netTicketSales)}</Td>
                      <Td>{row.unitSharePercent}%</Td>
                      <Td>{row.ticketsIssued}</Td>
                      <Td>{row.admissions}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {ticketTypeReport.rows.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">
                No Ticket Type sales match the selected filters.
              </p>
            ) : null}
          </section>
          <p className="text-xs text-muted-foreground">
            Successful Ticket-adjustment refunds are allocated to their Ticket
            Types and reduce net Ticket sales. Refunds without authoritative
            Ticket allocation remain separately disclosed as unallocated. These
            figures are operational reporting, not accounting records.
          </p>
        </>
      ) : null}

      {reportView === "SESSIONS" && sessionReport && !isLoading ? (
        <>
          <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
            <div className="p-6">
              <h3 className="text-lg font-semibold">Sales by Session</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Commercial performance, attendance and shared venue capacity in
                one operational view.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1500px] text-left text-sm">
                <thead className="border-y bg-muted/40 text-muted-foreground">
                  <tr>
                    <Th>Session</Th>
                    <Th>Confirmed bookings</Th>
                    <Th>Booking value</Th>
                    <Th>Gross collected</Th>
                    <Th>Refunded</Th>
                    <Th>Net collected</Th>
                    <Th>Ticket units</Th>
                    <Th>Issued</Th>
                    <Th>Admissions</Th>
                    <Th>Capacity</Th>
                    <Th>Reserved</Th>
                    <Th>Remaining</Th>
                    <Th>Utilisation</Th>
                  </tr>
                </thead>
                <tbody>
                  {sessionReport.rows.map((row) => (
                    <tr key={row.id} className="border-b last:border-0">
                      <td className="px-5 py-4">
                        <p className="font-medium">{row.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {localDateTime(
                            row.startDate,
                            sessionReport.event.timezone,
                          )}{" "}
                          · {row.status}
                        </p>
                      </td>
                      <Td>{row.confirmedBookings}</Td>
                      <Td>{money.format(row.confirmedBookingValue)}</Td>
                      <Td>{money.format(row.grossCollected)}</Td>
                      <Td>{money.format(row.refunded)}</Td>
                      <Td>{money.format(row.netCollected)}</Td>
                      <Td>{row.ticketUnits}</Td>
                      <Td>{row.ticketsIssued}</Td>
                      <Td>{row.admissions}</Td>
                      <Td>{row.capacity}</Td>
                      <Td>{row.reservedAttendance}</Td>
                      <Td>{row.remainingCapacity}</Td>
                      <Td>{row.utilisationPercent}%</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {sessionReport.rows.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">
                No Sessions match the selected filters.
              </p>
            ) : null}
          </section>
          <p className="text-xs text-muted-foreground">
            Session capacity is shared across Ticket Types. These figures are
            operational Payment reporting and are not accounting, settlement,
            payout or tax records.
          </p>
        </>
      ) : null}

      {reportView === "PRODUCTS" && productReport && !isLoading ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Metric
              label="Product units sold"
              value={productReport.totals.unitsSold}
            />
            <Metric
              label="Gross Product sales"
              value={money.format(productReport.totals.grossItemSales)}
            />
            <Metric
              label="Bookings with Products"
              value={productReport.totals.bookingsWithProducts}
            />
            <Metric
              label="Product attach rate"
              value={`${productReport.totals.attachRatePercent}%`}
            />
          </section>
          <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
            <div className="p-6">
              <h3 className="text-lg font-semibold">
                Product and Variant sales
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Product demand, finite inventory and reusable Session capacity
                remain separate operational measures.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1300px] text-left text-sm">
                <thead className="border-y bg-muted/40 text-muted-foreground">
                  <tr>
                    <Th>Product</Th>
                    <Th>Demand type</Th>
                    <Th>Units sold</Th>
                    <Th>Gross Product sales</Th>
                    <Th>Attach rate</Th>
                    <Th>Current inventory</Th>
                    <Th>Reusable capacity peak</Th>
                  </tr>
                </thead>
                <tbody>
                  {productReport.rows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b align-top last:border-0"
                    >
                      <td className="px-5 py-4">
                        <p className="font-medium">{row.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {row.group?.name ?? "Ungrouped"} · {row.status}
                        </p>
                        {row.variants.length > 0 ? (
                          <div className="mt-3 space-y-2">
                            {row.variants.map((variant) => (
                              <div
                                key={variant.id}
                                className="rounded-md bg-muted/40 p-2 text-xs"
                              >
                                <span className="font-medium">
                                  {variant.name}
                                </span>{" "}
                                · {variant.unitsSold} sold ·{" "}
                                {money.format(variant.grossItemSales)}
                                {variant.inventoryTracked
                                  ? ` · ${variant.inventoryRemaining ?? 0} of ${variant.inventoryQuantity ?? 0} remaining (${variant.sellThroughPercent ?? 0}% committed)`
                                  : ""}
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </td>
                      <Td>
                        {row.requiredByRule
                          ? "Required by active Rule"
                          : "Discretionary Add-on"}
                      </Td>
                      <Td>{row.unitsSold}</Td>
                      <Td>{money.format(row.grossItemSales)}</Td>
                      <Td>{row.attachRatePercent}%</Td>
                      <Td>
                        {row.inventory.tracked ? (
                          <>
                            <p>
                              {row.inventory.remaining} of{" "}
                              {row.inventory.quantity} remaining
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {row.inventory.sellThroughPercent ?? 0}% committed
                            </p>
                          </>
                        ) : (
                          "Not inventory tracked"
                        )}
                      </Td>
                      <Td>
                        {row.capacity.controlled ? (
                          row.capacity.peakSession ? (
                            <>
                              <p>{row.capacity.peakSession.sessionName}</p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {row.capacity.peakSession.reserved} of{" "}
                                {row.capacity.peakSession.limit ??
                                  "unconfigured"}{" "}
                                reserved ·{" "}
                                {row.capacity.peakSession.utilisationPercent}%
                              </p>
                            </>
                          ) : (
                            "No matching Sessions"
                          )
                        ) : (
                          "Not capacity controlled"
                        )}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {productReport.rows.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">
                No Products match this Event.
              </p>
            ) : null}
          </section>
          <p className="text-xs text-muted-foreground">
            Inventory remaining is the current Event-wide quantity after
            reserved and confirmed commitments, not a historical stock-movement
            ledger. Reusable capacity is measured independently per Session and
            does not reduce rink admission capacity. Refunds remain unallocated
            at Product and Variant level.
          </p>
        </>
      ) : null}

      {reportView === "DATES" && dateReport && !isLoading ? (
        <>
          <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
            <div className="p-6">
              <h3 className="text-lg font-semibold">Sales by Event date</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Commercial performance, attendance and capacity grouped by the
                Session date in {dateReport.event.timezone}.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1450px] text-left text-sm">
                <thead className="border-y bg-muted/40 text-muted-foreground">
                  <tr>
                    <Th>Event date</Th>
                    <Th>Sessions</Th>
                    <Th>Confirmed bookings</Th>
                    <Th>Ticket units</Th>
                    <Th>Booking value</Th>
                    <Th>Gross collected</Th>
                    <Th>Refunded</Th>
                    <Th>Net collected</Th>
                    <Th>Issued</Th>
                    <Th>Admissions</Th>
                    <Th>Capacity</Th>
                    <Th>Reserved</Th>
                    <Th>Remaining</Th>
                    <Th>Utilisation</Th>
                  </tr>
                </thead>
                <tbody>
                  {dateReport.rows.map((row) => (
                    <tr key={row.date} className="border-b last:border-0">
                      <td className="px-5 py-4 font-medium">
                        {localDate(row.date)}
                      </td>
                      <Td>{row.sessionCount}</Td>
                      <Td>{row.confirmedBookings}</Td>
                      <Td>{row.ticketUnits}</Td>
                      <Td>{money.format(row.grossBookingValue)}</Td>
                      <Td>{money.format(row.grossCollected)}</Td>
                      <Td>{money.format(row.refunded)}</Td>
                      <Td>{money.format(row.netCollected)}</Td>
                      <Td>{row.ticketsIssued}</Td>
                      <Td>{row.admissions}</Td>
                      <Td>{row.capacity}</Td>
                      <Td>{row.reservedAttendance}</Td>
                      <Td>{row.remainingCapacity}</Td>
                      <Td>{row.utilisationPercent}%</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {dateReport.rows.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">
                No Event dates match the selected filters.
              </p>
            ) : null}
          </section>
          <p className="text-xs text-muted-foreground">
            Dates follow Session start time in the Event timezone. Payments and
            refunds remain attached to those selected Bookings regardless of
            transaction date. This is operational reporting, not an accounting
            record.
          </p>
        </>
      ) : null}

      {reportView === "SALES_PACE" && salesPaceReport && !isLoading ? (
        <>
          <section className="grid gap-4 sm:grid-cols-3">
            <Metric
              label="Confirmed bookings"
              value={salesPaceReport.totals.confirmedBookings}
            />
            <Metric
              label="Confirmed Ticket units"
              value={salesPaceReport.totals.ticketUnits}
            />
            <Metric
              label="Gross Booking value"
              value={money.format(salesPaceReport.totals.grossBookingValue)}
            />
          </section>
          <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
            <div className="p-6">
              <h3 className="text-lg font-semibold">Booking pace</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                See when currently confirmed demand was created relative to each
                Session’s Event-local date.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="border-y bg-muted/40 text-muted-foreground">
                  <tr>
                    <Th>Lead time</Th>
                    <Th>Confirmed bookings</Th>
                    <Th>Ticket units</Th>
                    <Th>Gross Booking value</Th>
                    <Th>Cumulative bookings</Th>
                    <Th>Cumulative Ticket units</Th>
                  </tr>
                </thead>
                <tbody>
                  {salesPaceReport.rows.map((row) => (
                    <tr key={row.key} className="border-b last:border-0">
                      <td className="px-5 py-4 font-medium">{row.label}</td>
                      <Td>{row.confirmedBookings}</Td>
                      <Td>{row.ticketUnits}</Td>
                      <Td>{money.format(row.grossBookingValue)}</Td>
                      <Td>{row.cumulativeBookings}</Td>
                      <Td>{row.cumulativeTicketUnits}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <p className="text-xs text-muted-foreground">
            Buckets use Booking creation date for Bookings that are currently
            confirmed; confirmation time is not used to assign the bucket. This
            measures sales timing from persisted Bookings, not website traffic,
            abandonment or conversion.
          </p>
        </>
      ) : null}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}
function StateCard({
  children,
  error = false,
}: {
  children: React.ReactNode;
  error?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border bg-card p-6 ${error ? "border-destructive/30 text-destructive" : ""}`}
    >
      {children}
    </div>
  );
}
function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-5 py-3 font-medium">{children}</th>;
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-5 py-4">{children}</td>;
}
function localDateTime(value: string, timezone = "Australia/Melbourne") {
  return new Intl.DateTimeFormat("en-AU", {
    timeZone: timezone,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
function localDate(value: string) {
  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00.000Z`));
}
function reportLabel(view: ReportView) {
  return {
    OVERVIEW: "Event overview",
    TICKET_TYPES: "Sales by Ticket Type",
    SESSIONS: "Sales by Session",
    PRODUCTS: "Product and Variant sales",
    DATES: "Sales by Event date",
    SALES_PACE: "Booking pace",
  }[view];
}
function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
