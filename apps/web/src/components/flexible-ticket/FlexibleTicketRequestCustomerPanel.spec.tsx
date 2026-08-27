import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  publicContext: vi.fn(),
  createPublic: vi.fn(),
  withdrawPublic: vi.fn(),
}));

vi.mock("@/services/flexible-ticket-request.service", () => ({
  flexibleTicketRequestService: mocks,
}));

import { FlexibleTicketRequestCustomerPanel } from "./FlexibleTicketRequestCustomerPanel";

const context = {
  booking: {
    id: "booking-1",
    bookingNumber: "PG-1",
    status: "CONFIRMED",
    paymentStatus: "PAID",
    event: {
      id: "event-1",
      name: "Test Event",
      timezone: "Australia/Melbourne",
    },
    session: {
      id: "session-1",
      name: "10am",
      startDate: "2027-09-01T00:00:00.000Z",
      endDate: "2027-09-01T01:00:00.000Z",
    },
  },
  entitlements: [
    {
      id: "entitlement-1",
      entitlementNumber: "FTE-1",
      participantId: "participant-1",
      participantName: "Taylor Adult",
      ticketId: "ticket-1",
      ticketNumber: "TKT-1",
      status: "ACTIVE",
      remainingUses: 1,
      cutoffAt: "2027-08-31T23:00:00.000Z",
      ticketValue: 24,
      feeAmount: 5,
      currency: "AUD",
      feeRefundability: "NON_REFUNDABLE",
      canRequestRefund: true,
      canRequestSessionChange: true,
    },
  ],
  canRequestSessionChange: false,
  destinations: [],
  requests: [],
};

describe("FlexibleTicketRequestCustomerPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("crypto", { randomUUID: () => "request_key_1234567890" });
    mocks.publicContext.mockResolvedValue(context);
  });

  it("shows only authoritative eligible actions and explains the supervised boundary", async () => {
    render(
      <FlexibleTicketRequestCustomerPanel
        bookingId="booking-1"
        publicAccessToken={"a".repeat(64)}
      />,
    );

    expect(await screen.findByText("Taylor Adult")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Request cancellation/refund" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/submitting does not cancel a Ticket/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/whole-Booking Session change is available only/i),
    ).toBeInTheDocument();
  });

  it("submits a possession-scoped request without claiming immediate approval", async () => {
    mocks.createPublic.mockResolvedValue({
      requestNumber: "FTR-1",
      status: "SUBMITTED",
    });
    render(
      <FlexibleTicketRequestCustomerPanel
        bookingId="booking-1"
        publicAccessToken={"a".repeat(64)}
      />,
    );

    fireEvent.click(
      await screen.findByRole("button", {
        name: "Request cancellation/refund",
      }),
    );
    expect(
      screen.getByText((_, element) =>
        Boolean(
          element?.tagName === "P" &&
            element.textContent?.includes("Ticket value $24.00"),
        ),
      ),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Optional note"), {
      target: { value: "Please review this request." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit request" }));

    await waitFor(() =>
      expect(mocks.createPublic).toHaveBeenCalledWith("booking-1", {
        publicAccessToken: "a".repeat(64),
        idempotencyKey: "request_key_1234567890",
        type: "REFUND",
        entitlementIds: ["entitlement-1"],
        destinationSessionId: undefined,
        customerReason: "CHANGE_OF_PLANS",
        customerNote: "Please review this request.",
      }),
    );
    expect(
      await screen.findByText(/No Ticket or payment has changed yet/i),
    ).toBeInTheDocument();
  });

  it("withdraws only a request identified as withdrawable by the API", async () => {
    mocks.publicContext.mockResolvedValue({
      ...context,
      requests: [
        {
          requestNumber: "FTR-1",
          type: "REFUND",
          status: "SUBMITTED",
          customerReason: "CHANGE_OF_PLANS",
          customerNote: null,
          submittedAt: "2027-08-01T00:00:00.000Z",
          reviewedAt: null,
          decidedAt: null,
          completedAt: null,
          failedAt: null,
          expiredAt: null,
          destinationSession: null,
          items: [],
          adjustment: null,
          reschedule: null,
          canWithdraw: true,
        },
      ],
    });
    mocks.withdrawPublic.mockResolvedValue({ status: "WITHDRAWN" });
    render(
      <FlexibleTicketRequestCustomerPanel
        bookingId="booking-1"
        publicAccessToken={"a".repeat(64)}
      />,
    );

    fireEvent.click(
      await screen.findByRole("button", { name: "Withdraw request" }),
    );

    await waitFor(() =>
      expect(mocks.withdrawPublic).toHaveBeenCalledWith(
        "booking-1",
        "FTR-1",
        "a".repeat(64),
      ),
    );
  });
});
