import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import BookingsPage from "./page";

const { search, getEvents, getSessions } = vi.hoisted(() => ({
  search: vi.fn(),
  getEvents: vi.fn(),
  getSessions: vi.fn(),
}));

vi.mock("@/services/booking-operations.service", () => ({
  bookingOperationsService: { search },
}));

vi.mock("@/services/event.service", () => ({
  eventService: { getEvents },
}));

vi.mock("@/services/session.service", () => ({
  sessionService: { getSessions },
}));

vi.mock("@/components/layout/PlatformShell", () => ({
  PlatformShell: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

const booking = {
  id: "booking-1",
  bookingNumber: "PG-1234",
  status: "CONFIRMED",
  source: "ONLINE",
  paymentStatus: "PAID",
  total: 74,
  createdAt: "2026-08-24T03:45:00.000Z",
  customer: {
    firstName: "Jamie",
    lastName: "Stoller",
    email: "jamie@example.com",
  },
  event: {
    id: "event-1",
    name: "Winter Festival",
  },
  session: {
    id: "session-1",
    name: "10:00 session",
    startDate: "2026-08-24T00:00:00.000Z",
  },
};

describe("BookingsPage", () => {
  beforeEach(() => {
    search.mockReset();
    getEvents.mockReset();
    getSessions.mockReset();

    search.mockResolvedValue({
      items: [booking],
      pagination: {
        page: 1,
        pageSize: 25,
        totalItems: 1,
        totalPages: 1,
      },
    });
    getEvents.mockResolvedValue([
      {
        id: "event-1",
        name: "Winter Festival",
      },
    ]);
    getSessions.mockResolvedValue([
      {
        id: "session-1",
        name: "10:00 session",
        startDate: "2026-08-24T00:00:00.000Z",
      },
    ]);
  });

  it("loads a bounded default result and exposes operational filters", async () => {
    render(<BookingsPage />);

    expect(
      await screen.findByRole("link", { name: "PG-1234" }),
    ).toHaveAttribute("href", "/bookings/booking-1");
    expect(screen.getByText("jamie@example.com")).toBeVisible();
    expect(screen.getByText("1 Booking found")).toBeVisible();
    expect(
      screen.getByRole("combobox", { name: "Session" }),
    ).toBeDisabled();

    expect(search).toHaveBeenCalledWith(
      expect.objectContaining({
        sortBy: "createdAt",
        sortDirection: "desc",
        page: 1,
        pageSize: 25,
      }),
    );
  });

  it("searches customer details and filters inside a selected Session", async () => {
    const user = userEvent.setup();
    render(<BookingsPage />);
    await screen.findByRole("link", { name: "PG-1234" });

    await user.type(
      screen.getByRole("textbox", { name: "Search bookings" }),
      "jamie@example.com",
    );
    await user.click(screen.getByRole("button", { name: "Search" }));

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Event" }),
      "event-1",
    );
    await waitFor(() =>
      expect(getSessions).toHaveBeenCalledWith("event-1"),
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Session" }),
      "session-1",
    );

    await waitFor(() =>
      expect(search).toHaveBeenLastCalledWith(
        expect.objectContaining({
          search: "jamie@example.com",
          eventId: "event-1",
          sessionId: "session-1",
        }),
      ),
    );
  });
});
