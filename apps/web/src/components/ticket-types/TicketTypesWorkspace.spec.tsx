import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TicketTypesWorkspace } from "./TicketTypesWorkspace";

const {
  authState,
  create,
  findForEvent,
  findRules,
  createCompanionRule,
  updateCompanionRule,
  updateAgePolicy,
  updatePresentation,
  uploadImage,
  removeImage,
} = vi.hoisted(() => ({
  authState: { role: "OWNER" },
  create: vi.fn(),
  findForEvent: vi.fn(),
  findRules: vi.fn(),
  createCompanionRule: vi.fn(),
  updateCompanionRule: vi.fn(),
  updateAgePolicy: vi.fn(),
  updatePresentation: vi.fn(),
  uploadImage: vi.fn(),
  removeImage: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  getAuthRoleSnapshot: () => authState.role,
  getServerAuthRoleSnapshot: () => null,
  subscribeAuthSession: () => () => undefined,
}));

vi.mock("@/services/ticket-type.service", () => ({
  ticketTypeService: {
    create,
    findForEvent,
    findRules,
    createCompanionRule,
    updateCompanionRule,
    updateAgePolicy,
    updatePresentation,
    uploadImage,
    removeImage,
  },
}));

describe("TicketTypesWorkspace", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authState.role = "OWNER";
    findForEvent.mockResolvedValue([]);
    findRules.mockResolvedValue([]);
    create.mockResolvedValue({ id: "ticket-type-1" });
    createCompanionRule.mockResolvedValue({ id: "rule-1" });
    updateCompanionRule.mockResolvedValue({ id: "rule-1" });
    updateAgePolicy.mockResolvedValue({ id: "ticket-type-1" });
    updatePresentation.mockResolvedValue({ id: "ticket-type-1" });
    uploadImage.mockResolvedValue({ id: "asset-1" });
    removeImage.mockResolvedValue(undefined);
  });

  it("loads only the current Event Ticket Types", async () => {
    findForEvent.mockResolvedValue([
      {
        id: "ticket-type-1",
        name: "Adult admission",
        description: null,
        price: "25.00",
        capacity: 100,
        active: true,
        eventId: "event-1",
        tileLabel: null,
        tileColor: "#0B6CE3",
        imageAsset: null,
      },
    ]);

    render(
      <TicketTypesWorkspace eventId="event-1" onReturnToReadiness={vi.fn()} />,
    );

    expect(await screen.findAllByText("Adult admission")).toHaveLength(2);
    expect(findForEvent).toHaveBeenCalledWith("event-1");
    expect(screen.getByText("$25.00")).toBeInTheDocument();
  });

  it("allows an OWNER to create an active Ticket Type", async () => {
    const user = userEvent.setup();
    render(
      <TicketTypesWorkspace eventId="event-1" onReturnToReadiness={vi.fn()} />,
    );
    await screen.findByText("No Ticket Types yet");

    await user.type(screen.getByRole("textbox", { name: "Name" }), "Adult");
    await user.type(screen.getByLabelText("Price (AUD)"), "25");
    await user.click(
      screen.getByRole("button", { name: "Create active Ticket Type" }),
    );

    await waitFor(() =>
      expect(create).toHaveBeenCalledWith({
        eventId: "event-1",
        name: "Adult",
        price: 25,
        active: true,
        tileColor: "#0B6CE3",
      }),
    );
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Event readiness will update automatically",
    );
  });

  it("explains that rink capacity is shared at Session level", async () => {
    render(
      <TicketTypesWorkspace eventId="event-1" onReturnToReadiness={vi.fn()} />,
    );

    expect(
      await screen.findByText(/Session capacity remains the shared rink limit/),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Capacity")).not.toBeInTheDocument();
  });

  it("lets an OWNER update an existing Ticket Type appearance", async () => {
    const user = userEvent.setup();
    findForEvent.mockResolvedValue([
      {
        id: "ticket-type-1",
        name: "Adult admission",
        description: null,
        price: "25.00",
        capacity: 100,
        active: true,
        eventId: "event-1",
        tileLabel: null,
        tileColor: "#0B6CE3",
        imageAsset: null,
      },
    ]);

    render(
      <TicketTypesWorkspace eventId="event-1" onReturnToReadiness={vi.fn()} />,
    );

    await user.click(await screen.findByText("Manage appearance"));
    await user.type(screen.getByLabelText("Tile label"), "ADULT");
    await user.click(screen.getByRole("button", { name: "Save appearance" }));

    await waitFor(() =>
      expect(updatePresentation).toHaveBeenCalledWith("ticket-type-1", {
        tileLabel: "ADULT",
        tileColor: "#0B6CE3",
      }),
    );
  });

  it("lets an OWNER require an Adult companion for a Young Child Ticket", async () => {
    const user = userEvent.setup();
    findForEvent.mockResolvedValue([
      {
        id: "ticket-young-child",
        name: "Young Child",
        description: null,
        price: "10.00",
        capacity: 100,
        active: true,
        eventId: "event-1",
        tileLabel: "YOUNG CHILD",
        tileColor: "#0B6CE3",
        minimumAge: 0,
        maximumAge: 5,
        imageAsset: null,
      },
      {
        id: "ticket-adult",
        name: "Adult",
        description: null,
        price: "25.00",
        capacity: 100,
        active: true,
        eventId: "event-1",
        tileLabel: "ADULT",
        tileColor: "#0B6CE3",
        minimumAge: 18,
        maximumAge: null,
        imageAsset: null,
      },
    ]);

    render(
      <TicketTypesWorkspace eventId="event-1" onReturnToReadiness={vi.fn()} />,
    );

    const requirementControls = await screen.findAllByText(
      "Manage companion Ticket requirement",
    );
    await user.click(requirementControls[0]);
    await user.click(screen.getByRole("checkbox", { name: "Adult" }));
    await user.click(
      screen.getAllByRole("button", {
        name: "Save companion requirement",
      })[0],
    );

    await waitFor(() =>
      expect(createCompanionRule).toHaveBeenCalledWith(
        expect.objectContaining({
          eventId: "event-1",
          ruleType: "TICKET_COMPANION_REQUIREMENT",
          conditions: {
            all: [
              {
                field: "ticketTypeId",
                operator: "EQUALS",
                value: "ticket-young-child",
              },
              {
                field: "bookingTicketTypeIds",
                operator: "NOT_CONTAINS",
                value: "ticket-adult",
              },
            ],
          },
          actions: { type: "BLOCK_BOOKING" },
        }),
      ),
    );
  });

  it("keeps MEMBER access read-only", async () => {
    authState.role = "MEMBER";
    render(
      <TicketTypesWorkspace eventId="event-1" onReturnToReadiness={vi.fn()} />,
    );

    expect(await screen.findByText("Read-only access")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Create active Ticket Type" }),
    ).not.toBeInTheDocument();
  });
});
