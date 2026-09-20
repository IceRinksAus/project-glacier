import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import CustomersPage from "./page";
import { CustomersWorkspace } from "@/components/customers/CustomersWorkspace";

const { search, getEvents } = vi.hoisted(() => ({
  search: vi.fn(),
  getEvents: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("eventId=event-1"),
  usePathname: () => "/customers",
  useRouter: () => ({ replace: vi.fn() }),
}));

vi.mock("@/services/customer.service", () => ({
  customerService: { search },
}));

vi.mock("@/services/event.service", () => ({
  eventService: { getEvents },
}));

describe("CustomersPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getEvents.mockResolvedValue([
      { id: "event-1", name: "Fictional Festival" },
    ]);
    search.mockResolvedValue({
      items: [
        {
          id: "customer-1",
          firstName: "Taylor",
          lastName: "Example",
          email: "taylor@example.test",
          phone: "0400001234",
          bookingCount: 2,
          latestBooking: {
            id: "booking-1",
            bookingNumber: "GLA-TEST-1",
            createdAt: "2026-09-17T00:00:00Z",
            event: { id: "event-1", name: "Fictional Festival" },
          },
        },
      ],
      pagination: { page: 1, pageSize: 25, totalItems: 1, totalPages: 1 },
    });
  });

  it("loads the Event-scoped Customer workspace and masks list phone details", async () => {
    render(<CustomersPage />);

    expect(await screen.findByText("Taylor Example")).toBeInTheDocument();
    expect(screen.getByText("•••• 1234")).toBeInTheDocument();
    await waitFor(() =>
      expect(search).toHaveBeenCalledWith({
        eventId: "event-1",
        page: 1,
        pageSize: 25,
      }),
    );
  });

  it("keeps the embedded Event Customer workspace permanently scoped", async () => {
    render(<CustomersWorkspace fixedEventId="event-1" fixedEventName="Fictional Festival" embedded />);
    expect(await screen.findByText("Taylor Example")).toBeVisible();
    expect(screen.getByText("Event scope")).toBeVisible();
    expect(screen.queryByRole("combobox", { name: "Event" })).not.toBeInTheDocument();
    expect(getEvents).not.toHaveBeenCalled();
    await waitFor(() => expect(search).toHaveBeenCalledWith({ eventId: "event-1", page: 1, pageSize: 25 }));
  });
});
