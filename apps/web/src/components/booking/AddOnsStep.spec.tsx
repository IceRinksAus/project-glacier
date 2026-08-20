import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AddOnsStep } from "./AddOnsStep";

const { getSessionProducts } = vi.hoisted(() => ({
  getSessionProducts: vi.fn(),
}));

vi.mock("@/services/public-booking.service", () => ({
  publicBookingService: { getSessionProducts },
}));

const kangaSessionProduct = {
  id: "session-product-1",
  sessionId: "session-1",
  productId: "product-kanga",
  sortOrder: 0,
  remainingQuantity: 2,
  product: {
    id: "product-kanga",
    name: "Kanga Skating Aid",
    slug: "kanga-skating-aid",
    description: "Skating aid hire",
    price: 10,
    imageUrl: null,
    minQuantity: 0,
    maxQuantity: null,
    salesStart: null,
    salesEnd: null,
    eventId: "event-1",
  },
};

describe("AddOnsStep Product availability", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSessionProducts.mockResolvedValue([kangaSessionProduct]);
  });

  it("prevents selection above the remaining Session Product capacity", async () => {
    const user = userEvent.setup();
    render(<AddOnsStep sessionId="session-1" onChange={vi.fn()} />);

    expect(await screen.findByText("2 remaining for this session")).toBeInTheDocument();

    const addButton = screen.getByRole("button", {
      name: "Add one Kanga Skating Aid",
    });
    await user.click(addButton);
    await user.click(addButton);

    expect(screen.getByText("2", { selector: "span" })).toBeInTheDocument();
    expect(addButton).toBeDisabled();
  });

  it("blocks progress when a rule-required exhausted Product is unavailable", async () => {
    getSessionProducts.mockResolvedValue([]);

    render(
      <AddOnsStep
        sessionId="session-1"
        requiredProducts={[
          {
            productSlug: "kanga-skating-aid",
            quantity: 1,
            ruleIds: ["rule-kanga"],
            messages: ["Young Child Tickets require a Kanga."],
          },
        ]}
        onChange={vi.fn()}
      />,
    );

    expect(
      await screen.findByText("Required add-on unavailable"),
    ).toBeInTheDocument();
  });
});
