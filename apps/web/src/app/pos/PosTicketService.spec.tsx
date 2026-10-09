import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PosTicketService } from "./PosTicketService";

const { lookupTicket, admitTicket, lookupProductPass, collectProductPass } = vi.hoisted(() => ({
  lookupTicket: vi.fn(),
  admitTicket: vi.fn(),
  lookupProductPass: vi.fn(),
  collectProductPass: vi.fn(),
}));

vi.mock("@/services/pos.service", () => ({
  posService: { lookupTicket, admitTicket, lookupProductPass, collectProductPass },
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
      screen.getByLabelText("Booking, Ticket or Product Pass number, or QR code"),
      {
        target: { value: token },
      },
    );
    fireEvent.click(screen.getByRole("button", { name: "Look up" }));

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
      screen.getByLabelText("Booking, Ticket or Product Pass number, or QR code"),
      { target: { value: "pg-1234" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Look up" }));

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

  it("looks up and deliberately collects a Product Pass without granting admission", async () => {
    lookupProductPass.mockResolvedValue({
      kind: "PRODUCT_COLLECTION_PASS",
      passNumber: "PRD-1234-ABCDEF",
      status: "ACTIVE",
      productName: "Kanga",
      variantName: null,
      quantity: 1,
      bookingNumber: "PG-1234",
      event: { name: "Test Event" },
      session: { name: "10am" },
      grantsAdmission: false,
    });
    collectProductPass.mockResolvedValue({
      kind: "PRODUCT_COLLECTION_PASS",
      passNumber: "PRD-1234-ABCDEF",
      status: "COLLECTED",
      productName: "Kanga",
      variantName: null,
      quantity: 1,
      bookingNumber: "PG-1234",
      event: { name: "Test Event" },
      session: { name: "10am" },
      grantsAdmission: false,
    });
    render(<PosTicketService eventId="event-1" />);

    fireEvent.change(
      screen.getByLabelText("Booking, Ticket or Product Pass number, or QR code"),
      { target: { value: "prd-1234-abcdef" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Look up" }));

    expect(await screen.findByText("Kanga × 1")).toBeInTheDocument();
    expect(lookupProductPass).toHaveBeenCalledWith(
      "event-1",
      "PRD-1234-ABCDEF",
    );
    expect(admitTicket).not.toHaveBeenCalled();

    fireEvent.click(
      screen.getByRole("button", { name: "Confirm Product collection" }),
    );
    await waitFor(() =>
      expect(collectProductPass).toHaveBeenCalledWith(
        "event-1",
        "PRD-1234-ABCDEF",
      ),
    );
    expect(await screen.findByText("COLLECTED")).toBeInTheDocument();
  });
});
