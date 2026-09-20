"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { addMonths, calendarDays } from "@/components/sessions/session-calendar";

export interface PublicBookingDate {
  key: string;
  label: string;
  sessionCount: number;
}

interface Props {
  dates: PublicBookingDate[];
  selectedDateKey: string | null;
  onSelect: (dateKey: string) => void;
  todayKey: string;
}

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function PublicBookingCalendar({ dates, selectedDateKey, onSelect, todayKey }: Props) {
  const availableByDate = useMemo(
    () => new Map(dates.filter((date) => date.key >= todayKey).map((date) => [date.key, date])),
    [dates, todayKey],
  );
  const availableKeys = useMemo(() => [...availableByDate.keys()].sort(), [availableByDate]);
  const defaultDate = availableByDate.has(todayKey)
    ? todayKey
    : availableKeys.find((key) => key > todayKey) ?? null;
  const effectiveSelection = selectedDateKey && availableByDate.has(selectedDateKey)
    ? selectedDateKey
    : defaultDate;
  const firstMonth = availableKeys[0]?.slice(0, 7) ?? todayKey.slice(0, 7);
  const lastMonth = availableKeys.at(-1)?.slice(0, 7) ?? firstMonth;
  const [displayMonth, setDisplayMonth] = useState(
    (effectiveSelection ?? availableKeys[0] ?? todayKey).slice(0, 7),
  );

  useEffect(() => {
    if (defaultDate && !selectedDateKey) onSelect(defaultDate);
  }, [defaultDate, onSelect, selectedDateKey]);

  const selectedDate = effectiveSelection ? availableByDate.get(effectiveSelection) : null;

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
      <section className="rounded-2xl border border-slate-200 p-4 sm:p-6" aria-label="Available booking dates">
        <div className="flex items-center justify-between gap-3">
          <button type="button" aria-label="Previous month" disabled={displayMonth <= firstMonth} onClick={() => setDisplayMonth(addMonths(displayMonth, -1))} className="rounded-xl border border-slate-200 p-2 disabled:opacity-30">
            <ChevronLeft className="size-5" />
          </button>
          <h2 className="text-lg font-bold">{monthLabel(displayMonth)}</h2>
          <button type="button" aria-label="Next month" disabled={displayMonth >= lastMonth} onClick={() => setDisplayMonth(addMonths(displayMonth, 1))} className="rounded-xl border border-slate-200 p-2 disabled:opacity-30">
            <ChevronRight className="size-5" />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-7 gap-1 text-center sm:gap-2">
          {weekDays.map((day) => <span key={day} className="pb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">{day}</span>)}
          {calendarDays(displayMonth).map((day) => {
            const inMonth = day.startsWith(displayMonth);
            const date = availableByDate.get(day);
            const selected = day === effectiveSelection;
            const isPast = day < todayKey;
            return (
              <button
                key={day}
                type="button"
                disabled={!inMonth || !date || isPast}
                aria-pressed={selected}
                aria-label={date ? `${date.label}, ${date.sessionCount} ${date.sessionCount === 1 ? "Session" : "Sessions"} available` : `${longDate(day)}, unavailable`}
                onClick={() => date && onSelect(day)}
                className={`relative aspect-square rounded-xl border text-sm transition disabled:border-transparent disabled:bg-transparent disabled:text-slate-300 ${selected ? "border-slate-950 bg-slate-950 font-bold text-white" : date ? "border-sky-200 bg-sky-50 font-semibold text-slate-950 hover:border-sky-500" : "border-transparent"}`}
              >
                {Number(day.slice(-2))}
                {date ? <span aria-hidden className={`absolute bottom-1.5 left-1/2 size-1 -translate-x-1/2 rounded-full ${selected ? "bg-white" : "bg-sky-600"}`} /> : null}
              </button>
            );
          })}
        </div>
        <p className="mt-4 text-xs text-slate-500">Highlighted dates have Sessions available. Unavailable and past dates cannot be selected.</p>
      </section>

      <aside className="rounded-2xl bg-slate-50 p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Selected date</p>
        {selectedDate ? (
          <>
            <p className="mt-3 text-lg font-bold">{selectedDate.label}</p>
            <p className="mt-2 text-sm text-slate-600">{selectedDate.sessionCount} {selectedDate.sessionCount === 1 ? "Session" : "Sessions"} available</p>
          </>
        ) : <p className="mt-3 text-sm text-slate-600">No future booking dates are currently available.</p>}
      </aside>
    </div>
  );
}

function monthLabel(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Intl.DateTimeFormat("en-AU", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(year, month - 1, 1)));
}

function longDate(day: string) {
  return new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${day}T00:00:00.000Z`));
}
