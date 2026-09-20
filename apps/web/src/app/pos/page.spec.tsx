import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import PosPage from "./page";

const {
  getEvents,
  getCatalogue,
  evaluateRules,
  createCustomer,
  createReservation,
  completePayment,
  getMerchandiseCatalogue,
  createRetailSale,
  completeRetailSale,
} = vi.hoisted(() => ({
  getEvents: vi.fn(),
  getCatalogue: vi.fn(),
  evaluateRules: vi.fn(),
  createCustomer: vi.fn(),
  createReservation: vi.fn(),
  completePayment: vi.fn(),
  getMerchandiseCatalogue: vi.fn(),
  createRetailSale: vi.fn(),
  completeRetailSale: vi.fn(),
}));

vi.mock("@/services/event.service", () => ({
  eventService: { getEvents },
}));

vi.mock("@/services/pos.service", () => ({
  posService: {
    getCatalogue,
    evaluateRules,
    createCustomer,
    createReservation,
    completePayment,
    getMerchandiseCatalogue,
    createRetailSale,
    completeRetailSale,
  },
}));

vi.mock("@/components/layout/PlatformShell", () => ({
  PlatformShell: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

const event = {
  id: "event-1",
  name: "Winter Festival",
  status: "ACTIVE",
};

const catalogue = {
  event: {
    id: "event-1",
    name: "Winter Festival",
    timezone: "Australia/Melbourne",
  },
  sessions: [
    {
      id: "session-1",
      name: "10:00 session",
      startDate: "2027-08-01T00:00:00.000Z",
      endDate: "2027-08-01T01:00:00.000Z",
      capacity: 150,
      salesStart: null,
      salesEnd: null,
    },
  ],
  ticketTypes: [
    {
      id: "ticket-1",
      name: "Adult",
      description: null,
      price: 24,
      tileLabel: "ADULT",
      tileColor: "#0B6CE3",
      minimumAge: 18,
      maximumAge: null,
      imageAsset: null,
      saleStart: null,
      saleEnd: null,
    },
  ],
  sessionProducts: [],
};

describe("PosPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem("glacier_pos_event", "event-1");
    getEvents.mockResolvedValue([event]);
    getCatalogue.mockResolvedValue(catalogue);
    evaluateRules.mockResolvedValue({
      valid: true,
      errors: [],
      warnings: [],
      requiredProducts: [],
    });
    getMerchandiseCatalogue.mockResolvedValue({
      event: catalogue.event,
      sessions: catalogue.sessions,
      products: [
        {
          id: "hoodie",
          name: "Hoodie",
          description: null,
          price: 50,
          minQuantity: 0,
          maxQuantity: null,
          inventoryTracked: true,
          remainingInventory: 10,
          requiresSessionSelection: false,
          remainingSessionCapacity: null,
          productGroup: { id: "merch", name: "Merchandise", sortOrder: 0 },
          variants: [],
        },
      ],
    });
  });

  it("requires deliberate use of the recommended selling Session", async () => {
    render(<PosPage />);

    expect(
      await screen.findByText(/Recommended current Session/),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Selling Session locked/),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Use recommendation" }));

    expect(
      await screen.findByText(/Selling Session locked/),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("button", { name: /Add Ticket/ }),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(getCatalogue).toHaveBeenLastCalledWith("event-1", "session-1"),
    );
  });

  it("processes a Kanga-only order from the unified selling screen", async () => {
    getCatalogue.mockResolvedValue({
      ...catalogue,
      sessionProducts: [
        {
          id: "assignment-1",
          productId: "kanga-1",
          capacityOverride: 20,
          sortOrder: 0,
          product: {
            id: "kanga-1",
            name: "Kanga",
            slug: "kanga",
            description: null,
            price: 10,
            minQuantity: 0,
            maxQuantity: null,
            capacityControlled: true,
            capacity: 20,
            inventoryTracked: false,
            inventoryQuantity: null,
            imageAsset: null,
            productGroup: null,
            variants: [],
          },
        },
      ],
    });
    createRetailSale.mockResolvedValue({
      id: "sale-1",
      saleNumber: "RS-1",
      status: "RESERVED",
      paymentStatus: "UNPAID",
      total: 10,
      currency: "AUD",
      reservedUntil: "2026-09-20T07:00:00.000Z",
      completedAt: null,
      completedByUser: null,
      session: {
        id: "session-1",
        name: "10:00 session",
        startDate: catalogue.sessions[0].startDate,
        endDate: catalogue.sessions[0].endDate,
      },
      items: [],
      payments: [],
    });
    render(<PosPage />);
    fireEvent.click(await screen.findByRole("button", { name: "Use recommendation" }));
    fireEvent.click(await screen.findByRole("button", { name: "Add one Kanga" }));
    fireEvent.click(screen.getByRole("button", { name: "Review payment" }));

    await waitFor(() =>
      expect(createRetailSale).toHaveBeenCalledWith(
        "event-1",
        "session-1",
        [{ productId: "kanga-1", quantity: 1, productVariantId: undefined }],
      ),
    );
    expect(createReservation).not.toHaveBeenCalled();
    expect(screen.getByText("Product Sale RS-1")).toBeVisible();
    expect(screen.getByText("$10.00")).toBeVisible();
    expect(getCatalogue).toHaveBeenLastCalledWith(
      "event-1",
      "session-1",
    );
  });

  it("adds an ordinary walk-up Ticket without participant name fields", async () => {
    render(<PosPage />);
    fireEvent.click(
      await screen.findByRole("button", { name: "Use recommendation" }),
    );
    fireEvent.click(
      await screen.findByRole("button", { name: "Add Ticket Adult" }),
    );

    expect(screen.queryByLabelText("First name")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Last name")).not.toBeInTheDocument();
    expect(screen.getByText("1 × Adult")).toBeInTheDocument();
    expect(screen.getAllByText("$24.00").length).toBeGreaterThan(0);
    expect(screen.getByLabelText("Age")).toHaveValue(18);
  });

  it("uses a valid configured Ticket Type age instead of a universal age", async () => {
    getCatalogue.mockResolvedValue({
      ...catalogue,
      ticketTypes: [
        {
          ...catalogue.ticketTypes[0],
          id: "toddler",
          name: "Toddler",
          minimumAge: 0,
          maximumAge: 4,
        },
        {
          ...catalogue.ticketTypes[0],
          id: "child",
          name: "Child",
          minimumAge: 5,
          maximumAge: 14,
        },
      ],
    });
    render(<PosPage />);
    fireEvent.click(
      await screen.findByRole("button", { name: "Use recommendation" }),
    );
    fireEvent.click(
      await screen.findByRole("button", { name: "Add Ticket Toddler" }),
    );
    fireEvent.click(
      await screen.findByRole("button", { name: "Add Ticket Child" }),
    );

    expect(screen.getAllByLabelText("Age")[0]).toHaveValue(4);
    expect(screen.getAllByLabelText("Age")[1]).toHaveValue(14);
  });

  it("shows a Rule-required Product in the order before payment review", async () => {
    getCatalogue.mockResolvedValue({
      ...catalogue,
      ticketTypes: [
        {
          ...catalogue.ticketTypes[0],
          id: "young-child",
          name: "Young Child",
          price: 15,
          minimumAge: 0,
          maximumAge: 4,
        },
      ],
      sessionProducts: [
        {
          id: "assignment-1",
          productId: "kanga-1",
          capacityOverride: null,
          sortOrder: 0,
          product: {
            id: "kanga-1",
            name: "Kanga",
            slug: "kanga",
            description: null,
            price: 10,
            minQuantity: 0,
            maxQuantity: null,
            capacityControlled: false,
            capacity: null,
            inventoryTracked: false,
            inventoryQuantity: null,
            imageAsset: null,
            productGroup: null,
            variants: [],
          },
        },
      ],
    });
    evaluateRules.mockResolvedValue({
      valid: true,
      errors: [],
      warnings: [],
      requiredProducts: [{ productSlug: "kanga", quantity: 1 }],
    });

    render(<PosPage />);
    fireEvent.click(
      await screen.findByRole("button", { name: "Use recommendation" }),
    );
    fireEvent.click(
      await screen.findByRole("button", { name: "Add Ticket Young Child" }),
    );

    expect(await screen.findByText("1 × Kanga")).toBeInTheDocument();
    expect(screen.getByText("Required")).toBeInTheDocument();
    expect(screen.getByText("$25.00")).toBeInTheDocument();
    expect(createReservation).not.toHaveBeenCalled();
  });
});
