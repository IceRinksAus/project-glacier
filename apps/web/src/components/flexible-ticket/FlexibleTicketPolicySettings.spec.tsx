import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  role: "OWNER",
  event: vi.fn(),
  updateEventMode: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  getAuthUser: () => ({ role: mocks.role }),
}));

vi.mock("@/services/flexible-ticket-policy.service", () => ({
  flexibleTicketPolicyService: {
    event: mocks.event,
    updateEventMode: mocks.updateEventMode,
    createEventDraft: vi.fn(),
    publishEvent: vi.fn(),
  },
}));

import { EventFlexibleTicketSettings } from "./FlexibleTicketPolicySettings";

const policy = {
  id: "policy-1",
  eventId: null,
  version: 2,
  status: "PUBLISHED",
  available: true,
  feeType: "FIXED",
  feeValue: 5,
  currency: "AUD",
  allowsSessionChange: true,
  allowsRefundRequest: true,
  cutoffMinutesBeforeSession: 1440,
  permittedUseLimit: 1,
  priceIncreaseTreatment: "CUSTOMER_PAYS_DIFFERENCE",
  priceDecreaseTreatment: "KEEP_ORIGINAL_PRICE",
  feeRefundability: "NON_REFUNDABLE",
  customerSummary: "Eligible changes or cancellation requests.",
  materialTerms: "Terms apply.",
  publishedAt: "2026-08-27T00:00:00.000Z",
};

function context() {
  return {
    event: {
      id: "event-1",
      name: "Winter Festival",
      flexibleTicketMode: "INHERIT",
    },
    organization: { draft: null, published: policy, history: [] },
    override: { draft: null, published: null, history: [] },
    effectivePolicy: { ...policy, sourceMode: "INHERIT" },
    ready: true,
  };
}

describe("EventFlexibleTicketSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.role = "OWNER";
    mocks.event.mockResolvedValue(context());
    mocks.updateEventMode.mockResolvedValue({});
  });

  it("shows the effective inherited policy and lets an Owner disable the offer", async () => {
    const user = userEvent.setup();
    render(<EventFlexibleTicketSettings eventId="event-1" />);

    expect(await screen.findByText("Version 2 · PUBLISHED")).toBeVisible();
    await user.click(screen.getByRole("radio", { name: "Not offered" }));

    expect(mocks.updateEventMode).toHaveBeenCalledWith("event-1", "DISABLED");
  });

  it("allows a Manager to inspect but not alter the effective policy", async () => {
    mocks.role = "MANAGER";
    render(<EventFlexibleTicketSettings eventId="event-1" />);

    expect(
      await screen.findByText(/only the Organisation Owner can change/i),
    ).toBeVisible();
    expect(
      screen.getByRole("radio", { name: "Inherit default" }),
    ).toBeDisabled();
    expect(
      screen.getByText("Eligible changes or cancellation requests."),
    ).toBeVisible();
  });
});
