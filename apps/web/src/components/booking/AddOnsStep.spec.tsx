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
    variants: [],
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

    expect(await screen.findByText("2 remaining")).toBeInTheDocument();

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

  it("submits independent Product Variant selections and price overrides", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    getSessionProducts.mockResolvedValue([
      {
        ...kangaSessionProduct,
        id: "session-product-hoodie",
        productId: "product-hoodie",
        remainingQuantity: null,
        product: {
          ...kangaSessionProduct.product,
          id: "product-hoodie",
          name: "Event Hoodie",
          slug: "event-hoodie",
          price: 60,
          variants: [
            {
              id: "variant-small",
              productId: "product-hoodie",
              name: "Small",
              slug: "small",
              description: null,
              priceOverride: 55,
              imageUrl: null,
              inventoryTracked: true,
              inventoryQuantity: 50,
              remainingQuantity: 2,
              sortOrder: 0,
            },
            {
              id: "variant-large",
              productId: "product-hoodie",
              name: "Large",
              slug: "large",
              description: null,
              priceOverride: null,
              imageUrl: null,
              inventoryTracked: true,
              inventoryQuantity: 40,
              remainingQuantity: 4,
              sortOrder: 1,
            },
          ],
        },
      },
    ]);

    render(<AddOnsStep sessionId="session-1" onChange={onChange} />);

    await user.click(
      await screen.findByRole("button", {
        name: "Add one Event Hoodie — Small",
      }),
    );
    await user.click(
      screen.getByRole("button", {
        name: "Add one Event Hoodie — Large",
      }),
    );

    expect(onChange).toHaveBeenLastCalledWith(
      [
        expect.objectContaining({
          productId: "product-hoodie",
          productVariantId: "variant-small",
          quantity: 1,
          price: 55,
        }),
        expect.objectContaining({
          productId: "product-hoodie",
          productVariantId: "variant-large",
          quantity: 1,
          price: 60,
        }),
      ],
      115,
    );
  });
});
