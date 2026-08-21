import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { EventBrandingWorkspace } from "./EventBrandingWorkspace";

const { updateBranding, authRole } = vi.hoisted(() => ({
  updateBranding: vi.fn(),
  authRole: { value: "OWNER" },
}));

vi.mock("@/lib/auth", () => ({
  getAuthUser: () => ({ role: authRole.value }),
}));

vi.mock("@/services/event.service", () => ({
  eventService: {
    updateBranding,
    uploadBrandingAsset: vi.fn(),
    getBrandingAsset: vi.fn(),
  },
}));

const props = {
  eventId: "event-1",
  eventSlug: "winter-night",
  eventName: "Winter Night",
  eventDescription: "A fictional Event",
  initialBranding: null,
};

describe("EventBrandingWorkspace", () => {
  beforeEach(() => {
    updateBranding.mockReset();
    updateBranding.mockResolvedValue({});
    authRole.value = "OWNER";
  });

  it("allows an owner to save controlled branding", async () => {
    const user = userEvent.setup();
    render(<EventBrandingWorkspace {...props} />);

    await user.type(screen.getByLabelText("Hero headline"), "Skate tonight");
    await user.click(screen.getByRole("button", { name: "Save branding" }));

    await waitFor(() => expect(updateBranding).toHaveBeenCalledTimes(1));
    expect(updateBranding).toHaveBeenCalledWith(
      "event-1",
      expect.objectContaining({
        heroHeadline: "Skate tonight",
        primaryColor: "#0F172A",
        headingFont: "INTER",
      }),
    );
    expect(screen.getByRole("status")).toHaveTextContent("Branding saved");
  });

  it("keeps the workspace read-only for a member", () => {
    authRole.value = "MEMBER";
    render(<EventBrandingWorkspace {...props} />);

    expect(screen.getByText(/Members can preview branding/)).toBeVisible();
    expect(screen.queryByRole("button", { name: "Save branding" })).toBeNull();
    expect(screen.getByLabelText("Hero headline")).toBeDisabled();
  });
});
