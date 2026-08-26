import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import BookingPaymentPage from "./page";

const { investigate, reconcile } = vi.hoisted(() => ({
  investigate: vi.fn(),
  reconcile: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useParams: () => ({ bookingId: "booking-1" }),
}));

vi.mock("@/services/booking-operations.service", () => ({
  bookingOperationsService: {
    investigate,
    reconcile,
  },
}));

vi.mock("@/components/layout/PlatformShell", () => ({
  PlatformShell: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

const pendingInvestigation = {
  id: "booking-1",
  bookingNumber: "PG-1234",
  status: "EXPIRED",
  source: "ONLINE",
  paymentStatus: "UNPAID",
  total: 74,
  reservedUntil: "2026-08-24T04:00:00.000Z",
  confirmedAt: null,
  paidAt: null,
  expiredAt: "2026-08-24T04:15:00.000Z",
  createdAt: "2026-08-24T03:45:00.000Z",
  requiresReconciliation: true,
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
    endDate: "2026-08-24T01:00:00.000Z",
  },
  tickets: [],
  payments: [
    {
      id: "payment-1",
      provider: "STRIPE",
      method: "ONLINE_CARD",
      providerReferenceSummary: "••••12345678",
      standaloneReference: null,
      amount: 74,
      currency: "AUD",
      status: "PENDING",
      failureCode: null,
      failureMessage: null,
      succeededAt: null,
      failedAt: null,
      cancelledAt: null,
      receivedAt: null,
      createdAt: "2026-08-24T03:46:00.000Z",
      receivedByUser: null,
      refunds: [],
    },
  ],
  paymentReconciliationAttempts: [],
};

describe("BookingPaymentPage", () => {
  beforeEach(() => {
    investigate.mockReset();
    reconcile.mockReset();
  });

  it("shows the operational payment record and controlled reconciliation action", async () => {
    investigate.mockResolvedValue(pendingInvestigation);

    render(<BookingPaymentPage />);

    expect(
      await screen.findByRole("heading", { name: "PG-1234" }),
    ).toBeVisible();
    expect(screen.getByText("Winter Festival")).toBeVisible();
    expect(screen.getByText("••••12345678", { exact: false })).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Reconcile payment" }),
    ).toBeVisible();
    expect(screen.queryByText(/Mark paid/i)).not.toBeInTheDocument();
  });

  it("reports provider-pending truth without claiming a local change", async () => {
    const user = userEvent.setup();
    investigate.mockResolvedValue(pendingInvestigation);
    reconcile.mockResolvedValue({
      investigation: pendingInvestigation,
    });

    render(<BookingPaymentPage />);

    await user.click(
      await screen.findByRole("button", { name: "Reconcile payment" }),
    );

    await waitFor(() =>
      expect(reconcile).toHaveBeenCalledWith("booking-1"),
    );
    expect(
      screen.getByText(
        "Provider state remains pending. No local status was changed.",
      ),
    ).toBeVisible();
  });
});
