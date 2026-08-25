import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ReportsPage from "./page";

const { getAll, create, update, replaceEvents, getEvents } = vi.hoisted(() => ({
  getAll: vi.fn(), create: vi.fn(), update: vi.fn(), replaceEvents: vi.fn(), getEvents: vi.fn(),
}));

vi.mock("@/services/event-group.service", () => ({ eventGroupService: { getAll, create, update, replaceEvents } }));
vi.mock("@/services/event.service", () => ({ eventService: { getEvents } }));
vi.mock("@/lib/auth", () => ({ subscribeAuthSession: () => () => undefined, getAuthRoleSnapshot: () => "OWNER", getServerAuthRoleSnapshot: () => "OWNER" }));
vi.mock("@/components/layout/PlatformShell", () => ({ PlatformShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));

const events = [
  { id: "event-1", name: "Melbourne", startDate: "2027-06-01T00:00:00.000Z" },
  { id: "event-2", name: "Sydney", startDate: "2027-07-01T00:00:00.000Z" },
];
const group = { id: "group-1", name: "Winter Season", description: "Two cities", type: "SEASON", status: "ACTIVE", events: [{ sortOrder: 0, event: { ...events[0], slug: "melbourne", status: "ACTIVE", endDate: "2027-06-10T00:00:00.000Z", timezone: "Australia/Melbourne" } }] };

describe("ReportsPage Event Groups", () => {
  beforeEach(() => {
    getAll.mockReset().mockResolvedValue([group]);
    getEvents.mockReset().mockResolvedValue(events);
    create.mockReset().mockResolvedValue(group);
    replaceEvents.mockReset().mockResolvedValue(group);
    update.mockReset().mockResolvedValue(group);
  });

  it("lets an OWNER create a controlled Event Group", async () => {
    const user = userEvent.setup();
    render(<ReportsPage />);
    await screen.findByText("Winter Season");
    await user.type(screen.getByLabelText("Group name"), "East Coast Tour");
    await user.selectOptions(screen.getByLabelText("Group type"), "TOUR");
    await user.click(screen.getByRole("button", { name: "Create group" }));
    await waitFor(() => expect(create).toHaveBeenCalledWith({ name: "East Coast Tour", description: undefined, type: "TOUR" }));
  });

  it("persists selected Event membership in organiser order", async () => {
    const user = userEvent.setup();
    render(<ReportsPage />);
    await screen.findByText("Winter Season");
    await user.click(screen.getByRole("checkbox", { name: /Sydney/ }));
    await user.click(screen.getByRole("button", { name: "Move Sydney earlier" }));
    await user.click(screen.getByRole("button", { name: "Save membership" }));
    await waitFor(() => expect(replaceEvents).toHaveBeenCalledWith("group-1", ["event-2", "event-1"]));
  });
});
