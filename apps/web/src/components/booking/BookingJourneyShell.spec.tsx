import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getEvent, getEventSite } = vi.hoisted(() => ({
  getEvent: vi.fn(),
  getEventSite: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/book/event-1/tickets",
}));

vi.mock("@/services/public-booking.service", () => ({
  publicBookingService: {
    getEvent,
    getEventSite,
    brandingAssetUrl: (slug: string, assetId: string) =>
      `http://api.test/public/event-sites/${slug}/assets/${assetId}`,
  },
}));

import { BookingJourneyProvider } from "./BookingJourneyProvider";
import { BookingJourneyShell } from "./BookingJourneyShell";

describe("BookingJourneyShell", () => {
  beforeEach(() => {
    getEvent.mockResolvedValue({ id: "event-1", slug: "winter-festival" });
    getEventSite.mockResolvedValue({
      id: "event-1",
      name: "Winter Festival",
      slug: "winter-festival",
      branding: {
        primaryColor: "#123456",
        secondaryColor: "#345678",
        accentColor: "#F59E0B",
        backgroundColor: "#FAFAF5",
        surfaceColor: "#FFFFFF",
        textColor: "#172033",
        headingFont: "PLAYFAIR_DISPLAY",
        bodyFont: "NUNITO_SANS",
        heroHeadline: null,
        heroDescription: null,
        logoAsset: { id: "logo-1", width: 320, height: 120 },
        heroAsset: null,
      },
    });
  });

  it("applies the published Event identity across the routed booking shell", async () => {
    render(
      <BookingJourneyProvider eventId="event-1">
        <BookingJourneyShell>
          <h1>Choose your Tickets</h1>
        </BookingJourneyShell>
      </BookingJourneyProvider>,
    );

    const logo = await screen.findByRole("img", { name: "Winter Festival logo" });
    expect(logo).toHaveAttribute(
      "src",
      "http://api.test/public/event-sites/winter-festival/assets/logo-1",
    );
    expect(getEventSite).toHaveBeenCalledWith("winter-festival");

    const shell = screen.getByRole("main");
    await waitFor(() => {
      expect(shell.style.getPropertyValue("--booking-primary")).toBe("#123456");
    });
    expect(shell.style.getPropertyValue("--booking-accent")).toBe("#F59E0B");
    expect(shell.style.getPropertyValue("--booking-heading-font")).toContain("Georgia");
    expect(screen.getByText("Tickets").closest("li")).toHaveAttribute(
      "aria-current",
      "step",
    );
  });
});
