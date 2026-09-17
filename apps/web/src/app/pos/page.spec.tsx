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
    getMerchandiseCatalogue.mockResolvedValue({
      event: catalogue.event,
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

  it("switches to merchandise without requiring a Session or purchaser", async () => {
    render(<PosPage />);

    fireEvent.click(
      await screen.findByRole("button", { name: /^Merchandise Sale/ }),
    );

    expect(await screen.findByText("Merchandise")).toBeInTheDocument();
    expect(
      screen.getByText(
        "No Session, participant or purchaser details are required.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Selling Session")).not.toBeInTheDocument();
    expect(await screen.findByText("10 remaining")).toBeInTheDocument();
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
});
