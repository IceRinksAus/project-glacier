import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TicketTypesWorkspace } from "./TicketTypesWorkspace";

const { authState, create, findForEvent } = vi.hoisted(() => ({
  authState: { role: "OWNER" },
  create: vi.fn(),
  findForEvent: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  getAuthRoleSnapshot: () => authState.role,
  getServerAuthRoleSnapshot: () => null,
  subscribeAuthSession: () => () => undefined,
}));

vi.mock("@/services/ticket-type.service", () => ({
  ticketTypeService: { create, findForEvent },
}));

describe("TicketTypesWorkspace", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authState.role = "OWNER";
    findForEvent.mockResolvedValue([]);
    create.mockResolvedValue({ id: "ticket-type-1" });
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
      },
    ]);

    render(
      <TicketTypesWorkspace eventId="event-1" onReturnToReadiness={vi.fn()} />,
    );

    expect(await screen.findByText("Adult admission")).toBeInTheDocument();
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
    await user.type(screen.getByLabelText("Capacity"), "100");
    await user.click(
      screen.getByRole("button", { name: "Create active Ticket Type" }),
    );

    await waitFor(() =>
      expect(create).toHaveBeenCalledWith({
        eventId: "event-1",
        name: "Adult",
        price: 25,
        capacity: 100,
        active: true,
      }),
    );
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Event readiness will update automatically",
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
