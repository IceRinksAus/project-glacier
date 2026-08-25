import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ReportsPage from "./page";

const { getAll, create, update, replaceEvents, getEvents, getEventGroupComparison, downloadEventGroupComparisonCsv } = vi.hoisted(() => ({
  getAll: vi.fn(), create: vi.fn(), update: vi.fn(), replaceEvents: vi.fn(), getEvents: vi.fn(), getEventGroupComparison: vi.fn(), downloadEventGroupComparisonCsv: vi.fn(),
}));

vi.mock("@/services/event-group.service", () => ({ eventGroupService: { getAll, create, update, replaceEvents } }));
vi.mock("@/services/event.service", () => ({ eventService: { getEvents } }));
vi.mock("@/services/reporting.service", () => ({ reportingService: { getEventGroupComparison, downloadEventGroupComparisonCsv } }));
vi.mock("@/lib/auth", () => ({ subscribeAuthSession: () => () => undefined, getAuthRoleSnapshot: () => "OWNER", getServerAuthRoleSnapshot: () => "OWNER" }));
vi.mock("@/components/layout/PlatformShell", () => ({ PlatformShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));

const events = [
  { id: "event-1", name: "Melbourne", startDate: "2027-06-01T00:00:00.000Z" },
  { id: "event-2", name: "Sydney", startDate: "2027-07-01T00:00:00.000Z" },
];
const group = { id: "group-1", name: "Winter Season", description: "Two cities", type: "SEASON", status: "ACTIVE", events: [{ sortOrder: 0, event: { ...events[0], slug: "melbourne", status: "ACTIVE", endDate: "2027-06-10T00:00:00.000Z", timezone: "Australia/Melbourne" } }] };
const comparison = {
  group: { id: "group-1", name: "Winter Season", description: "Two cities", type: "SEASON", status: "ACTIVE" }, currency: "AUD", timezoneSemantics: "EACH_EVENT_RETAINS_ITS_OWN_TIMEZONE",
  totals: { events: 2, sessions: 10, confirmedBookings: 100, ticketUnits: 150, ticketsIssued: 150, admissions: 120, totalCapacity: 1000, grossCollected: 10000, refunded: 500, netCollected: 9500, grossProductSales: 2000, attendanceRatePercent: 80, capacityUtilisationPercent: 60, productAttachRatePercent: 40 },
  rows: [{ sortOrder: 0, event: { id: "event-1", name: "Melbourne", slug: "melbourne", status: "ACTIVE", startDate: "2027-06-01T00:00:00.000Z", endDate: "2027-06-10T00:00:00.000Z", timezone: "Australia/Melbourne" }, durationDays: 10, sessions: 6, totalCapacity: 600, reservedAttendance: 400, unusedCapacity: 200, capacityUtilisationPercent: 66.7, confirmedBookings: 60, ticketUnits: 90, ticketsIssued: 90, admissions: 72, attendanceRatePercent: 80, grossCollected: 6000, refunded: 300, netCollected: 5700, averageBookingValue: 100, ticketsPerBooking: 1.5, revenuePerSession: 950, revenuePerCapacityPlace: 9.5, bookingsWithProducts: 30, productAttachRatePercent: 50, grossProductSales: 1400, productRevenuePerAdmission: 19.44, refundRatePercent: 5, paymentExceptionCount: 1, contributionToGroupNetPercent: 60 }],
};

describe("ReportsPage Event Groups", () => {
  beforeEach(() => {
    getAll.mockReset().mockResolvedValue([group]);
    getEvents.mockReset().mockResolvedValue(events);
    create.mockReset().mockResolvedValue(group);
    replaceEvents.mockReset().mockResolvedValue(group);
    update.mockReset().mockResolvedValue(group);
    getEventGroupComparison.mockReset().mockResolvedValue(comparison);
    downloadEventGroupComparisonCsv.mockReset().mockResolvedValue({ blob: new Blob(["csv"]), filename: "comparison.csv" });
    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: vi.fn(() => "blob:report") });
    Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: vi.fn() });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    window.print = vi.fn();
  });

  it("lets an OWNER create a controlled Event Group", async () => {
    const user = userEvent.setup();
    render(<ReportsPage />);
    await screen.findByText("Winter Season");
    await user.type(screen.getByLabelText("Group name"), "East Coast Tour");
    await user.selectOptions(screen.getByLabelText("Group type"), "TOUR");
    await user.click(screen.getByRole("button", { name: "Create group" }));
    await waitFor(() => expect(create).toHaveBeenCalledWith({ name: "East Coast Tour", description: undefined, type: "TOUR" }));
  });

  it("persists selected Event membership in organiser order", async () => {
    const user = userEvent.setup();
    render(<ReportsPage />);
    await screen.findByText("Winter Season");
    await user.click(screen.getByRole("checkbox", { name: /Sydney/ }));
    await user.click(screen.getByRole("button", { name: "Move Sydney earlier" }));
    await user.click(screen.getByRole("button", { name: "Save membership" }));
    await waitFor(() => expect(replaceEvents).toHaveBeenCalledWith("group-1", ["event-2", "event-1"]));
  });

  it("shows Group totals alongside normalised Event comparison measures", async () => {
    const user = userEvent.setup();
    render(<ReportsPage />);
    await screen.findByText("Winter Season");
    await user.click(screen.getByRole("button", { name: "View comparison" }));

    expect(await screen.findByRole("heading", { name: "Event comparison scorecard" })).toBeVisible();
    expect(screen.getByText("$9,500.00")).toBeVisible();
    expect(screen.getByText("$950.00")).toBeVisible();
    expect(screen.getByText(/Each Event retains its own timezone/)).toBeVisible();
    expect(screen.getByText(/not a universal ranking/)).toBeVisible();
    expect(getEventGroupComparison).toHaveBeenCalledWith("group-1");
    await user.click(screen.getByRole("button", { name: "Export CSV" }));
    await waitFor(() => expect(downloadEventGroupComparisonCsv).toHaveBeenCalledWith("group-1"));
  });
});
