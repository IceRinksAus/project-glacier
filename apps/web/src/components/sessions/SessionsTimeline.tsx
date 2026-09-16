"use client";

import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { useSessions } from "@/hooks/useSessions";
import { reportingService, type EventReport } from "@/services/reporting.service";

import { SessionDetailPanel } from "./SessionDetailPanel";
import { addMonths, calendarDays, capacityStatus, dateKey, initialSessionDate } from "./session-calendar";

interface SessionsTimelineProps {
  eventId: string;
  eventStartDate: string;
  eventEndDate: string;
  eventTimezone: string | null;
}

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function SessionsTimeline({
  eventId,
  eventStartDate,
  eventEndDate,
  eventTimezone,
}: SessionsTimelineProps) {
  const { sessions, isLoading, error, refresh } = useSessions(eventId);
  const [capacityRows, setCapacityRows] = useState<EventReport["sessions"]>([]);
  const [capacityError, setCapacityError] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [displayMonth, setDisplayMonth] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const timeZone = eventTimezone ?? "UTC";

  const loadCapacity = useCallback(async () => {
    try {
      setCapacityError("");
      const report = await reportingService.getEventReport(eventId);
      setCapacityRows(report.sessions);
    } catch (caught) {
      setCapacityError(caught instanceof Error ? caught.message : "Unable to load Session availability.");
    }
  }, [eventId]);

  useEffect(() => { void loadCapacity(); }, [loadCapacity]);

  useEffect(() => {
    if (!sessions.length && isLoading) return;
    setSelectedDate((current) => current || initialSessionDate({ sessions, eventStartDate, eventEndDate, timeZone }));
  }, [eventEndDate, eventStartDate, isLoading, sessions, timeZone]);

  useEffect(() => {
    if (selectedDate) setDisplayMonth((current) => current || selectedDate.slice(0, 7));
  }, [selectedDate]);

  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refresh(), loadCapacity()]);
    setRefreshing(false);
  }, [loadCapacity, refresh]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void refreshAll();
    }, 30_000);
    return () => window.clearInterval(interval);
  }, [refreshAll]);

  const sessionsByDate = useMemo(() => sessions.reduce<Record<string, typeof sessions>>((groups, session) => {
    const key = dateKey(session.startDate, timeZone);
    groups[key] ??= [];
    groups[key].push(session);
    return groups;
  }, {}), [sessions, timeZone]);

  const selectedSessions = useMemo(
    () => [...(sessionsByDate[selectedDate] ?? [])].sort((left, right) => left.startDate.localeCompare(right.startDate)),
    [selectedDate, sessionsByDate],
  );
  const capacityById = useMemo(() => new Map(capacityRows.map((row) => [row.id, row])), [capacityRows]);
  const eventStartKey = dateKey(eventStartDate, timeZone);
  const eventEndKey = dateKey(eventEndDate, timeZone);
  const firstMonth = eventStartKey.slice(0, 7);
  const lastMonth = eventEndKey.slice(0, 7);

  if (isLoading) return <StateCard>Loading Sessions...</StateCard>;
  if (error) return <StateCard error>{error}</StateCard>;
  if (sessions.length === 0) {
    return <StateCard><h2 className="text-lg font-semibold">No Sessions yet</h2><p className="mt-2 text-sm text-muted-foreground">Create a schedule to populate this Event calendar.</p></StateCard>;
  }

  const activeCount = selectedSessions.filter((session) => session.status === "ACTIVE").length;
  const draftCount = selectedSessions.filter((session) => session.status === "DRAFT").length;
  const cancelledCount = selectedSessions.filter((session) => session.status === "CANCELLED").length;
  const exceptionCount = selectedSessions.filter((session) => session.scheduleExceptionType && session.scheduleExceptionType !== "NONE").length;
  const operatingSpan = selectedSessions.length
    ? `${formatTime(selectedSessions[0].startDate, timeZone)}–${formatTime(selectedSessions.at(-1)!.endDate, timeZone)}`
    : "—";

  return (
    <>
      <div className="grid gap-6 xl:grid-cols-[330px_minmax(0,1fr)]">
        <section className="glacier-panel h-fit p-5">
          <div className="flex items-center justify-between gap-3">
            <button type="button" aria-label="Previous month" disabled={displayMonth <= firstMonth} onClick={() => setDisplayMonth(addMonths(displayMonth, -1))} className="rounded-lg border p-2 disabled:opacity-30"><ChevronLeft className="size-4" /></button>
            <h2 className="font-semibold">{monthLabel(displayMonth)}</h2>
            <button type="button" aria-label="Next month" disabled={displayMonth >= lastMonth} onClick={() => setDisplayMonth(addMonths(displayMonth, 1))} className="rounded-lg border p-2 disabled:opacity-30"><ChevronRight className="size-4" /></button>
          </div>
          <div className="mt-5 grid grid-cols-7 gap-1 text-center">
            {weekDays.map((day) => <span key={day} className="pb-2 text-[11px] font-semibold uppercase text-muted-foreground">{day}</span>)}
            {calendarDays(displayMonth).map((day) => {
              const inMonth = day.startsWith(displayMonth);
              const inEvent = day >= eventStartKey && day <= eventEndKey;
              const count = sessionsByDate[day]?.length ?? 0;
              const selected = day === selectedDate;
              return (
                <button
                  key={day}
                  type="button"
                  disabled={!inMonth || !inEvent}
                  aria-pressed={selected}
                  aria-label={`${formatCalendarDate(day)}${count ? `, ${count} Sessions` : ", no Sessions"}`}
                  onClick={() => setSelectedDate(day)}
                  className={`relative aspect-square rounded-lg text-sm transition disabled:invisible ${selected ? "bg-primary font-semibold text-primary-foreground" : count ? "bg-primary/10 font-medium text-primary hover:bg-primary/20" : "hover:bg-muted"}`}
                >
                  {Number(day.slice(-2))}
                  {count ? <span aria-hidden className={`absolute bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full ${selected ? "bg-primary-foreground" : "bg-primary"}`} /> : null}
                </button>
              );
            })}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">Dates with a blue marker contain Sessions. All dates use {timeZone}.</p>
        </section>

        <div className="space-y-4">
          <section className="glacier-panel p-5">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div><p className="glacier-kicker">Selected date</p><h2 className="mt-1 text-xl font-semibold">{formatSelectedDate(selectedDate)}</h2></div>
              <Button variant="outline" onClick={() => void refreshAll()} disabled={refreshing}><RefreshCw className={`mr-2 size-4 ${refreshing ? "animate-spin" : ""}`} />{refreshing ? "Refreshing..." : "Refresh availability"}</Button>
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
              <DayMetric label="Sessions" value={selectedSessions.length} />
              <DayMetric label="Active" value={activeCount} />
              <DayMetric label="Draft" value={draftCount} />
              <DayMetric label="Cancelled" value={cancelledCount} />
              <DayMetric label="Exceptions" value={exceptionCount} attention={exceptionCount > 0} />
              <DayMetric label="Operating span" value={operatingSpan} />
            </dl>
          </section>

          {capacityError ? <p role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">Session times are available, but live capacity could not be refreshed: {capacityError}</p> : null}
          {selectedSessions.length ? selectedSessions.map((session) => {
            const capacity = capacityById.get(session.id);
            return <SessionRow key={session.id} session={session} capacity={capacity} timeZone={timeZone} onOpen={() => setSelectedSessionId(session.id)} />;
          }) : <StateCard><h3 className="font-semibold">No Sessions on this date</h3><p className="mt-1 text-sm text-muted-foreground">Choose a marked date or create a schedule.</p></StateCard>}
        </div>
      </div>

      <SessionDetailPanel sessionId={selectedSessionId} eventTimezone={eventTimezone} onClose={() => setSelectedSessionId(null)} onSessionChanged={refreshAll} />
    </>
  );
}

function SessionRow({ session, capacity, timeZone, onOpen }: { session: ReturnType<typeof useSessions>["sessions"][number]; capacity?: EventReport["sessions"][number]; timeZone: string; onOpen: () => void }) {
  const start = formatTime(session.startDate, timeZone);
  const end = formatTime(session.endDate, timeZone);
  const availability = capacity ? capacityStatus(capacity) : null;
  const tones = { available: "bg-emerald-500", selling: "bg-amber-500", limited: "bg-orange-500", "sold-out": "bg-red-600" };
  const badges = { available: "bg-emerald-50 text-emerald-800", selling: "bg-amber-50 text-amber-900", limited: "bg-orange-50 text-orange-900", "sold-out": "bg-red-50 text-red-800" };
  return (
    <button type="button" onClick={onOpen} className="glacier-panel w-full p-5 text-left transition hover:border-primary/40 hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0"><p className="text-sm font-semibold text-primary">{start} – {end}</p><h3 className="mt-1 truncate font-semibold">{session.name}</h3><div className="mt-2 flex flex-wrap gap-2 text-xs"><span className="rounded-full border px-2.5 py-1">{session.status}</span>{session.scheduleExceptionType && session.scheduleExceptionType !== "NONE" ? <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-900">{session.scheduleExceptionType} schedule</span> : null}</div></div>
        <div className="w-full lg:max-w-md">
          {availability && capacity ? <><div className="flex items-center justify-between gap-3 text-sm"><span className={`rounded-full px-2.5 py-1 font-semibold ${badges[availability.tone]}`}>{availability.label}</span><span className="font-medium">{capacity.reservedAttendance} of {capacity.capacity} reserved</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label={`${session.name} reserved capacity`} aria-valuemin={0} aria-valuemax={capacity.capacity} aria-valuenow={capacity.reservedAttendance}><div className={`h-full rounded-full ${tones[availability.tone]}`} style={{ width: `${availability.percent}%` }} /></div></> : <p className="text-sm text-muted-foreground">Capacity {session.capacity} · availability loading</p>}
        </div>
      </div>
    </button>
  );
}

function DayMetric({ label, value, attention = false }: { label: string; value: number | string; attention?: boolean }) {
  return <div className={`rounded-lg border p-3 ${attention ? "border-amber-300 bg-amber-50" : "bg-muted/25"}`}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 text-xl font-semibold">{value}</dd></div>;
}

function StateCard({ children, error = false }: { children: React.ReactNode; error?: boolean }) {
  return <div className={`glacier-panel p-6 ${error ? "border-destructive/30 text-destructive" : ""}`}>{children}</div>;
}

function monthLabel(monthKey: string) {
  if (!monthKey) return "";
  return new Intl.DateTimeFormat("en-AU", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${monthKey}-01T12:00:00.000Z`));
}

function formatCalendarDate(day: string) {
  return new Intl.DateTimeFormat("en-AU", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${day}T12:00:00.000Z`));
}

function formatSelectedDate(day: string) {
  return day ? new Intl.DateTimeFormat("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${day}T12:00:00.000Z`)) : "Select a date";
}

function formatTime(value: string, timeZone: string) {
  return new Date(value).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit", timeZone });
}
