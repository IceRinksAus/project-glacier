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
  filter: { date: null, from: null, to: null },
  reports: events.map((event: { id: string; name: string; timezone: string }, index: number) => ({ event, report: { event, filter: { date: null, sessionId: null, startsAt: "2027-01-01", endsAt: "2027-01-02" }, commercial: { confirmedBookings: 2, grossCollected: 100 + index * 50, refunded: 10, netCollected: 90 + index * 50, averageBookingValue: 50 }, tickets: { issued: 4, admissions: 3, attendanceRate: 75 }, bookings: { total: 2, byStatus: {} }, payments: { byStatus: {}, byMethod: [], exceptionCount: 0, exceptions: [] }, sessionChanges: { completed: 0, byReason: {} }, sessions: [] } })),
};

describe("PortfolioReportsWorkspace", () => {
  beforeEach(() => { getPortfolioReport.mockReset().mockResolvedValue(response); window.print = vi.fn(); });

  it("shows multiple Events in one organisational report", async () => {
    render(<PortfolioReportsWorkspace events={events as never} groups={groups as never} initialView="OVERVIEW" />);
    expect(await screen.findByRole("heading", { name: "Sales Summary" })).toBeVisible();
    expect(screen.getByText("Report setup")).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Generate report" }));
    expect(await screen.findByText("Report result")).toBeVisible();
    expect(screen.getAllByText("Melbourne")[0]).toBeVisible();
    expect(screen.getAllByText("Sydney")[0]).toBeVisible();
    expect(screen.getByText("$230.00")).toBeVisible();
    expect(getPortfolioReport).toHaveBeenCalledWith("overview", "ALL", undefined, undefined, undefined, undefined);
  });

  it("selects any combination of authorised Events", async () => {
    const user = userEvent.setup();
    render(<PortfolioReportsWorkspace events={events as never} groups={groups as never} initialView="OVERVIEW" />);
    await user.click(screen.getByRole("checkbox", { name: /Sydney/ }));
    await user.click(screen.getByRole("button", { name: "Generate report" }));
    await waitFor(() => expect(getPortfolioReport).toHaveBeenLastCalledWith("overview", "SELECTED", undefined, undefined, undefined, ["event-1"]));
  });

  it("uses an Event Group as a quick checklist selection", async () => {
    const user = userEvent.setup();
    render(<PortfolioReportsWorkspace events={events as never} groups={groups as never} initialView="OVERVIEW" />);
    await user.click(screen.getByRole("button", { name: "Clear" }));
    await user.click(screen.getByRole("button", { name: "Winter Season" }));
    expect(screen.getByRole("checkbox", { name: /Melbourne/ })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: /Sydney/ })).not.toBeChecked();
  });

  it("returns from a result to the same report settings", async () => {
    const user = userEvent.setup();
    render(<PortfolioReportsWorkspace events={events as never} groups={groups as never} initialView="OVERVIEW" />);
    await user.click(screen.getByRole("checkbox", { name: /Sydney/ }));
    await user.click(screen.getByRole("button", { name: "Generate report" }));
    expect(await screen.findByText("Report result")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Change report settings" }));
    expect(screen.getByText("Report setup")).toBeVisible();
    expect(screen.getByRole("checkbox", { name: /Sydney/ })).not.toBeChecked();
  });

  it("searches Events and applies a persistent Event-local date range", async () => {
    const user = userEvent.setup();
    render(<PortfolioReportsWorkspace events={events as never} groups={groups as never} initialView="OVERVIEW" />);
    await user.type(screen.getByRole("searchbox", { name: "Find an Event" }), "Syd");
    expect(screen.queryByRole("checkbox", { name: /Melbourne/ })).not.toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: /Sydney/ })).toBeVisible();
    await user.type(screen.getByLabelText("Portfolio from date"), "2027-06-01");
    await user.type(screen.getByLabelText("Portfolio to date"), "2027-06-30");
    await user.click(screen.getByRole("button", { name: "Generate report" }));
    await waitFor(() => expect(getPortfolioReport).toHaveBeenCalledWith("overview", "ALL", undefined, "2027-06-01", "2027-06-30", undefined));
    expect(window.location.search).toContain("from=2027-06-01");
    expect(window.location.search).toContain("stage=result");
  });

  it("restores a selected Event scope from URL-derived inputs", () => {
    render(<PortfolioReportsWorkspace events={events as never} groups={groups as never} initialView="OVERVIEW" initialScope="SELECTED:event-2" initialFrom="2027-07-01" initialTo="2027-07-02" />);
    expect(screen.getByRole("checkbox", { name: /Melbourne/ })).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: /Sydney/ })).toBeChecked();
    expect(screen.getByLabelText("Portfolio from date")).toHaveValue("2027-07-01");
  });
});
