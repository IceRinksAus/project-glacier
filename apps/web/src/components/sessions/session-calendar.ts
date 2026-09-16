import type { Session } from "@/services/session.service";

export function dateKey(value: string | Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone,
  }).formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function initialSessionDate({
  sessions,
  eventStartDate,
  eventEndDate,
  timeZone,
  now = new Date(),
}: {
  sessions: Session[];
  eventStartDate: string;
  eventEndDate: string;
  timeZone: string;
  now?: Date;
}) {
  const today = dateKey(now, timeZone);
  const sessionDates = [...new Set(sessions.map((session) => dateKey(session.startDate, timeZone)))].sort();
  if (sessionDates.includes(today)) return today;
  const nextDate = sessionDates.find((value) => value > today);
  if (nextDate) return nextDate;
  if (sessionDates.length) return sessionDates.at(-1)!;

  const start = dateKey(eventStartDate, timeZone);
  const end = dateKey(eventEndDate, timeZone);
  if (today >= start && today <= end) return today;
  return today < start ? start : end;
}

export function capacityStatus({
  capacity,
  reservedAttendance,
  remainingCapacity,
  utilisationPercent,
}: {
  capacity: number;
  reservedAttendance: number;
  remainingCapacity: number;
  utilisationPercent: number;
}) {
  const percent = Math.max(0, Math.min(utilisationPercent, 100));
  if (remainingCapacity <= 0 || percent >= 100) {
    return { label: "Sold out", tone: "sold-out" as const, percent: 100 };
  }
  if (percent >= 80) {
    return { label: `Limited availability · ${remainingCapacity} left`, tone: "limited" as const, percent };
  }
  if (percent >= 50) {
    return { label: `${percent}% reserved`, tone: "selling" as const, percent };
  }
  return { label: "Lots available", tone: "available" as const, percent };
}

export function addMonths(monthKey: string, amount: number) {
  const [year, month] = monthKey.split("-").map(Number);
  const result = new Date(Date.UTC(year, month - 1 + amount, 1));
  return `${result.getUTCFullYear()}-${String(result.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function calendarDays(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  const first = new Date(Date.UTC(year, month - 1, 1));
  const mondayOffset = (first.getUTCDay() + 6) % 7;
  const start = new Date(first);
  start.setUTCDate(first.getUTCDate() - mondayOffset);
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start);
    day.setUTCDate(start.getUTCDate() + index);
    return day.toISOString().slice(0, 10);
  });
}
