import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import WaiversPage from "./page";

const listTemplates = vi.fn();
const getEvents = vi.fn();

vi.mock("@/components/layout/PlatformShell", () => ({
  PlatformShell: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));
vi.mock("@/lib/auth", () => ({
  getAuthRoleSnapshot: () => "OWNER",
  getServerAuthRoleSnapshot: () => "OWNER",
  subscribeAuthSession: () => () => undefined,
}));
vi.mock("@/services/waiver-template.service", () => ({
  waiverTemplateService: {
    list: () => listTemplates(),
    create: vi.fn(),
    approve: vi.fn(),
    retire: vi.fn(),
  },
}));
vi.mock("@/services/event.service", () => ({
  eventService: { getEvents: () => getEvents() },
}));

describe("WaiversPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listTemplates.mockResolvedValue([
      {
        id: "template-1",
        authority: "ORGANIZATION",
        organizationId: "org-1",
        name: "NSW Ice Skating",
        activityType: "ICE_SKATING",
        jurisdiction: "NSW",
        revision: 1,
        status: "APPROVED",
        approvalReference: "External counsel 2026-09-20",
        approvedAt: "2026-09-20T00:00:00.000Z",
        approvedByUser: { id: "user-1", name: "Owner" },
        legislationReferences: [],
        contentTemplate: "Reviewed wording",
        acceptanceStatement: "I accept",
        waiverVersions: [],
        createdAt: "2026-09-20T00:00:00.000Z",
        updatedAt: "2026-09-20T00:00:00.000Z",
      },
    ]);
    getEvents.mockResolvedValue([
      {
        id: "event-1",
        name: "Winter Festival",
        activityType: "ICE_SKATING",
        jurisdiction: "NSW",
        status: "ACTIVE",
      },
    ]);
  });

  it("shows the organisation template library and links to each Event Waiver", async () => {
    render(<WaiversPage />);

    expect(
      await screen.findByRole("heading", { name: "Waivers" }),
    ).toBeInTheDocument();
    expect(await screen.findByText("NSW Ice Skating")).toBeInTheDocument();
    expect(screen.getByText(/External counsel 2026-09-20/)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Open Event Waiver" }),
    ).toHaveAttribute("href", "/events/event-1?tab=Waiver");
    await waitFor(() => expect(listTemplates).toHaveBeenCalledOnce());
  });
});
