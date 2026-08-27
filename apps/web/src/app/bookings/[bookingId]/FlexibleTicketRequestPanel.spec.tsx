import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  operatorContext: vi.fn(),
  review: vi.fn(),
  previewDecision: vi.fn(),
  executeDecision: vi.fn(),
}));

vi.mock("@/services/flexible-ticket-request.service", () => ({
  flexibleTicketRequestService: mocks,
}));

import { FlexibleTicketRequestPanel } from "./FlexibleTicketRequestPanel";

const request = {
  requestNumber: "FTR-1",
  type: "REFUND",
  status: "SUBMITTED",
  customerReason: "CHANGE_OF_PLANS",
  customerNote: "Please review.",
  submittedAt: "2027-08-01T00:00:00.000Z",
  reviewedAt: null,
  decidedAt: null,
  completedAt: null,
  failedAt: null,
  expiredAt: null,
  destinationSession: null,
  items: [
    {
      participantName: "Taylor Adult",
      ticketNumber: "TKT-1",
      ticketTypeName: "Adult",
      ticketValue: 24,
      flexibleFee: 5,
      currency: "AUD",
      cutoffAt: "2027-08-31T23:00:00.000Z",
    },
  ],
  adjustment: null,
  reschedule: null,
};

describe("FlexibleTicketRequestPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.operatorContext.mockResolvedValue({
      bookingId: "booking-1",
      bookingNumber: "PG-1",
      requests: [request],
    });
    mocks.review.mockResolvedValue({ ...request, status: "UNDER_REVIEW" });
  });

  it("presents customer submission as a supervised request", async () => {
    render(
      <FlexibleTicketRequestPanel
        bookingId="booking-1"
        onCompleted={vi.fn()}
      />,
    );

    expect(await screen.findByText("FTR-1")).toBeInTheDocument();
    expect(
      screen.getByText(/Customer submissions are requests only/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Taylor Adult \(TKT-1\)/)).toBeInTheDocument();
  });

  it("requires preview and a separate high-impact confirmation before approval", async () => {
    mocks.previewDecision.mockResolvedValue({
      previewHash: "a".repeat(64),
      decision: "APPROVE",
      reason: "APPROVED_UNDER_ENTITLEMENT",
      note: "Approved under the purchased entitlement.",
      request: { ...request, status: "UNDER_REVIEW" },
      mutation: {
        previewHash: "b".repeat(64),
        refundAmount: 24,
        currency: "AUD",
        ticketCount: 1,
        payment: { method: "ONLINE_CARD" },
      },
      consumesUses: 1,
    });
    mocks.executeDecision.mockResolvedValue({
      ...request,
      status: "COMPLETED",
    });
    const onCompleted = vi.fn().mockResolvedValue(undefined);
    render(
      <FlexibleTicketRequestPanel
        bookingId="booking-1"
        onCompleted={onCompleted}
      />,
    );

    fireEvent.click(
      await screen.findByRole("button", { name: "Review request" }),
    );
    await waitFor(() => expect(mocks.review).toHaveBeenCalled());
    fireEvent.change(screen.getByLabelText("Decision note"), {
      target: { value: "Approved under the purchased entitlement." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Review decision" }));

    expect(
      await screen.findByText("High-impact confirmation"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Authoritative Ticket refund: $24.00"),
    ).toBeInTheDocument();
    expect(mocks.executeDecision).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Confirm approval" }));
    await waitFor(() =>
      expect(mocks.executeDecision).toHaveBeenCalledWith(
        "booking-1",
        "FTR-1",
        expect.objectContaining({
          decision: "APPROVE",
          reason: "APPROVED_UNDER_ENTITLEMENT",
          previewHash: "a".repeat(64),
        }),
      ),
    );
    expect(onCompleted).toHaveBeenCalled();
  });

  it("makes decline explicit and does not describe entitlement consumption", async () => {
    mocks.previewDecision.mockResolvedValue({
      previewHash: "c".repeat(64),
      decision: "DECLINE",
      reason: "OUTSIDE_ENTITLEMENT",
      note: "Outside the purchased terms.",
      request: { ...request, status: "UNDER_REVIEW" },
      mutation: null,
      consumesUses: 0,
    });
    render(
      <FlexibleTicketRequestPanel
        bookingId="booking-1"
        onCompleted={vi.fn()}
      />,
    );

    fireEvent.click(
      await screen.findByRole("button", { name: "Review request" }),
    );
    fireEvent.click(await screen.findByRole("button", { name: "Decline" }));
    fireEvent.change(screen.getByLabelText("Decision note"), {
      target: { value: "Outside the purchased terms." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Review decision" }));

    expect(
      await screen.findByText(
        /records a decline and consumes no Flexible Ticket use/i,
      ),
    ).toBeInTheDocument();
  });
});
