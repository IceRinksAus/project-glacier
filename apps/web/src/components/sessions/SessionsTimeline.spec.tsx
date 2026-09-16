import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SessionsTimeline } from "./SessionsTimeline";

const { refresh, getEventReport } = vi.hoisted(() => ({ refresh: vi.fn(), getEventReport: vi.fn() }));

const sessions = [
  { id: "morning", name: "Morning Session", startDate: "2027-06-25T00:00:00.000Z", endDate: "2027-06-25T02:00:00.000Z", capacity: 100, status: "ACTIVE", salesStart: null, salesEnd: null, eventId: "event-1", scheduleExceptionType: "NONE" },
  { id: "afternoon", name: "Afternoon Session", startDate: "2027-06-25T04:00:00.000Z", endDate: "2027-06-25T06:00:00.000Z", capacity: 100, status: "ACTIVE", salesStart: null, salesEnd: null, eventId: "event-1", scheduleExceptionType: "MODIFIED" },
  { id: "tomorrow", name: "Tomorrow Session", startDate: "2027-06-26T00:00:00.000Z", endDate: "2027-06-26T02:00:00.000Z", capacity: 100, status: "DRAFT", salesStart: null, salesEnd: null, eventId: "event-1", scheduleExceptionType: "NONE" },
];

vi.mock("@/hooks/useSessions", () => ({ useSessions: () => ({ sessions, isLoading: false, error: "", refresh }) }));
vi.mock("@/services/reporting.service", () => ({ reportingService: { getEventReport } }));
vi.mock("./SessionDetailPanel", () => ({ SessionDetailPanel: () => null }));

describe("SessionsTimeline", () => {
  beforeEach(() => {
    refresh.mockReset();
    refresh.mockResolvedValue(undefined);
    getEventReport.mockReset();
    getEventReport.mockResolvedValue({
      sessions: [
        { id: "morning", name: "Morning Session", startDate: sessions[0].startDate, endDate: sessions[0].endDate, status: "ACTIVE", capacity: 100, reservedAttendance: 10, confirmedAttendance: 10, remainingCapacity: 90, utilisationPercent: 10, ticketsIssued: 10, admissions: 0 },
        { id: "afternoon", name: "Afternoon Session", startDate: sessions[1].startDate, endDate: sessions[1].endDate, status: "ACTIVE", capacity: 100, reservedAttendance: 90, confirmedAttendance: 90, remainingCapacity: 10, utilisationPercent: 90, ticketsIssued: 90, admissions: 0 },
        { id: "tomorrow", name: "Tomorrow Session", startDate: sessions[2].startDate, endDate: sessions[2].endDate, status: "DRAFT", capacity: 100, reservedAttendance: 100, confirmedAttendance: 100, remainingCapacity: 0, utilisationPercent: 100, ticketsIssued: 100, admissions: 0 },
      ],
    });
  });

  it("shows a selected-day agenda with authoritative availability", async () => {
    render(<SessionsTimeline eventId="event-1" eventStartDate="2027-06-20T00:00:00.000Z" eventEndDate="2027-06-30T23:59:59.000Z" eventTimezone="Australia/Melbourne" />);

    expect(await screen.findByText("Morning Session")).toBeVisible();
    expect(screen.getByText("Lots available")).toBeVisible();
    expect(screen.getByText("Limited availability · 10 left")).toBeVisible();
    expect(screen.getByText("1", { selector: "dd" })).toBeVisible();
    expect(screen.getByRole("progressbar", { name: "Morning Session reserved capacity" })).toHaveAttribute("aria-valuenow", "10");
    expect(screen.queryByText("Tomorrow Session")).not.toBeInTheDocument();
  });

  it("changes date and exposes sold-out status without relying on colour", async () => {
    render(<SessionsTimeline eventId="event-1" eventStartDate="2027-06-20T00:00:00.000Z" eventEndDate="2027-06-30T23:59:59.000Z" eventTimezone="Australia/Melbourne" />);
    await screen.findByText("Morning Session");

    fireEvent.click(screen.getByRole("button", { name: /26 June 2027, 1 Sessions/ }));
    expect(screen.getByText("Tomorrow Session")).toBeVisible();
    expect(screen.getByText("Sold out")).toBeVisible();
    expect(screen.getByText("100 of 100 reserved")).toBeVisible();
  });

  it("refreshes Session and reporting data together", async () => {
    render(<SessionsTimeline eventId="event-1" eventStartDate="2027-06-20T00:00:00.000Z" eventEndDate="2027-06-30T23:59:59.000Z" eventTimezone="Australia/Melbourne" />);
    await screen.findByText("Morning Session");
    fireEvent.click(screen.getByRole("button", { name: "Refresh availability" }));

    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
    expect(getEventReport).toHaveBeenCalledTimes(2);
  });
});
