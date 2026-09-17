import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PosTicketService } from "./PosTicketService";

const { lookupTicket, admitTicket } = vi.hoisted(() => ({
  lookupTicket: vi.fn(),
  admitTicket: vi.fn(),
}));

vi.mock("@/services/pos.service", () => ({
  posService: { lookupTicket, admitTicket },
}));

describe("PosTicketService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("looks up without admission and requires a separate confirmation", async () => {
    const token = "a".repeat(64);
    lookupTicket.mockResolvedValue({
      result: "READY_TO_ADMIT",
      ticketNumber: "TKT-1",
      ticketType: "Adult",
      participantName: "Walk-up guest 1",
      sessionName: "10am",
    });
    admitTicket.mockResolvedValue({
      result: "ENTRY_GRANTED",
      ticketNumber: "TKT-1",
      ticketType: "Adult",
    });
    render(<PosTicketService eventId="event-1" />);

    fireEvent.change(
      screen.getByLabelText("Booking number, Ticket number or QR code"),
      {
        target: { value: token },
      },
    );
    fireEvent.click(screen.getByRole("button", { name: "Look up Ticket" }));

    await waitFor(() =>
      expect(lookupTicket).toHaveBeenCalledWith("event-1", token),
    );
    expect(admitTicket).not.toHaveBeenCalled();
    fireEvent.click(
      await screen.findByRole("button", {
        name: "Confirm and admit this Ticket",
      }),
    );
    await waitFor(() =>
      expect(admitTicket).toHaveBeenCalledWith("event-1", token),
    );
  });

  it("shows every Ticket in a Booking and admits only the selected Ticket", async () => {
    lookupTicket.mockResolvedValue({
      referenceType: "BOOKING",
      bookingNumber: "PG-1234",
      tickets: [
        {
          result: "READY_TO_ADMIT",
          ticketNumber: "TKT-1",
          ticketType: "Adult",
          participantName: "Walk-up guest 1",
        },
        {
          result: "READY_TO_ADMIT",
          ticketNumber: "TKT-2",
          ticketType: "Young Child",
          participantName: "Walk-up guest 2",
        },
      ],
    });
    admitTicket.mockResolvedValue({
      result: "ENTRY_GRANTED",
      ticketNumber: "TKT-2",
      ticketType: "Young Child",
    });
    render(<PosTicketService eventId="event-1" />);

    fireEvent.change(
      screen.getByLabelText("Booking number, Ticket number or QR code"),
      { target: { value: "pg-1234" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Look up Ticket" }));

    expect(await screen.findByText("2 Tickets")).toBeInTheDocument();
    expect(screen.getByText("Adult")).toBeInTheDocument();
    expect(screen.getByText("Young Child")).toBeInTheDocument();
    const admitButtons = screen.getAllByRole("button", {
      name: "Confirm and admit this Ticket",
    });
    fireEvent.click(admitButtons[1]);
    await waitFor(() =>
      expect(admitTicket).toHaveBeenCalledWith("event-1", "TKT-2"),
    );
    expect(admitTicket).toHaveBeenCalledTimes(1);
  });
});
