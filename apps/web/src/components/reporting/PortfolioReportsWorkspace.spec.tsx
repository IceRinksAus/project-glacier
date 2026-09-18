import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PortfolioReportsWorkspace } from "./PortfolioReportsWorkspace";

const { getPortfolioReport } = vi.hoisted(() => ({ getPortfolioReport: vi.fn() }));
vi.mock("@/services/reporting.service", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/services/reporting.service")>();
  return { ...original, reportingService: { ...original.reportingService, getPortfolioReport } };
});

const events = [
  { id: "event-1", name: "Melbourne", timezone: "Australia/Melbourne" },
  { id: "event-2", name: "Sydney", timezone: "Australia/Sydney" },
] ;
const groups = [{ id: "group-1", name: "Winter Season", status: "ACTIVE", events: [{ event: events[0] }] }];
const response = {
  generatedAt: "2027-01-01T00:00:00.000Z",
  reportType: "overview",
  scope: { type: "ALL", id: null, name: "All authorised Events" },
  filter: { date: null },
  reports: events.map((event: { id: string; name: string; timezone: string }, index: number) => ({ event, report: { event, filter: { date: null, sessionId: null, startsAt: "2027-01-01", endsAt: "2027-01-02" }, commercial: { confirmedBookings: 2, grossCollected: 100 + index * 50, refunded: 10, netCollected: 90 + index * 50, averageBookingValue: 50 }, tickets: { issued: 4, admissions: 3, attendanceRate: 75 }, bookings: { total: 2, byStatus: {} }, payments: { byStatus: {}, byMethod: [], exceptionCount: 0, exceptions: [] }, sessionChanges: { completed: 0, byReason: {} }, sessions: [] } })),
};

describe("PortfolioReportsWorkspace", () => {
  beforeEach(() => { getPortfolioReport.mockReset().mockResolvedValue(response); window.print = vi.fn(); });

  it("shows multiple Events in one organisational report", async () => {
    render(<PortfolioReportsWorkspace events={events as never} groups={groups as never} initialView="OVERVIEW" />);
    expect(await screen.findByRole("heading", { name: "Sales Summary" })).toBeVisible();
    expect(screen.getAllByText("Melbourne")[0]).toBeVisible();
    expect(screen.getAllByText("Sydney")[0]).toBeVisible();
    expect(screen.getByText("$230.00")).toBeVisible();
    expect(getPortfolioReport).toHaveBeenCalledWith("overview", "ALL", undefined, undefined, undefined);
  });

  it("selects any combination of authorised Events", async () => {
    const user = userEvent.setup();
    render(<PortfolioReportsWorkspace events={events as never} groups={groups as never} initialView="OVERVIEW" />);
    await screen.findByText("Melbourne");
    await user.click(screen.getByRole("checkbox", { name: /Sydney/ }));
    await user.click(screen.getByRole("button", { name: "Apply selection" }));
    await waitFor(() => expect(getPortfolioReport).toHaveBeenLastCalledWith("overview", "SELECTED", undefined, undefined, ["event-1"]));
  });

  it("uses an Event Group as a quick checklist selection", async () => {
    const user = userEvent.setup();
    render(<PortfolioReportsWorkspace events={events as never} groups={groups as never} initialView="OVERVIEW" />);
    await screen.findByText("Melbourne");
    await user.click(screen.getByRole("button", { name: "Clear" }));
    await user.click(screen.getByRole("button", { name: "Winter Season" }));
    expect(screen.getByRole("checkbox", { name: /Melbourne/ })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: /Sydney/ })).not.toBeChecked();
  });
});
