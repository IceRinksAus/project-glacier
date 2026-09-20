import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TicketAdjustmentPanel } from "./TicketAdjustmentPanel";

const { context, preview, execute } = vi.hoisted(() => ({
  context: vi.fn(),
  preview: vi.fn(),
  execute: vi.fn(),
}));

vi.mock("@/services/ticket-adjustment.service", () => ({
  ticketAdjustmentService: { context, preview, execute },
}));

describe("TicketAdjustmentPanel", () => {
  beforeEach(() => {
    context.mockReset();
    preview.mockReset();
    execute.mockReset();
    context.mockResolvedValue({
      bookingId: "booking-1",
      bookingNumber: "PG-1234",
      tickets: [
        {
          id: "ticket-1",
          ticketNumber: "TKT-1",
          participantName: "Fictional Guest",
          ticketTypeName: "Adult",
          status: "VALID",
          checkedInAt: null,
          eligible: true,
          unitValue: 20,
        },
      ],
      adjustments: [],
    });
  });

  it("explains inside the text box why refund review is disabled", async () => {
    render(<TicketAdjustmentPanel bookingId="booking-1" />);

    expect(
      await screen.findByPlaceholderText(
        "An explanation is required before you can review this cancellation or refund.",
      ),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Review adjustment" }),
    ).toBeDisabled();
  });
});
