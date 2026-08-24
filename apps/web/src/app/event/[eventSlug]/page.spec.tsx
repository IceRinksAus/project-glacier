import { act, render, screen } from "@testing-library/react";
import { Suspense } from "react";
import { describe, expect, it, vi } from "vitest";

import PublicEventPage from "./page";

const { getEventSite } = vi.hoisted(() => ({ getEventSite: vi.fn() }));

vi.mock("@/services/public-booking.service", () => ({
  publicBookingService: {
    getEventSite,
    brandingAssetUrl: (slug: string, id: string) => `/asset/${slug}/${id}`,
  },
}));

describe("PublicEventPage", () => {
  it("renders the branded ACTIVE Event entry point and booking CTA", async () => {
    getEventSite.mockResolvedValue({
      id: "event-1", name: "Winter Night", slug: "winter-night",
      description: "Skate under the stars.", startDate: "2027-07-01T00:00:00.000Z",
      endDate: "2027-07-02T00:00:00.000Z", timezone: "Australia/Melbourne",
      status: "ACTIVE", waiverPublicSlug: null, venueName: "Preview Arena", suburb: "Melbourne",
      branding: { ...defaultTestBranding, heroHeadline: "The ice comes alive" },
    });

    const params = Promise.resolve({ eventSlug: "winter-night" });
    await act(async () => {
      render(
        <Suspense fallback={<p>Loading route…</p>}>
          <PublicEventPage params={params} />
        </Suspense>,
      );
      await params;
    });

    expect(await screen.findByRole("heading", { name: "The ice comes alive" })).toBeVisible();
    expect(screen.getByRole("link", { name: /Book tickets/ })).toHaveAttribute("href", "/book/event-1/date");
    expect(screen.getByText("Preview Arena, Melbourne")).toBeVisible();
  });

  it("uses a non-enumerating unavailable state", async () => {
    getEventSite.mockRejectedValue(new Error("not found"));
    const params = Promise.resolve({ eventSlug: "private" });
    await act(async () => {
      render(
        <Suspense fallback={<p>Loading route…</p>}>
          <PublicEventPage params={params} />
        </Suspense>,
      );
      await params;
    });
    expect(await screen.findByRole("heading", { name: "Event unavailable" })).toBeVisible();
  });
});

const defaultTestBranding = {
  primaryColor: "#0F172A", secondaryColor: "#334155", accentColor: "#0EA5E9",
  backgroundColor: "#FFFFFF", surfaceColor: "#F8FAFC", textColor: "#0F172A",
  headingFont: "INTER", bodyFont: "INTER", heroDescription: null,
  logoAsset: null, heroAsset: null,
};
