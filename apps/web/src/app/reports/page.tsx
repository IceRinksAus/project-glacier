"use client";

import { FormEvent, useEffect, useState, useSyncExternalStore } from "react";

import { PlatformShell } from "@/components/layout/PlatformShell";
import { Button } from "@/components/ui/button";
import { getAuthRoleSnapshot, getServerAuthRoleSnapshot, subscribeAuthSession } from "@/lib/auth";
import { EventGroup, EventGroupType, eventGroupService } from "@/services/event-group.service";
import { eventService, GlacierEvent } from "@/services/event.service";

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

  function toggle(id: string) { setEventIds((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]); }
  function move(id: string, direction: -1 | 1) { setEventIds((current) => { const index = current.indexOf(id); const target = index + direction; if (index < 0 || target < 0 || target >= current.length) return current; const next = [...current]; [next[index], next[target]] = [next[target], next[index]]; return next; }); }
  async function save() { setIsSaving(true); setMessage(""); try { await eventGroupService.replaceEvents(group.id, eventIds); setMessage("Membership saved."); await onSaved(); } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to save membership."); } finally { setIsSaving(false); } }
  async function archive() { setIsSaving(true); try { await eventGroupService.update(group.id, { status: group.status === "ACTIVE" ? "ARCHIVED" : "ACTIVE" }); await onSaved(); } finally { setIsSaving(false); } }

  return <section className="rounded-xl border bg-card p-6 shadow-sm">
    <div className="flex flex-col justify-between gap-3 sm:flex-row"><div><div className="flex items-center gap-3"><h2 className="text-lg font-semibold">{group.name}</h2><span className="rounded-full border px-2.5 py-1 text-xs font-medium">{group.type}</span><span className="text-xs text-muted-foreground">{group.status}</span></div>{group.description ? <p className="mt-2 text-sm text-muted-foreground">{group.description}</p> : null}</div>{canEdit ? <Button variant="outline" disabled={isSaving} onClick={archive}>{group.status === "ACTIVE" ? "Archive" : "Restore"}</Button> : null}</div>
    <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{allEvents.map((event) => { const selectedIndex = eventIds.indexOf(event.id); return <div key={event.id} className="rounded-lg border p-3"><label className="flex items-start gap-3 text-sm"><input type="checkbox" checked={selectedIndex >= 0} disabled={!canEdit || isSaving} onChange={() => toggle(event.id)} className="mt-1" /><span><span className="font-medium">{event.name}</span><span className="mt-1 block text-xs text-muted-foreground">{new Date(event.startDate).toLocaleDateString("en-AU")}</span></span></label>{canEdit && selectedIndex >= 0 ? <div className="mt-3 flex gap-2"><Button type="button" size="sm" variant="outline" disabled={selectedIndex === 0 || isSaving} onClick={() => move(event.id, -1)} aria-label={`Move ${event.name} earlier`}>↑</Button><Button type="button" size="sm" variant="outline" disabled={selectedIndex === eventIds.length - 1 || isSaving} onClick={() => move(event.id, 1)} aria-label={`Move ${event.name} later`}>↓</Button><span className="self-center text-xs text-muted-foreground">Position {selectedIndex + 1}</span></div> : null}</div>; })}</div>
    {canEdit ? <div className="mt-5 flex items-center gap-3"><Button disabled={isSaving} onClick={save}>{isSaving ? "Saving..." : "Save membership"}</Button>{message ? <p className="text-sm text-muted-foreground">{message}</p> : null}</div> : null}
  </section>;
}

function StateCard({ children, error = false }: { children: React.ReactNode; error?: boolean }) { return <div className={`rounded-xl border bg-card p-6 ${error ? "border-destructive/30 text-destructive" : ""}`}>{children}</div>; }
