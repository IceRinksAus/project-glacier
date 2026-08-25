import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import SettingsPage from "./page";

const { getTeam, updateAccess, getEvents } = vi.hoisted(() => ({
  getTeam: vi.fn(),
  updateAccess: vi.fn(),
  getEvents: vi.fn(),
}));

vi.mock("@/services/team-access.service", () => ({
  teamAccessService: { getTeam, updateAccess },
}));
vi.mock("@/services/event.service", () => ({
  eventService: { getEvents },
}));
vi.mock("@/lib/auth", () => ({
  subscribeAuthSession: () => () => undefined,
  getAuthRoleSnapshot: () => "OWNER",
  getServerAuthRoleSnapshot: () => "OWNER",
}));
vi.mock("@/components/layout/PlatformShell", () => ({
  PlatformShell: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

const events = [
  { id: "event-1", name: "Melbourne Winter Festival", startDate: "2027-06-01T00:00:00.000Z" },
  { id: "event-2", name: "Sydney Winter Festival", startDate: "2027-07-01T00:00:00.000Z" },
];

const members = [
  { id: "membership-owner", role: "OWNER", accessScope: "ALL_EVENTS", createdAt: "2026-01-01T00:00:00.000Z", user: { id: "owner-1", name: "Jamie Owner", email: "owner@example.com", isActive: true, eventAccess: [] } },
  { id: "membership-staff", role: "STAFF", accessScope: "ALL_EVENTS", createdAt: "2026-01-01T00:00:00.000Z", user: { id: "staff-1", name: "Sam Staff", email: "staff@example.com", isActive: true, eventAccess: [] } },
];

describe("SettingsPage Team and Access", () => {
  beforeEach(() => {
    getTeam.mockReset().mockResolvedValue(members);
    getEvents.mockReset().mockResolvedValue(events);
    updateAccess.mockReset().mockResolvedValue(members[1]);
  });

  it("shows role guidance and keeps Owner authority read-only", async () => {
    render(<SettingsPage />);
    expect(await screen.findByText("Jamie Owner")).toBeVisible();
    expect(screen.getByText("Owner · All Events")).toBeVisible();
    expect(screen.getByText(/cannot be changed through ordinary team management/i)).toBeVisible();
    expect(screen.getByRole("heading", { name: "Manager" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Scanner" })).toBeVisible();
  });

  it("lets an Owner restrict a Manager to selected Events", async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);
    await screen.findByText("Sam Staff");
    await user.selectOptions(screen.getByLabelText("Role"), "MANAGER");
    await user.selectOptions(screen.getByLabelText("Event access"), "ASSIGNED_EVENTS");
    await user.click(screen.getByRole("checkbox", { name: /Melbourne Winter Festival/ }));
    await user.click(screen.getByRole("button", { name: "Save access" }));
    await waitFor(() =>
      expect(updateAccess).toHaveBeenCalledWith("staff-1", {
        role: "MANAGER",
        accessScope: "ASSIGNED_EVENTS",
        eventIds: ["event-1"],
      }),
    );
  });

  it("forces Scanner accounts to selected Event access", async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);
    await screen.findByText("Sam Staff");
    await user.selectOptions(screen.getByLabelText("Role"), "SCANNER");
    expect(screen.getByLabelText("Event access")).toBeDisabled();
    expect(screen.getByLabelText("Event access")).toHaveValue("ASSIGNED_EVENTS");
    expect(screen.getByText(/No selection means this person has no Event access/)).toBeVisible();
  });
});
