import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { checkoutConsentService } from "@/services/checkout-consent.service";

import { CheckoutDocumentSettings } from "./CheckoutDocumentSettings";

vi.mock("@/services/checkout-consent.service", () => ({
  checkoutConsentService: {
    context: vi.fn(),
    createDraft: vi.fn(),
    publish: vi.fn(),
  },
}));

const draft = {
  id: "terms-draft",
  type: "TICKETING_TERMS" as const,
  version: 1,
  status: "DRAFT" as const,
  title: "Fictional terms",
  content: "LOCAL TEST DOCUMENT — NOT LEGALLY APPROVED",
  contentHash: "hash",
  testOnly: true,
  publishedAt: null,
  createdAt: "2026-10-05T00:00:00.000Z",
  createdByUser: { id: "owner-1", name: "Owner" },
  publishedByUser: null,
};

const emptyContext = {
  event: { id: "event-1", name: "Test Event", status: "DRAFT" },
  documents: [],
  readiness: {
    readyForTicketCheckout: false,
    termsPublished: false,
    privacyPublished: false,
    marketingChoiceAvailable: false,
  },
};

describe("CheckoutDocumentSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(checkoutConsentService.context).mockResolvedValue(emptyContext);
  });

  it("requires draft creation and exact preview before publication", async () => {
    const user = userEvent.setup();
    vi.mocked(checkoutConsentService.createDraft).mockResolvedValue(draft);
    vi.mocked(checkoutConsentService.context)
      .mockResolvedValueOnce(emptyContext)
      .mockResolvedValueOnce({ ...emptyContext, documents: [draft] })
      .mockResolvedValueOnce({ ...emptyContext, documents: [] });
    vi.mocked(checkoutConsentService.publish).mockResolvedValue({
      ...draft,
      status: "PUBLISHED",
      publishedAt: "2026-10-05T01:00:00.000Z",
    });

    render(<CheckoutDocumentSettings eventId="event-1" />);

    expect(await screen.findByText("Required documents missing")).toBeVisible();
    expect(screen.getByText(/fictional test evidence only/i)).toBeVisible();

    await user.click(
      screen.getAllByRole("button", { name: "Create next draft" })[0],
    );
    expect(
      screen.getByDisplayValue("Fictional local Ticketing Terms"),
    ).toBeVisible();
    await user.click(
      screen.getByRole("button", { name: "Save draft for review" }),
    );

    expect(checkoutConsentService.createDraft).toHaveBeenCalledWith(
      "event-1",
      expect.objectContaining({
        type: "TICKETING_TERMS",
        testOnly: true,
      }),
    );
    expect(await screen.findByText("Exact version preview")).toBeVisible();
    expect(screen.getByText(draft.content)).toBeVisible();

    await user.click(
      screen.getByRole("button", { name: "Publish reviewed test version" }),
    );
    await waitFor(() =>
      expect(checkoutConsentService.publish).toHaveBeenCalledWith(
        "event-1",
        "terms-draft",
      ),
    );
  });
});
