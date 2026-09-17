import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TicketTypesWorkspace } from "./TicketTypesWorkspace";

const {
  authState,
  create,
  findForEvent,
  updatePresentation,
  uploadImage,
  removeImage,
} = vi.hoisted(() => ({
  authState: { role: "OWNER" },
  create: vi.fn(),
  findForEvent: vi.fn(),
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
    create.mockResolvedValue({ id: "ticket-type-1" });
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
