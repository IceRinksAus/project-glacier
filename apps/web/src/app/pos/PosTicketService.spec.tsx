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

    fireEvent.change(screen.getByLabelText("Ticket code"), {
      target: { value: token },
    });
    fireEvent.click(screen.getByRole("button", { name: "Look up Ticket" }));

    await waitFor(() => expect(lookupTicket).toHaveBeenCalledWith("event-1", token));
    expect(admitTicket).not.toHaveBeenCalled();
    fireEvent.click(
      await screen.findByRole("button", {
        name: "Confirm and admit this Ticket",
      }),
    );
    await waitFor(() => expect(admitTicket).toHaveBeenCalledWith("event-1", token));
  });
});
