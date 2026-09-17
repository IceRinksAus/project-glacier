import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { EventBrandingWorkspace } from "./EventBrandingWorkspace";

const { updateBranding, authRole, writeText } = vi.hoisted(() => ({
  updateBranding: vi.fn(),
  authRole: { value: "OWNER" },
  writeText: vi.fn(),
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
  eventStatus: "DRAFT",
  initialBranding: null,
};

describe("EventBrandingWorkspace", () => {
  beforeEach(() => {
    updateBranding.mockReset();
    updateBranding.mockResolvedValue({});
    writeText.mockReset();
    writeText.mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
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

  it("keeps draft previews private and does not offer a public URL", () => {
    render(<EventBrandingWorkspace {...props} />);

    expect(screen.getByText("Private draft preview")).toBeVisible();
    expect(screen.getByText("Authenticated design preview")).toBeVisible();
    expect(screen.getByRole("link", { name: "Preview design" })).toHaveAttribute("href", "#website-design-preview");
    expect(screen.queryByRole("button", { name: "Copy public URL" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Open live website" })).not.toBeInTheDocument();
  });

  it("uses the current web origin for an active Event public URL", async () => {
    render(<EventBrandingWorkspace {...props} eventStatus="ACTIVE" />);

    expect(screen.getByText("Public website is live")).toBeVisible();
    expect(screen.getByText(`${window.location.origin}/event/winter-night`)).toBeVisible();
    expect(screen.getByRole("link", { name: "Open live website" })).toHaveAttribute(
      "href",
      `${window.location.origin}/event/winter-night`,
    );
    fireEvent.click(screen.getByRole("button", { name: "Copy public URL" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/event/winter-night`));
    expect(screen.getByRole("status")).toHaveTextContent("Public URL copied");
  });
});
