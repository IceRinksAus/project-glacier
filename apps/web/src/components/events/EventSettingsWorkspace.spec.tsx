import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { EventSettingsWorkspace } from "./EventSettingsWorkspace";

vi.mock("@/components/flexible-ticket/FlexibleTicketPolicySettings", () => ({
  EventFlexibleTicketSettings: () => <div>Flexible Ticket controls</div>,
}));
vi.mock("@/components/events/EventEntryPolicySettings", () => ({
  EventEntryPolicySettings: () => <div>Entry window controls</div>,
}));

const event = {
  id: "event-1",
  name: "Winter Festival",
  slug: "winter-festival",
  description: null,
  startDate: "2027-06-01T00:00:00.000Z",
  endDate: "2027-06-30T00:00:00.000Z",
  timezone: "Australia/Melbourne",
  status: "DRAFT",
  activityType: "ICE_SKATING",
  jurisdiction: "VIC",
  entryOpensMinutesBeforeStart: 30,
  entryClosesMinutesAfterEnd: 15,
  organizationId: "organization-1",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  branding: null,
};

describe("EventSettingsWorkspace", () => {
  it("groups settings by scope and keeps mutation controls in their authorities", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(<EventSettingsWorkspace event={event} onNavigate={onNavigate} />);

    expect(screen.getByText("Draft preview · Needs attention")).toBeVisible();
    expect(screen.getByText(/Entry opens 30 minutes before/)).toBeVisible();
    expect(screen.getByText("Flexible Ticket controls")).toBeVisible();
    expect(screen.getByText("Entry window controls")).toBeVisible();
    expect(screen.getByRole("link", { name: "Scanner guidance" })).toHaveAttribute("href", "/staff/scanner");

    await user.click(screen.getByRole("button", { name: "Open Website" }));
    expect(onNavigate).toHaveBeenCalledWith("Website");
  });
});
