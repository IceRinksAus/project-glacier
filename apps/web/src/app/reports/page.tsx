"use client";

import {
  BarChart3,
  CalendarRange,
  ChartNoAxesCombined,
  CircleDollarSign,
  ClipboardList,
  CreditCard,
  PackageSearch,
  ScanLine,
  Ticket,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useState, useSyncExternalStore } from "react";

import { PlatformShell } from "@/components/layout/PlatformShell";
import { Button } from "@/components/ui/button";
import { getAuthRoleSnapshot, getServerAuthRoleSnapshot, subscribeAuthSession } from "@/lib/auth";
import { EventGroup, EventGroupType, eventGroupService } from "@/services/event-group.service";
import { eventService, GlacierEvent } from "@/services/event.service";
import {
  EventGroupComparisonReport,
  OrganizationReport,
  reportingService,
} from "@/services/reporting.service";

const money = new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" });

const groupTypes: Array<{ value: EventGroupType; label: string }> = [
  { value: "SEASON", label: "Season" },
  { value: "TOUR", label: "Tour" },
  { value: "PROMOTER", label: "Promoter" },
  { value: "CAMPAIGN", label: "Campaign" },
  { value: "CUSTOM", label: "Custom" },
];

type ReportCardDefinition = {
  title: string;
  description: string;
  view?: string;
  icon: typeof BarChart3;
  status?: "Available" | "Planned";
};

const reportCategories: Array<{
  title: string;
  description: string;
  tone: string;
  reports: ReportCardDefinition[];
}> = [
  {
    title: "Sales and revenue",
    description: "Understand what sold, when it sold and how Event income is tracking.",
    tone: "text-sky-700 bg-sky-50",
    reports: [
      { title: "Sales Summary", description: "Collected revenue, refunds, bookings and average booking value.", view: "OVERVIEW", icon: ChartNoAxesCombined },
      { title: "Sales by Ticket Type", description: "Ticket quantity, sales mix, admissions and gross item sales.", view: "TICKET_TYPES", icon: Ticket },
      { title: "Sales by Session", description: "Session revenue, attendance demand and remaining capacity.", view: "SESSIONS", icon: CalendarRange },
      { title: "Sales by Event Date", description: "Daily sales, Tickets, admissions and capacity performance.", view: "DATES", icon: BarChart3 },
      { title: "Sales by Channel", description: "Online card, POS Cash and POS EFTPOS comparison.", view: "OVERVIEW", icon: CreditCard },
      { title: "Booking Pace", description: "Daily and cumulative booking demand before each Event date.", view: "SALES_PACE", icon: ChartNoAxesCombined },
    ],
  },
  {
    title: "Tickets and operations",
    description: "Monitor capacity, attendance and the products needed to operate each Event.",
    tone: "text-emerald-700 bg-emerald-50",
    reports: [
      { title: "Session Performance", description: "Bookings, Tickets, collected revenue and utilisation by Session.", view: "SESSIONS", icon: CalendarRange },
      { title: "Capacity Utilisation", description: "Reserved attendance, remaining places and sell-through by Session.", view: "OVERVIEW", icon: UsersRound },
      { title: "Attendance and Check-in", description: "Tickets issued, admissions and attendance rate.", view: "OVERVIEW", icon: ScanLine },
      { title: "Product and Add-on Performance", description: "Units, gross sales, stock and reusable Product capacity.", view: "PRODUCTS", icon: PackageSearch },
      { title: "Event Comparison", description: "Compare saved seasons, tours and Event Groups using consistent measures.", icon: ClipboardList },
    ],
  },
  {
    title: "Financial and reconciliation",
    description: "Operational payment visibility without claiming settlement or accounting authority.",
    tone: "text-amber-700 bg-amber-50",
    reports: [
      { title: "Payment Method Summary", description: "Successful collections by supported Glacier payment method.", view: "OVERVIEW", icon: CreditCard },
      { title: "Cash Sales", description: "Successful POS Cash transactions for operational reconciliation.", view: "OVERVIEW", icon: CircleDollarSign },
      { title: "EFTPOS Sales", description: "Standalone POS EFTPOS transactions recorded by Glacier.", view: "OVERVIEW", icon: CreditCard },
      { title: "Refund Summary", description: "Successful refunds and their effect on Event net collection.", view: "OVERVIEW", icon: CircleDollarSign },
      { title: "Payment Exceptions", description: "Pending Payments and failed reconciliation attempts needing review.", view: "OVERVIEW", icon: ClipboardList },
    ],
  },
];

export default function ReportsPage() {
  const role = useSyncExternalStore(subscribeAuthSession, getAuthRoleSnapshot, getServerAuthRoleSnapshot);
  const [groups, setGroups] = useState<EventGroup[]>([]);
  const [events, setEvents] = useState<GlacierEvent[]>([]);
  const [summary, setSummary] = useState<OrganizationReport | null>(null);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<EventGroupType>("SEASON");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  async function reload() {
    const [nextGroups, nextEvents, nextSummary] = await Promise.all([
      eventGroupService.getAll(),
      eventService.getEvents(),
      reportingService.getOrganizationSummary(),
    ]);
    setGroups(nextGroups);
    setEvents(nextEvents);
    setSummary(nextSummary);
    setSelectedEventId((current) => current || nextEvents[0]?.id || "");
  }

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      eventGroupService.getAll(),
      eventService.getEvents(),
      reportingService.getOrganizationSummary(),
    ])
      .then(([nextGroups, nextEvents, nextSummary]) => {
        if (!cancelled) {
          setGroups(nextGroups);
          setEvents(nextEvents);
          setSummary(nextSummary);
          setSelectedEventId(nextEvents[0]?.id || "");
        }
      })
      .catch((requestError: unknown) => {
        if (!cancelled) setError(requestError instanceof Error ? requestError.message : "Unable to load Event Groups.");
      })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  async function createGroup(event: FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    try {
      await eventGroupService.create({ name: name.trim(), description: description.trim() || undefined, type });
      setName("");
      setDescription("");
      await reload();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to create Event Group.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <PlatformShell>
      <div className="space-y-8">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Performance and operations</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Reports</h1>
            <p className="mt-2 max-w-3xl text-muted-foreground">Start with the headline position, then open a focused report for the detail behind each figure.</p>
          </div>
          <label className="w-full text-sm font-medium lg:w-80">
            Event for detailed reports
            <select aria-label="Event for detailed reports" value={selectedEventId} onChange={(event) => setSelectedEventId(event.target.value)} className="mt-2 h-11 w-full rounded-lg border bg-background px-3 font-normal">
              {events.length === 0 ? <option value="">No authorised Events</option> : null}
              {events.map((event) => <option key={event.id} value={event.id}>{event.name}</option>)}
            </select>
          </label>
        </div>

        {isLoading ? <StateCard>Loading trusted reporting data...</StateCard> : null}
        {error ? <StateCard error>{error}</StateCard> : null}
        {!isLoading && summary ? <ReportingOverview summary={summary} selectedEventId={selectedEventId} /> : null}

        <section aria-labelledby="report-library-heading" className="space-y-7">
          <div>
            <p className="text-sm font-semibold text-primary">Report library</p>
            <h2 id="report-library-heading" className="mt-1 text-2xl font-semibold">Choose the question you want to answer</h2>
            <p className="mt-1 text-sm text-muted-foreground">Available reports open with the selected Event. Planned reports stay visible so the reporting roadmap is clear.</p>
          </div>
          {reportCategories.map((category) => <ReportCategory key={category.title} category={category} selectedEventId={selectedEventId} />)}
        </section>

        <section id="event-groups" className="space-y-5 scroll-mt-6 border-t pt-8 print:hidden">
          <div><p className="text-sm font-semibold text-primary">Report configuration</p><h2 className="mt-1 text-2xl font-semibold">Event Groups</h2><p className="mt-1 text-sm text-muted-foreground">Build seasons, tours or campaigns for trusted Event comparison.</p></div>
        {role === "OWNER" ? <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold">Create Event Group</h3>
          <form onSubmit={createGroup} className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end">
            <label className="text-sm font-medium">Group name<input required maxLength={120} value={name} onChange={(event) => setName(event.target.value)} className="mt-2 h-10 w-full rounded-lg border bg-background px-3 font-normal" placeholder="Winter Festival 2027" /></label>
            <label className="text-sm font-medium">Description<input maxLength={500} value={description} onChange={(event) => setDescription(event.target.value)} className="mt-2 h-10 w-full rounded-lg border bg-background px-3 font-normal" placeholder="Optional context" /></label>
            <label className="text-sm font-medium">Group type<select value={type} onChange={(event) => setType(event.target.value as EventGroupType)} className="mt-2 h-10 w-full rounded-lg border bg-background px-3 font-normal">{groupTypes.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
            <Button type="submit" disabled={isSaving}>{isSaving ? "Creating..." : "Create group"}</Button>
          </form>
        </div> : null}

        {!isLoading && groups.length === 0 ? <StateCard>No Event Groups yet. Create a Season, Tour, Promoter or Campaign to compare Events.</StateCard> : null}
        <div className="grid gap-5">{groups.map((group) => <GroupCard key={group.id} group={group} allEvents={events} canEdit={role === "OWNER"} onSaved={reload} />)}</div>
        </section>
      </div>
    </PlatformShell>
  );
}

function ReportingOverview({ summary, selectedEventId }: { summary: OrganizationReport; selectedEventId: string }) {
  const totalCapacity = summary.events.reduce((total, row) => total + row.sessions.totalCapacity, 0);
  const reservedAttendance = summary.events.reduce((total, row) => total + row.sessions.reservedAttendance, 0);
  const capacityUtilisation = totalCapacity > 0 ? Number(((reservedAttendance / totalCapacity) * 100).toFixed(1)) : 0;
  const selectedEvent = summary.events.find((row) => row.event.id === selectedEventId) ?? summary.events[0];

  return <section aria-labelledby="headline-performance" className="space-y-5">
    <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold text-primary">Organisation overview</p><h2 id="headline-performance" className="mt-1 text-2xl font-semibold">Headline performance</h2></div><p className="text-xs text-muted-foreground">Generated {new Date(summary.generatedAt).toLocaleString("en-AU")}</p></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <HeadlineMetric label="Gross collected" value={money.format(summary.totals.grossCollected)} note="Successful Payments" />
      <HeadlineMetric label="Refunded" value={money.format(summary.totals.refunded)} note="Successful refunds" />
      <HeadlineMetric label="Net collected" value={money.format(summary.totals.netCollected)} note="Gross less refunds" featured />
      <HeadlineMetric label="Tickets issued" value={summary.totals.ticketsIssued.toLocaleString("en-AU")} note={`${summary.totals.admissions.toLocaleString("en-AU")} admitted`} />
      <HeadlineMetric label="Confirmed bookings" value={summary.totals.confirmedBookings.toLocaleString("en-AU")} note={`${summary.totals.currentEvents} current · ${summary.totals.upcomingEvents} upcoming`} />
      <HeadlineMetric label="Capacity utilised" value={`${capacityUtilisation}%`} note={`${reservedAttendance.toLocaleString("en-AU")} of ${totalCapacity.toLocaleString("en-AU")} places`} />
      <HeadlineMetric label="Sessions today" value={summary.totals.sessionsToday.toLocaleString("en-AU")} note="Across authorised Events" />
      <HeadlineMetric label="Payment exceptions" value={summary.totals.paymentExceptions.toLocaleString("en-AU")} note={summary.totals.paymentExceptions > 0 ? "Needs review" : "No current exceptions"} alert={summary.totals.paymentExceptions > 0} />
    </div>
    {selectedEvent ? <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Selected Event snapshot</p><h3 className="mt-1 text-lg font-semibold">{selectedEvent.event.name}</h3><p className="mt-1 text-sm text-muted-foreground">{selectedEvent.lifecycle.toLowerCase()} · {selectedEvent.sessions.total} Sessions · {selectedEvent.bookings.confirmed} confirmed bookings</p></div><Link href={`/events/${encodeURIComponent(selectedEvent.event.id)}?tab=Reports`} className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground">Open Event reports</Link></div>
      <div className="mt-5 grid gap-4 md:grid-cols-[1fr_auto] md:items-center"><div><div className="mb-2 flex justify-between text-sm"><span>Capacity utilisation</span><span className="font-semibold">{selectedEvent.sessions.utilisationPercent}%</span></div><div className="h-3 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(selectedEvent.sessions.utilisationPercent, 100)}%` }} /></div></div><div className="grid grid-cols-3 gap-5 text-sm"><SnapshotValue label="Net" value={money.format(selectedEvent.commercial.netCollected)} /><SnapshotValue label="Tickets" value={selectedEvent.tickets.issued} /><SnapshotValue label="Admissions" value={selectedEvent.tickets.admissions} /></div></div>
    </div> : <StateCard>No authorised Events are available for detailed reporting.</StateCard>}
    <p className="text-xs text-muted-foreground">Operational reporting only. Figures are not processor settlement, payout, accounting, profit or tax records.</p>
  </section>;
}

function ReportCategory({ category, selectedEventId }: { category: (typeof reportCategories)[number]; selectedEventId: string }) {
  return <div><div className="flex items-start gap-3"><span className={`mt-0.5 rounded-lg p-2 ${category.tone}`}><BarChart3 aria-hidden="true" className="h-5 w-5" /></span><div><h3 className="text-lg font-semibold">{category.title}</h3><p className="text-sm text-muted-foreground">{category.description}</p></div></div><div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{category.reports.map((report) => <ReportCard key={report.title} report={report} selectedEventId={selectedEventId} />)}</div></div>;
}

function ReportCard({ report, selectedEventId }: { report: ReportCardDefinition; selectedEventId: string }) {
  const status = report.status ?? "Available";
  const Icon = report.icon;
  const content = <><div className="flex items-start justify-between gap-4"><span className="rounded-lg bg-primary/10 p-2 text-primary"><Icon aria-hidden="true" className="h-6 w-6" /></span><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status === "Available" ? "bg-emerald-100 text-emerald-800" : "bg-muted text-muted-foreground"}`}>{status}</span></div><h4 className="mt-5 text-base font-semibold">{report.title}</h4><p className="mt-2 text-sm leading-6 text-muted-foreground">{report.description}</p></>;
  if (report.title === "Event Comparison") return <a href="#event-groups" className="rounded-xl border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">{content}</a>;
  if (status === "Planned" || !selectedEventId || !report.view) return <div className="rounded-xl border bg-card p-5 opacity-80">{content}</div>;
  return <Link href={`/events/${encodeURIComponent(selectedEventId)}?tab=Reports&report=${report.view}`} className="rounded-xl border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">{content}</Link>;
}

function HeadlineMetric({ label, value, note, featured = false, alert = false }: { label: string; value: string | number; note: string; featured?: boolean; alert?: boolean }) { return <div className={`rounded-xl border p-5 shadow-sm ${featured ? "border-primary/30 bg-primary text-primary-foreground" : alert ? "border-amber-300 bg-amber-50" : "bg-card"}`}><p className={`text-xs font-semibold uppercase tracking-[0.12em] ${featured ? "text-primary-foreground/75" : "text-muted-foreground"}`}>{label}</p><p className="mt-3 text-2xl font-semibold">{value}</p><p className={`mt-1 text-xs ${featured ? "text-primary-foreground/75" : "text-muted-foreground"}`}>{note}</p></div>; }
function SnapshotValue({ label, value }: { label: string; value: string | number }) { return <div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-semibold">{value}</p></div>; }

function GroupCard({ group, allEvents, canEdit, onSaved }: { group: EventGroup; allEvents: GlacierEvent[]; canEdit: boolean; onSaved: () => Promise<void> }) {
  const [eventIds, setEventIds] = useState(group.events.map(({ event }) => event.id));
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [comparison, setComparison] = useState<EventGroupComparisonReport | null>(null);
  const [isLoadingComparison, setIsLoadingComparison] = useState(false);
  const [comparisonError, setComparisonError] = useState("");

  function toggle(id: string) { setEventIds((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]); }
  function move(id: string, direction: -1 | 1) { setEventIds((current) => { const index = current.indexOf(id); const target = index + direction; if (index < 0 || target < 0 || target >= current.length) return current; const next = [...current]; [next[index], next[target]] = [next[target], next[index]]; return next; }); }
  async function save() { setIsSaving(true); setMessage(""); try { await eventGroupService.replaceEvents(group.id, eventIds); setMessage("Membership saved."); await onSaved(); } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to save membership."); } finally { setIsSaving(false); } }
  async function archive() { setIsSaving(true); try { await eventGroupService.update(group.id, { status: group.status === "ACTIVE" ? "ARCHIVED" : "ACTIVE" }); await onSaved(); } finally { setIsSaving(false); } }
  async function toggleComparison() {
    if (comparison) { setComparison(null); return; }
    setIsLoadingComparison(true); setComparisonError("");
    try { setComparison(await reportingService.getEventGroupComparison(group.id)); }
    catch (error) { setComparisonError(error instanceof Error ? error.message : "Unable to load this comparison."); }
    finally { setIsLoadingComparison(false); }
  }

  return <section className="rounded-xl border bg-card p-6 shadow-sm">
    <div className="flex flex-col justify-between gap-3 sm:flex-row"><div><div className="flex items-center gap-3"><h2 className="text-lg font-semibold">{group.name}</h2><span className="rounded-full border px-2.5 py-1 text-xs font-medium">{group.type}</span><span className="text-xs text-muted-foreground">{group.status}</span></div>{group.description ? <p className="mt-2 text-sm text-muted-foreground">{group.description}</p> : null}</div>{canEdit ? <Button variant="outline" disabled={isSaving} onClick={archive}>{group.status === "ACTIVE" ? "Archive" : "Restore"}</Button> : null}</div>
    <div className="mt-5 grid gap-3 print:hidden sm:grid-cols-2 xl:grid-cols-3">{allEvents.map((event) => { const selectedIndex = eventIds.indexOf(event.id); return <div key={event.id} className="rounded-lg border p-3"><label className="flex items-start gap-3 text-sm"><input type="checkbox" checked={selectedIndex >= 0} disabled={!canEdit || isSaving} onChange={() => toggle(event.id)} className="mt-1" /><span><span className="font-medium">{event.name}</span><span className="mt-1 block text-xs text-muted-foreground">{new Date(event.startDate).toLocaleDateString("en-AU")}</span></span></label>{canEdit && selectedIndex >= 0 ? <div className="mt-3 flex gap-2"><Button type="button" size="sm" variant="outline" disabled={selectedIndex === 0 || isSaving} onClick={() => move(event.id, -1)} aria-label={`Move ${event.name} earlier`}>↑</Button><Button type="button" size="sm" variant="outline" disabled={selectedIndex === eventIds.length - 1 || isSaving} onClick={() => move(event.id, 1)} aria-label={`Move ${event.name} later`}>↓</Button><span className="self-center text-xs text-muted-foreground">Position {selectedIndex + 1}</span></div> : null}</div>; })}</div>
    <div className="mt-5 flex flex-wrap items-center gap-3 print:hidden"><Button variant="outline" disabled={isLoadingComparison || group.events.length === 0} onClick={toggleComparison}>{isLoadingComparison ? "Loading comparison..." : comparison ? "Hide comparison" : "View comparison"}</Button>{canEdit ? <Button disabled={isSaving} onClick={save}>{isSaving ? "Saving..." : "Save membership"}</Button> : null}{message ? <p className="text-sm text-muted-foreground">{message}</p> : null}</div>
    {comparisonError ? <p className="mt-4 text-sm text-destructive">{comparisonError}</p> : null}
    {comparison ? <GroupComparison report={comparison} /> : null}
  </section>;
}

function GroupComparison({ report }: { report: EventGroupComparisonReport }) {
  const [isExporting, setIsExporting] = useState(false);
  async function exportCsv() { setIsExporting(true); try { const file = await reportingService.downloadEventGroupComparisonCsv(report.group.id); downloadFile(file.blob, file.filename); } finally { setIsExporting(false); } }
  return <div className="mt-6 space-y-5 border-t pt-6">
    <div><h3 className="text-lg font-semibold">Event comparison scorecard</h3><p className="mt-1 text-sm text-muted-foreground">Absolute totals and normalised performance across the saved Group. Currency: {report.currency}. Each Event retains its own timezone.</p><p className="mt-1 hidden text-xs print:block">Generated: {new Date().toLocaleString("en-AU")}</p><div className="mt-4 flex gap-3 print:hidden"><Button variant="outline" disabled={isExporting} onClick={exportCsv}>{isExporting ? "Preparing CSV..." : "Export CSV"}</Button><Button variant="outline" onClick={() => window.print()}>Print / Save PDF</Button></div></div>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><ComparisonMetric label="Net collected" value={money.format(report.totals.netCollected)} /><ComparisonMetric label="Confirmed bookings" value={report.totals.confirmedBookings} /><ComparisonMetric label="Attendance rate" value={`${report.totals.attendanceRatePercent}%`} /><ComparisonMetric label="Capacity utilisation" value={`${report.totals.capacityUtilisationPercent}%`} /><ComparisonMetric label="Product attach rate" value={`${report.totals.productAttachRatePercent}%`} /><ComparisonMetric label="Sessions" value={report.totals.sessions} /><ComparisonMetric label="Admissions" value={report.totals.admissions} /><ComparisonMetric label="Gross Product sales" value={money.format(report.totals.grossProductSales)} /></div>
    <div className="overflow-x-auto rounded-lg border"><table className="w-full min-w-[1900px] text-left text-sm"><thead className="border-b bg-muted/40 text-muted-foreground"><tr><Th>Event</Th><Th>Duration</Th><Th>Sessions</Th><Th>Net collected</Th><Th>Group contribution</Th><Th>Revenue / Session</Th><Th>Revenue / capacity</Th><Th>Bookings</Th><Th>Tickets / Booking</Th><Th>Attendance</Th><Th>Capacity utilised</Th><Th>Unused capacity</Th><Th>Product attach</Th><Th>Product revenue / admission</Th><Th>Refund rate</Th><Th>Payment exceptions</Th></tr></thead><tbody>{report.rows.map((row) => <tr key={row.event.id} className="border-b last:border-0"><td className="px-4 py-4"><p className="font-medium">{row.event.name}</p><p className="mt-1 text-xs text-muted-foreground">{row.event.timezone}</p></td><Td>{row.durationDays} days</Td><Td>{row.sessions}</Td><Td>{money.format(row.netCollected)}</Td><Td>{row.contributionToGroupNetPercent}%</Td><Td>{money.format(row.revenuePerSession)}</Td><Td>{money.format(row.revenuePerCapacityPlace)}</Td><Td>{row.confirmedBookings}</Td><Td>{row.ticketsPerBooking}</Td><Td>{row.attendanceRatePercent}%</Td><Td>{row.capacityUtilisationPercent}%</Td><Td>{row.unusedCapacity}</Td><Td>{row.productAttachRatePercent}%</Td><Td>{money.format(row.productRevenuePerAdmission)}</Td><Td>{row.refundRatePercent}%</Td><Td>{row.paymentExceptionCount}</Td></tr>)}</tbody></table></div>
    <p className="text-xs text-muted-foreground">Normalised measures provide context, not a universal ranking. Gross Product sales are not net of unallocated refunds. Results are operational AUD reporting, not settlement, accounting, profit or tax records.</p>
  </div>;
}

function ComparisonMetric({ label, value }: { label: string; value: string | number }) { return <div className="rounded-lg border bg-background p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-lg font-semibold">{value}</p></div>; }
function Th({ children }: { children: React.ReactNode }) { return <th className="px-4 py-3 font-medium">{children}</th>; }
function Td({ children }: { children: React.ReactNode }) { return <td className="px-4 py-4">{children}</td>; }

function StateCard({ children, error = false }: { children: React.ReactNode; error?: boolean }) { return <div className={`rounded-xl border bg-card p-6 ${error ? "border-destructive/30 text-destructive" : ""}`}>{children}</div>; }
function downloadFile(blob: Blob, filename: string) { const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = filename; anchor.click(); URL.revokeObjectURL(url); }
