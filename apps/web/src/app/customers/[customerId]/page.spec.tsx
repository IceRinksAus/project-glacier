import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import CustomerDetailPage from "./page";

const { findOne, withdrawMarketing } = vi.hoisted(() => ({
  findOne: vi.fn(),
  withdrawMarketing: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useParams: () => ({ customerId: "customer-1" }),
}));

vi.mock("@/services/customer.service", () => ({
  customerService: { findOne, withdrawMarketing },
}));

vi.mock("@/components/layout/PlatformShell", () => ({
  PlatformShell: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

const customer = {
  id: "customer-1",
  firstName: "Taylor",
  lastName: "Example",
  email: "taylor@example.test",
  phone: null,
  createdAt: "2026-10-05T00:00:00.000Z",
  bookings: [],
  marketingConsentEvidence: [
    {
      id: "withdrawal-1",
      eventId: "event-1",
      decision: "WITHDRAWN",
      channel: "ADMIN_RECORDED",
      senderName: null,
      occurredAt: "2026-10-05T02:00:00.000Z",
      event: { id: "event-1", name: "Fictional Festival" },
      actorUser: { id: "owner-1", name: "Test Owner" },
    },
    {
      id: "grant-1",
      eventId: "event-1",
      decision: "GRANTED",
      channel: "ONLINE",
      senderName: "Taylor Example",
      occurredAt: "2026-10-05T01:00:00.000Z",
      event: { id: "event-1", name: "Fictional Festival" },
      actorUser: null,
    },
  ],
};

describe("CustomerDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findOne.mockResolvedValue(customer);
  });

  it("shows only the latest marketing choice for each Event", async () => {
    render(<CustomerDetailPage />);

    expect(await screen.findByText("Permission withdrawn", { exact: false })).toBeVisible();
    expect(screen.queryByText("Marketing permitted", { exact: false })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Record withdrawal" })).not.toBeInTheDocument();
  });

  it("records a current grant withdrawal and reloads the Customer", async () => {
    const user = userEvent.setup();
    findOne
      .mockResolvedValueOnce({
        ...customer,
        marketingConsentEvidence: [customer.marketingConsentEvidence[1]],
      })
      .mockResolvedValueOnce(customer);
    withdrawMarketing.mockResolvedValue({ id: "withdrawal-1" });

    render(<CustomerDetailPage />);
    await user.click(await screen.findByRole("button", { name: "Record withdrawal" }));

    await waitFor(() =>
      expect(withdrawMarketing).toHaveBeenCalledWith("customer-1", "event-1"),
    );
    expect(findOne).toHaveBeenCalledTimes(2);
    expect(await screen.findByText("Permission withdrawn", { exact: false })).toBeVisible();
  });
});
