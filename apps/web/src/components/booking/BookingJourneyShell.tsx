"use client";

import { Check } from "lucide-react";
import { usePathname } from "next/navigation";
import type { CSSProperties } from "react";

import { useBookingJourney } from "./BookingJourneyProvider";
import { defaultEventBranding, eventFontFamilies } from "./event-branding";
import { publicBookingService } from "@/services/public-booking.service";

const steps = [
  ["session", "Session"],
  ["tickets", "Tickets"],
  ["participants", "Participants"],
  ["addons", "Add-ons"],
  ["details", "Your details"],
  ["review", "Review"],
  ["payment", "Payment"],
  ["confirmation", "Confirmation"],
] as const;

export function BookingJourneyShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { eventSite, eventSiteLoaded } = useBookingJourney();
  const activeIndex = Math.max(
    0,
    steps.findIndex(([slug]) => pathname.endsWith(`/${slug}`)),
  );
  const branding = eventSite?.branding ?? defaultEventBranding;
  const logoUrl = eventSite && branding.logoAsset
    ? publicBookingService.brandingAssetUrl(eventSite.slug, branding.logoAsset.id)
    : null;
  const theme = {
    "--booking-primary": branding.primaryColor,
    "--booking-secondary": branding.secondaryColor,
    "--booking-accent": branding.accentColor,
    "--booking-background": branding.backgroundColor,
    "--booking-surface": branding.surfaceColor,
    "--booking-text": branding.textColor,
    "--booking-heading-font": eventFontFamilies[branding.headingFont],
    "--booking-body-font": eventFontFamilies[branding.bodyFont],
    backgroundColor: branding.backgroundColor,
    color: branding.textColor,
    fontFamily: eventFontFamilies[branding.bodyFont],
  } as CSSProperties;

  return (
    <main className="event-booking-theme min-h-screen" style={theme}>
      <header className="booking-header border-b">
        <div className="mx-auto max-w-6xl px-5 py-5 sm:px-8">
          <div className="flex min-h-14 items-center justify-between gap-4">
            <div>
              {logoUrl ? (
                // This URL exposes only the Event's explicitly published logo.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt={`${eventSite?.name ?? "Event"} logo`}
                  className="max-h-14 max-w-44 object-contain"
                />
              ) : (
                <p className="booking-heading text-lg font-bold">
                  {eventSite?.name ?? (eventSiteLoaded ? "Glacier" : "Loading Event…")}
                </p>
              )}
              <p className="mt-1 text-sm opacity-60">Secure Event booking</p>
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] opacity-50">
              Powered by Glacier
            </p>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        <nav aria-label="Booking progress" className="overflow-x-auto pb-3">
          <ol className="flex min-w-max gap-2">
            {steps.map(([slug, label], index) => {
              const complete = index < activeIndex;
              const active = index === activeIndex;
              return (
                <li
                  key={slug}
                  aria-current={active ? "step" : undefined}
                  className={[
                    "flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold",
                    active ? "booking-progress-active" : "booking-progress-inactive",
                  ].join(" ")}
                >
                  <span className="grid size-5 place-items-center rounded-full border text-[11px]">
                    {complete ? <Check className="size-3" /> : index + 1}
                  </span>
                  {label}
                </li>
              );
            })}
          </ol>
        </nav>
        {children}
      </div>
    </main>
  );
}
