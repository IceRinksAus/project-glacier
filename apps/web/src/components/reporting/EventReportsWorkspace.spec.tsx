import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { EventReportsWorkspace } from "./EventReportsWorkspace";

const { getEventReport, getTicketTypeSales, getSessionSales, getProductSales, getSessions } = vi.hoisted(() => ({
  getEventReport: vi.fn(),
  getTicketTypeSales: vi.fn(),
  getSessionSales: vi.fn(),
  getProductSales: vi.fn(),
  getSessions: vi.fn(),
}));

vi.mock("@/services/reporting.service", () => ({ reportingService: { getEventReport, getTicketTypeSales, getSessionSales, getProductSales } }));
vi.mock("@/services/session.service", () => ({ sessionService: { getSessions } }));

const report = {
  event: { id: "event-1", name: "Winter Festival", status: "ACTIVE", startDate: "2027-08-31T14:00:00.000Z", endDate: "2027-09-05T13:59:59.999Z", timezone: "Australia/Melbourne" },
  filter: { date: null, sessionId: null, startsAt: "2027-08-31T14:00:00.000Z", endsAt: "2027-09-05T13:59:59.999Z" },
  commercial: { confirmedBookings: 4, grossCollected: 220, refunded: 20, netCollected: 200, averageBookingValue: 55 },
  tickets: { issued: 6, admissions: 3, attendanceRate: 50 },
  bookings: { total: 4, byStatus: { CONFIRMED: 4 } },
  payments: { byStatus: { SUCCEEDED: 4 }, exceptionCount: 1, exceptions: [{ bookingId: "booking-1", bookingNumber: "PG-1234", latestReconciliation: { succeeded: false, outcome: "PROVIDER_UNAVAILABLE", attemptedAt: "2027-09-01T00:00:00.000Z" } }] },
  sessions: [{ id: "session-1", name: "Morning skate", status: "ACTIVE", startDate: "2027-09-01T00:30:00.000Z", endDate: "2027-09-01T01:30:00.000Z", capacity: 150, reservedAttendance: 60, confirmedAttendance: 50, remainingCapacity: 90, utilisationPercent: 40, ticketsIssued: 50, admissions: 30 }],
};

const ticketTypeReport = {
  event: { id: "event-1", name: "Winter Festival", timezone: "Australia/Melbourne" },
  filter: { date: null, sessionId: null },
  totals: { unitsSold: 6, grossItemSales: 180, ticketsIssued: 6, admissions: 3 },
  refundAllocation: "UNALLOCATED_AT_EVENT_OR_SESSION_LEVEL",
  rows: [{ id: "ticket-type-1", name: "Adult", active: true, unitsSold: 4, grossItemSales: 140, unitSharePercent: 66.67, ticketsIssued: 4, admissions: 2 }],
};

const sessionSalesReport = {
  event: { id: "event-1", name: "Winter Festival", timezone: "Australia/Melbourne" },
  filter: { date: null, sessionId: null },
  rows: [{ id: "session-1", name: "Morning skate", status: "ACTIVE", startDate: "2027-09-01T00:30:00.000Z", endDate: "2027-09-01T01:30:00.000Z", capacity: 150, confirmedBookings: 4, confirmedBookingValue: 220, grossCollected: 220, refunded: 20, netCollected: 200, ticketUnits: 6, ticketsIssued: 6, admissions: 3, reservedAttendance: 60, remainingCapacity: 90, utilisationPercent: 40 }],
};

const productSalesReport = {
  event: { id: "event-1", name: "Winter Festival", timezone: "Australia/Melbourne" },
  filter: { date: null, sessionId: null },
  definitions: { inventoryScope: "EVENT_CURRENT_RESERVED_AND_CONFIRMED", refundAllocation: "UNALLOCATED_AT_EVENT_OR_SESSION_LEVEL" },
  totals: { confirmedBookings: 4, bookingsWithProducts: 2, attachRatePercent: 50, unitsSold: 3, grossItemSales: 70 },
  rows: [{
    id: "kanga", name: "Kanga", slug: "kanga", status: "ACTIVE", group: { id: "group-1", name: "Skating aids", sortOrder: 0 }, requiredByRule: true,
    unitsSold: 2, grossItemSales: 10, bookingCount: 2, attachRatePercent: 50,
    inventory: { tracked: false, quantity: null, committed: null, remaining: null, sellThroughPercent: null },
    capacity: { controlled: true, defaultLimit: 30, peakSession: { sessionId: "session-1", sessionName: "Morning skate", startDate: "2027-09-01T00:30:00.000Z", limit: 20, reserved: 18, remaining: 2, utilisationPercent: 90 } },
    variants: [],
  }, {
    id: "hoodie", name: "Hoodie", slug: "hoodie", status: "ACTIVE", group: { id: "group-2", name: "Merchandise", sortOrder: 1 }, requiredByRule: false,
    unitsSold: 1, grossItemSales: 60, bookingCount: 1, attachRatePercent: 25,
    inventory: { tracked: false, quantity: null, committed: null, remaining: null, sellThroughPercent: null }, capacity: { controlled: false, defaultLimit: null, peakSession: null },
    variants: [{ id: "small", name: "Small", status: "ACTIVE", inventoryTracked: true, inventoryQuantity: 50, unitsSold: 1, grossItemSales: 60, inventoryCommitted: 4, inventoryRemaining: 46, sellThroughPercent: 8 }],
  }],
};

describe("EventReportsWorkspace", () => {
  beforeEach(() => {
    getEventReport.mockReset().mockResolvedValue(report);
    getTicketTypeSales.mockReset().mockResolvedValue(ticketTypeReport);
    getSessionSales.mockReset().mockResolvedValue(sessionSalesReport);
    getProductSales.mockReset().mockResolvedValue(productSalesReport);
    getSessions.mockReset().mockResolvedValue([{ id: "session-1", eventId: "event-1", name: "Morning skate", startDate: "2027-09-01T00:30:00.000Z", endDate: "2027-09-01T01:30:00.000Z", capacity: 150, status: "ACTIVE", salesStart: null, salesEnd: null }]);
  });

  it("shows authoritative commercial, attendance, capacity and exception details", async () => {
    render(<EventReportsWorkspace eventId="event-1" />);

    expect(await screen.findByText("$200.00")).toBeVisible();
    expect(screen.getByText("50%")).toBeVisible();
    expect(screen.getByText("40%")).toBeVisible();
    expect(screen.getByRole("link", { name: /PG-1234/ })).toHaveAttribute("href", "/bookings/booking-1");
    expect(screen.getByText(/not accounting, settlement/)).toBeVisible();
  });

  it("applies exact Event-local date and Session filters and can clear them", async () => {
    const user = userEvent.setup();
    render(<EventReportsWorkspace eventId="event-1" />);
    await screen.findByText("$200.00");

    await user.type(screen.getByLabelText("Event-local date"), "2027-09-01");
    await user.selectOptions(screen.getByLabelText("Session"), "session-1");
    await user.click(screen.getByRole("button", { name: "Apply filters" }));

    await waitFor(() => expect(getEventReport).toHaveBeenLastCalledWith("event-1", { date: "2027-09-01", sessionId: "session-1" }));

    await user.click(screen.getByRole("button", { name: "Clear" }));
    await waitFor(() => expect(getEventReport).toHaveBeenLastCalledWith("event-1", {}));
  });

  it("shows Ticket Type sales and applies the shared filters", async () => {
    const user = userEvent.setup();
    render(<EventReportsWorkspace eventId="event-1" />);
    await screen.findByText("$200.00");

    await user.type(screen.getByLabelText("Event-local date"), "2027-09-01");
    await user.selectOptions(screen.getByLabelText("Session"), "session-1");
    await user.selectOptions(screen.getByLabelText("Report"), "TICKET_TYPES");

    await waitFor(() => expect(getTicketTypeSales).toHaveBeenLastCalledWith("event-1", { date: "2027-09-01", sessionId: "session-1" }));
    expect(await screen.findByRole("heading", { name: "Sales by Ticket Type" })).toBeVisible();
    expect(screen.getByText("Adult")).toBeVisible();
    expect(screen.getByText(/not allocated to, or subtracted from/)).toBeVisible();
  });

  it("shows Session commercial performance and shared capacity", async () => {
    const user = userEvent.setup();
    render(<EventReportsWorkspace eventId="event-1" />);
    await screen.findByText("$200.00");

    await user.selectOptions(screen.getByLabelText("Report"), "SESSIONS");

    expect(await screen.findByRole("heading", { name: "Sales by Session" })).toBeVisible();
    expect(screen.getAllByText("$220.00")).toHaveLength(2);
    expect(screen.getByText(/capacity is shared across Ticket Types/)).toBeVisible();
    expect(getSessionSales).toHaveBeenLastCalledWith("event-1", {});
  });

  it("separates finite Variant inventory from reusable Product capacity", async () => {
    const user = userEvent.setup();
    render(<EventReportsWorkspace eventId="event-1" />);
    await screen.findByText("$200.00");

    await user.selectOptions(screen.getByLabelText("Report"), "PRODUCTS");

    expect(await screen.findByRole("heading", { name: "Product and Variant sales" })).toBeVisible();
    expect(screen.getByText("Required by active Rule")).toBeVisible();
    expect(screen.getByText(/18 of 20 reserved/)).toBeVisible();
    expect(screen.getByText(/46 of 50 remaining/)).toBeVisible();
    expect(screen.getByText(/does not reduce rink admission capacity/)).toBeVisible();
    expect(getProductSales).toHaveBeenLastCalledWith("event-1", {});
  });
});
