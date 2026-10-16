import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getTicket, ticketQrUrl } = vi.hoisted(() => ({
  getTicket: vi.fn(),
  ticketQrUrl: vi.fn(() => "http://localhost:3000/ticket-qr"),
}));

vi.mock("@/services/public-booking.service", () => ({
  publicBookingService: { getTicket, ticketQrUrl },
}));

import PublicTicketPage from "./page";

describe("PublicTicketPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.print = vi.fn();
  });

  it("lets the customer print or save an active Ticket as PDF", async () => {
    getTicket.mockResolvedValue({
      ticketNumber: "TKT-1-ABCDEF",
      status: "ACTIVE",
      participant: { firstName: "Alex", lastName: "Test" },
      booking: {
        event: { name: "Test Event" },
        session: {
          name: "10am",
          startDate: "2027-07-01T00:00:00.000Z",
          endDate: "2027-07-01T02:00:00.000Z",
        },
      },
      originalRescheduleMapping: null,
    });

    await act(async () => {
      render(
        <PublicTicketPage params={Promise.resolve({ token: "gt1-token" })} />,
      );
    });

    expect(
      await screen.findByRole("heading", { name: "Test Event" }),
    ).toBeVisible();
    expect(
      screen.getByRole("img", { name: "Entry QR code for Alex Test" }),
    ).toHaveAttribute("src", "http://localhost:3000/ticket-qr");

    await userEvent.click(
      screen.getByRole("button", { name: "Print / Save PDF" }),
    );
    expect(window.print).toHaveBeenCalled();
  });
});
