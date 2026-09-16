import { describe, expect, it } from "vitest";

import type { Session } from "@/services/session.service";

import { calendarDays, capacityStatus, dateKey, initialSessionDate } from "./session-calendar";

const session = (id: string, startDate: string): Session => ({
  id,
  name: id,
  startDate,
  endDate: startDate,
  capacity: 100,
  status: "ACTIVE",
  salesStart: null,
  salesEnd: null,
  eventId: "event-1",
});

describe("session calendar contracts", () => {
  it("creates date keys in the Event timezone", () => {
    expect(dateKey("2027-06-25T14:30:00.000Z", "Australia/Melbourne")).toBe("2027-06-26");
  });

  it("defaults to today, then the next Session, then the latest past Session", () => {
    const sessions = [session("today", "2027-06-26T00:00:00.000Z"), session("next", "2027-06-27T00:00:00.000Z")];
    const common = { sessions, eventStartDate: "2027-06-20T00:00:00.000Z", eventEndDate: "2027-06-30T00:00:00.000Z", timeZone: "Australia/Melbourne" };
    expect(initialSessionDate({ ...common, now: new Date("2027-06-26T04:00:00.000Z") })).toBe("2027-06-26");
    expect(initialSessionDate({ ...common, sessions: sessions.slice(1), now: new Date("2027-06-26T04:00:00.000Z") })).toBe("2027-06-27");
    expect(initialSessionDate({ ...common, now: new Date("2027-07-01T04:00:00.000Z") })).toBe("2027-06-27");
  });

  it("uses accessible capacity thresholds", () => {
    expect(capacityStatus({ capacity: 100, reservedAttendance: 10, remainingCapacity: 90, utilisationPercent: 10 })).toMatchObject({ label: "Lots available", tone: "available" });
    expect(capacityStatus({ capacity: 100, reservedAttendance: 50, remainingCapacity: 50, utilisationPercent: 50 })).toMatchObject({ label: "50% reserved", tone: "selling" });
    expect(capacityStatus({ capacity: 100, reservedAttendance: 90, remainingCapacity: 10, utilisationPercent: 90 })).toMatchObject({ label: "Limited availability · 10 left", tone: "limited" });
    expect(capacityStatus({ capacity: 100, reservedAttendance: 100, remainingCapacity: 0, utilisationPercent: 100 })).toMatchObject({ label: "Sold out", tone: "sold-out" });
  });

  it("builds a Monday-first six-week calendar", () => {
    const days = calendarDays("2027-06");
    expect(days).toHaveLength(42);
    expect(days[0]).toBe("2027-05-31");
    expect(days[41]).toBe("2027-07-11");
  });
});
