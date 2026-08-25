"use client";

import { FormEvent, useEffect, useState, useSyncExternalStore } from "react";

import { PlatformShell } from "@/components/layout/PlatformShell";
import { Button } from "@/components/ui/button";
import { getAuthRoleSnapshot, getServerAuthRoleSnapshot, subscribeAuthSession } from "@/lib/auth";
import { EventGroup, EventGroupType, eventGroupService } from "@/services/event-group.service";
import { eventService, GlacierEvent } from "@/services/event.service";
import { EventGroupComparisonReport, reportingService } from "@/services/reporting.service";

const money = new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" });

const groupTypes: Array<{ value: EventGroupType; label: string }> = [
  { value: "SEASON", label: "Season" },
  { value: "TOUR", label: "Tour" },
  { value: "PROMOTER", label: "Promoter" },
  { value: "CAMPAIGN", label: "Campaign" },
  { value: "CUSTOM", label: "Custom" },
];

export default function ReportsPage() {
  const role = useSyncExternalStore(subscribeAuthSession, getAuthRoleSnapshot, getServerAuthRoleSnapshot);
  const [groups, setGroups] = useState<EventGroup[]>([]);
  const [events, setEvents] = useState<GlacierEvent[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<EventGroupType>("SEASON");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  async function reload() {
    const [nextGroups, nextEvents] = await Promise.all([eventGroupService.getAll(), eventService.getEvents()]);
    setGroups(nextGroups);
    setEvents(nextEvents);
  }

  useEffect(() => {
    let cancelled = false;
    Promise.all([eventGroupService.getAll(), eventService.getEvents()])
      .then(([nextGroups, nextEvents]) => {
        if (!cancelled) {
          setGroups(nextGroups);
          setEvents(nextEvents);
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
        <div><p className="text-sm font-medium text-muted-foreground">Decision support</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Reports</h1><p className="mt-2 text-muted-foreground">Group Events into seasons, tours, promoters or campaigns and prepare trusted comparisons.</p></div>

        {role === "OWNER" ? <section className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Create Event Group</h2>
          <form onSubmit={createGroup} className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end">
            <label className="text-sm font-medium">Group name<input required maxLength={120} value={name} onChange={(event) => setName(event.target.value)} className="mt-2 h-10 w-full rounded-lg border bg-background px-3 font-normal" placeholder="Winter Festival 2027" /></label>
            <label className="text-sm font-medium">Description<input maxLength={500} value={description} onChange={(event) => setDescription(event.target.value)} className="mt-2 h-10 w-full rounded-lg border bg-background px-3 font-normal" placeholder="Optional context" /></label>
            <label className="text-sm font-medium">Group type<select value={type} onChange={(event) => setType(event.target.value as EventGroupType)} className="mt-2 h-10 w-full rounded-lg border bg-background px-3 font-normal">{groupTypes.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
            <Button type="submit" disabled={isSaving}>{isSaving ? "Creating..." : "Create group"}</Button>
          </form>
        </section> : null}

        {isLoading ? <StateCard>Loading Event Groups...</StateCard> : null}
        {error ? <StateCard error>{error}</StateCard> : null}
        {!isLoading && groups.length === 0 ? <StateCard>No Event Groups yet. Create a Season, Tour, Promoter or Campaign to compare Events.</StateCard> : null}
        <div className="grid gap-5">{groups.map((group) => <GroupCard key={group.id} group={group} allEvents={events} canEdit={role === "OWNER"} onSaved={reload} />)}</div>
      </div>
    </PlatformShell>
  );
}

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
    <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{allEvents.map((event) => { const selectedIndex = eventIds.indexOf(event.id); return <div key={event.id} className="rounded-lg border p-3"><label className="flex items-start gap-3 text-sm"><input type="checkbox" checked={selectedIndex >= 0} disabled={!canEdit || isSaving} onChange={() => toggle(event.id)} className="mt-1" /><span><span className="font-medium">{event.name}</span><span className="mt-1 block text-xs text-muted-foreground">{new Date(event.startDate).toLocaleDateString("en-AU")}</span></span></label>{canEdit && selectedIndex >= 0 ? <div className="mt-3 flex gap-2"><Button type="button" size="sm" variant="outline" disabled={selectedIndex === 0 || isSaving} onClick={() => move(event.id, -1)} aria-label={`Move ${event.name} earlier`}>↑</Button><Button type="button" size="sm" variant="outline" disabled={selectedIndex === eventIds.length - 1 || isSaving} onClick={() => move(event.id, 1)} aria-label={`Move ${event.name} later`}>↓</Button><span className="self-center text-xs text-muted-foreground">Position {selectedIndex + 1}</span></div> : null}</div>; })}</div>
    <div className="mt-5 flex flex-wrap items-center gap-3"><Button variant="outline" disabled={isLoadingComparison || group.events.length === 0} onClick={toggleComparison}>{isLoadingComparison ? "Loading comparison..." : comparison ? "Hide comparison" : "View comparison"}</Button>{canEdit ? <Button disabled={isSaving} onClick={save}>{isSaving ? "Saving..." : "Save membership"}</Button> : null}{message ? <p className="text-sm text-muted-foreground">{message}</p> : null}</div>
    {comparisonError ? <p className="mt-4 text-sm text-destructive">{comparisonError}</p> : null}
    {comparison ? <GroupComparison report={comparison} /> : null}
  </section>;
}

function GroupComparison({ report }: { report: EventGroupComparisonReport }) {
  return <div className="mt-6 space-y-5 border-t pt-6">
    <div><h3 className="text-lg font-semibold">Event comparison scorecard</h3><p className="mt-1 text-sm text-muted-foreground">Absolute totals and normalised performance across the saved Group. Currency: {report.currency}. Each Event retains its own timezone.</p></div>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><ComparisonMetric label="Net collected" value={money.format(report.totals.netCollected)} /><ComparisonMetric label="Confirmed bookings" value={report.totals.confirmedBookings} /><ComparisonMetric label="Attendance rate" value={`${report.totals.attendanceRatePercent}%`} /><ComparisonMetric label="Capacity utilisation" value={`${report.totals.capacityUtilisationPercent}%`} /><ComparisonMetric label="Product attach rate" value={`${report.totals.productAttachRatePercent}%`} /><ComparisonMetric label="Sessions" value={report.totals.sessions} /><ComparisonMetric label="Admissions" value={report.totals.admissions} /><ComparisonMetric label="Gross Product sales" value={money.format(report.totals.grossProductSales)} /></div>
    <div className="overflow-x-auto rounded-lg border"><table className="w-full min-w-[1900px] text-left text-sm"><thead className="border-b bg-muted/40 text-muted-foreground"><tr><Th>Event</Th><Th>Duration</Th><Th>Sessions</Th><Th>Net collected</Th><Th>Group contribution</Th><Th>Revenue / Session</Th><Th>Revenue / capacity</Th><Th>Bookings</Th><Th>Tickets / Booking</Th><Th>Attendance</Th><Th>Capacity utilised</Th><Th>Unused capacity</Th><Th>Product attach</Th><Th>Product revenue / admission</Th><Th>Refund rate</Th><Th>Payment exceptions</Th></tr></thead><tbody>{report.rows.map((row) => <tr key={row.event.id} className="border-b last:border-0"><td className="px-4 py-4"><p className="font-medium">{row.event.name}</p><p className="mt-1 text-xs text-muted-foreground">{row.event.timezone}</p></td><Td>{row.durationDays} days</Td><Td>{row.sessions}</Td><Td>{money.format(row.netCollected)}</Td><Td>{row.contributionToGroupNetPercent}%</Td><Td>{money.format(row.revenuePerSession)}</Td><Td>{money.format(row.revenuePerCapacityPlace)}</Td><Td>{row.confirmedBookings}</Td><Td>{row.ticketsPerBooking}</Td><Td>{row.attendanceRatePercent}%</Td><Td>{row.capacityUtilisationPercent}%</Td><Td>{row.unusedCapacity}</Td><Td>{row.productAttachRatePercent}%</Td><Td>{money.format(row.productRevenuePerAdmission)}</Td><Td>{row.refundRatePercent}%</Td><Td>{row.paymentExceptionCount}</Td></tr>)}</tbody></table></div>
    <p className="text-xs text-muted-foreground">Normalised measures provide context, not a universal ranking. Gross Product sales are not net of unallocated refunds. Results are operational AUD reporting, not settlement, accounting, profit or tax records.</p>
  </div>;
}

function ComparisonMetric({ label, value }: { label: string; value: string | number }) { return <div className="rounded-lg border bg-background p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-lg font-semibold">{value}</p></div>; }
function Th({ children }: { children: React.ReactNode }) { return <th className="px-4 py-3 font-medium">{children}</th>; }
function Td({ children }: { children: React.ReactNode }) { return <td className="px-4 py-4">{children}</td>; }

function StateCard({ children, error = false }: { children: React.ReactNode; error?: boolean }) { return <div className={`rounded-xl border bg-card p-6 ${error ? "border-destructive/30 text-destructive" : ""}`}>{children}</div>; }
