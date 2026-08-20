import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { EventReadinessPanel } from "./EventReadinessPanel";

const { getReadiness, updateStatus } = vi.hoisted(() => ({
  getReadiness: vi.fn(),
  updateStatus: vi.fn(),
}));

vi.mock("@/services/event.service", () => ({
  eventService: { getReadiness, updateStatus },
}));

const baseReadiness = {
  eventId: "event-1",
  readyToActivate: false,
  completedRequiredItems: 1,
  requiredItems: 3,
  percentage: 33,
  items: [
    {
      id: "EVENT_DETAILS",
      label: "Event details",
      status: "COMPLETE",
      explanation: "Event details are complete.",
      destinationTab: "Overview",
    },
    {
      id: "SESSIONS",
      label: "Sessions",
      status: "INCOMPLETE",
      explanation: "Add an active Session.",
      destinationTab: "Sessions",
    },
    {
      id: "WAIVER",
      label: "Waiver",
      status: "NOT_REQUIRED",
      explanation: "No Waiver is configured.",
      destinationTab: "Waiver",
    },
  ],
};

describe("EventReadinessPanel", () => {
  beforeEach(() => {
    localStorage.clear();
    getReadiness.mockReset();
    updateStatus.mockReset();
  });

  it("shows authoritative incomplete items and navigates to their tab", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    localStorage.setItem("glacier_user", JSON.stringify({ role: "OWNER" }));
    getReadiness.mockResolvedValue(baseReadiness);

    render(
      <EventReadinessPanel
        eventId="event-1"
        eventStatus="DRAFT"
        onNavigate={onNavigate}
        onActivated={vi.fn()}
      />,
    );

    expect(await screen.findByText("33%")).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Activate Event" }),
    ).toBeDisabled();
    await user.click(screen.getByRole("button", { name: /Sessions/ }));
    expect(onNavigate).toHaveBeenCalledWith("Sessions");
  });

  it("allows an owner to activate only a ready Event", async () => {
    const user = userEvent.setup();
    const onActivated = vi.fn();
    localStorage.setItem("glacier_user", JSON.stringify({ role: "OWNER" }));
    getReadiness.mockResolvedValue({
      ...baseReadiness,
      readyToActivate: true,
      completedRequiredItems: 3,
      percentage: 100,
      items: baseReadiness.items.map((item) => ({
        ...item,
        status: "COMPLETE",
      })),
    });
    updateStatus.mockResolvedValue({ status: "ACTIVE" });
    render(
      <EventReadinessPanel
        eventId="event-1"
        eventStatus="DRAFT"
        onNavigate={vi.fn()}
        onActivated={onActivated}
      />,
    );

    await user.click(
      await screen.findByRole("button", { name: "Activate Event" }),
    );

    await waitFor(() =>
      expect(updateStatus).toHaveBeenCalledWith("event-1", "ACTIVE"),
    );
    expect(onActivated).toHaveBeenCalled();
  });

  it("does not expose activation to a MEMBER", async () => {
    localStorage.setItem("glacier_user", JSON.stringify({ role: "MEMBER" }));
    getReadiness.mockResolvedValue({
      ...baseReadiness,
      readyToActivate: true,
      percentage: 100,
    });
    render(
      <EventReadinessPanel
        eventId="event-1"
        eventStatus="DRAFT"
        onNavigate={vi.fn()}
        onActivated={vi.fn()}
      />,
    );

    expect(await screen.findByText("100%")).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Activate Event" }),
    ).not.toBeInTheDocument();
  });
});
