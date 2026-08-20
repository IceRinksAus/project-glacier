import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProductsWorkspace } from "./ProductsWorkspace";

const {
  authState,
  findForEvent,
  createProduct,
  createVariant,
  assignToSession,
  createRequirementRule,
  updateStatus,
  getSessions,
  findTicketTypes,
} = vi.hoisted(() => ({
  authState: { role: "OWNER" },
  findForEvent: vi.fn(),
  createProduct: vi.fn(),
  createVariant: vi.fn(),
  assignToSession: vi.fn(),
  createRequirementRule: vi.fn(),
  updateStatus: vi.fn(),
  getSessions: vi.fn(),
  findTicketTypes: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  getAuthRoleSnapshot: () => authState.role,
  getServerAuthRoleSnapshot: () => null,
  subscribeAuthSession: () => () => undefined,
}));

vi.mock("@/services/product-setup.service", () => ({
  productSetupService: {
    findForEvent,
    createProduct,
    createVariant,
    assignToSession,
    createRequirementRule,
    updateStatus,
  },
}));

vi.mock("@/services/session.service", () => ({
  sessionService: { getSessions },
}));

vi.mock("@/services/ticket-type.service", () => ({
  ticketTypeService: { findForEvent: findTicketTypes },
}));

const activeSession = {
  id: "session-1",
  eventId: "event-1",
  name: "10am skating",
  startDate: "2026-08-21T00:00:00.000Z",
  endDate: "2026-08-21T01:00:00.000Z",
  capacity: 150,
  status: "ACTIVE",
};

describe("ProductsWorkspace", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authState.role = "OWNER";
    findForEvent.mockResolvedValue([]);
    getSessions.mockResolvedValue([activeSession]);
    findTicketTypes.mockResolvedValue([
      {
        id: "child-ticket",
        eventId: "event-1",
        name: "Child",
        price: "15.00",
        active: true,
      },
    ]);
    createProduct.mockResolvedValue({
      id: "product-1",
      name: "Kanga hire",
      slug: "kanga-hire",
    });
    createVariant.mockResolvedValue({ id: "variant-1" });
    assignToSession.mockResolvedValue({ id: "assignment-1" });
    createRequirementRule.mockResolvedValue({ id: "rule-1" });
    updateStatus.mockResolvedValue({ id: "product-1", status: "ACTIVE" });
  });

  it("keeps MEMBER access read-only", async () => {
    authState.role = "MEMBER";
    render(<ProductsWorkspace eventId="event-1" />);

    expect(await screen.findByText("Read-only access")).toBeInTheDocument();
    expect(screen.queryByLabelText("Product name")).not.toBeInTheDocument();
  });

  it("configures reusable per-Session capacity and a Ticket Type requirement", async () => {
    const user = userEvent.setup();
    render(<ProductsWorkspace eventId="event-1" />);

    await user.type(await screen.findByLabelText("Product name"), "Kanga hire");
    await user.type(screen.getByLabelText("Base price (AUD)"), "8");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByLabelText("Reusable per Session"));
    await user.type(screen.getByLabelText("Default capacity per Session"), "20");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByLabelText(/10am skating/));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByLabelText("Child"));
    await user.click(
      screen.getByRole("button", { name: "Create and activate Product" }),
    );

    await waitFor(() =>
      expect(createProduct).toHaveBeenCalledWith(
        expect.objectContaining({
          eventId: "event-1",
          capacityControlled: true,
          capacity: 20,
          inventoryTracked: false,
        }),
      ),
    );
    expect(assignToSession).toHaveBeenCalledWith("session-1", "product-1");
    expect(createRequirementRule).toHaveBeenCalledWith(
      expect.objectContaining({
        conditions: {
          all: [
            {
              field: "ticketTypeId",
              operator: "IN",
              value: ["child-ticket"],
            },
          ],
        },
      }),
    );
    expect(updateStatus).toHaveBeenCalledWith("product-1", "ACTIVE");
  });

  it("keeps finite merchandise optional and creates independent Variant stock", async () => {
    const user = userEvent.setup();
    createProduct.mockResolvedValue({
      id: "hoodie-1",
      name: "Event hoodie",
      slug: "event-hoodie",
    });
    render(<ProductsWorkspace eventId="event-1" />);

    await user.type(await screen.findByLabelText("Product name"), "Event hoodie");
    await user.type(screen.getByLabelText("Base price (AUD)"), "50");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByLabelText("Finite Variant inventory"));
    await user.type(screen.getByLabelText("Variant 1 name"), "Small");
    await user.type(screen.getByLabelText("Variant 1 inventory"), "50");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByLabelText(/10am skating/));
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(screen.queryByLabelText("Child")).not.toBeInTheDocument();
    expect(screen.getByText(/Variant merchandise remains optional/)).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Create and activate Product" }),
    );

    await waitFor(() =>
      expect(createVariant).toHaveBeenCalledWith(
        expect.objectContaining({
          productId: "hoodie-1",
          name: "Small",
          inventoryQuantity: 50,
        }),
      ),
    );
    expect(createRequirementRule).not.toHaveBeenCalled();
    expect(updateStatus).toHaveBeenCalledWith("hoodie-1", "ACTIVE");
  });

  it("applies a Product to every active Session without manual selection", async () => {
    const user = userEvent.setup();
    getSessions.mockResolvedValue([
      activeSession,
      {
        ...activeSession,
        id: "session-2",
        name: "12pm skating",
        startDate: "2026-08-21T02:00:00.000Z",
        endDate: "2026-08-21T03:00:00.000Z",
      },
    ]);
    render(<ProductsWorkspace eventId="event-1" />);

    await user.type(await screen.findByLabelText("Product name"), "All-day hire");
    await user.type(screen.getByLabelText("Base price (AUD)"), "8");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByLabelText("Reusable per Session"));
    await user.type(screen.getByLabelText("Default capacity per Session"), "20");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(
      screen.getByRole("button", { name: "Apply to all active Sessions" }),
    );

    expect(screen.getByText("2 of 2 selected")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(
      screen.getByRole("button", { name: "Create and activate Product" }),
    );

    await waitFor(() => expect(assignToSession).toHaveBeenCalledTimes(2));
    expect(assignToSession).toHaveBeenCalledWith("session-1", "product-1");
    expect(assignToSession).toHaveBeenCalledWith("session-2", "product-1");
  });
});
