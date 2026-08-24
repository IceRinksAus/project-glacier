"use client";

import { ArrowRight, CalendarDays, MapPin, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";

import {
  defaultEventBranding,
  eventFontFamilies,
} from "@/components/booking/event-branding";
import {
  PublicEventSite,
  publicBookingService,
} from "@/services/public-booking.service";

export default function PublicEventPage({
  params,
}: {
  params: Promise<{ eventSlug: string }>;
}) {
  const { eventSlug } = use(params);
  const [event, setEvent] = useState<PublicEventSite | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void publicBookingService
      .getEventSite(eventSlug)
      .then((result) => { if (active) setEvent(result); })
      .catch(() => { if (active) setError("This Event is not available."); });
    return () => { active = false; };
  }, [eventSlug]);

  const dates = useMemo(() => {
    if (!event) return "";
    const options: Intl.DateTimeFormatOptions = {
      dateStyle: "long",
      timeZone: event.timezone ?? "Australia/Melbourne",
    };
    const start = new Intl.DateTimeFormat("en-AU", options).format(new Date(event.startDate));
    const end = new Intl.DateTimeFormat("en-AU", options).format(new Date(event.endDate));
    return start === end ? start : `${start} – ${end}`;
  }, [event]);

  if (error) {
    return <main className="grid min-h-screen place-items-center bg-slate-50 p-6"><div className="max-w-md text-center"><p className="text-sm font-semibold uppercase tracking-widest text-slate-500">Glacier</p><h1 className="mt-4 text-3xl font-bold">Event unavailable</h1><p className="mt-3 text-slate-600">{error}</p></div></main>;
  }
  if (!event) return <main className="grid min-h-screen place-items-center bg-slate-50"><p>Loading Event…</p></main>;

  const branding = event.branding ?? defaultEventBranding;
  const logoUrl = branding.logoAsset
    ? publicBookingService.brandingAssetUrl(event.slug, branding.logoAsset.id)
    : null;
  const heroUrl = branding.heroAsset
    ? publicBookingService.brandingAssetUrl(event.slug, branding.heroAsset.id)
    : null;

  return (
    <main
      className="min-h-screen"
      style={{
        backgroundColor: branding.backgroundColor,
        color: branding.textColor,
        fontFamily: eventFontFamilies[branding.bodyFont],
      }}
    >
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <div className="flex items-center gap-3">
          {logoUrl ? (
            // Public URL exposes only an explicitly published Event asset.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={`${event.name} logo`} className="max-h-14 max-w-40 object-contain" />
          ) : <span className="text-lg font-bold">{event.name}</span>}
        </div>
        <span className="text-xs font-semibold uppercase tracking-[0.2em] opacity-60">Powered by Glacier</span>
      </header>

      <section
        className="relative overflow-hidden"
        style={{ backgroundColor: branding.primaryColor, color: branding.backgroundColor }}
      >
        {heroUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={heroUrl} alt="" className="absolute inset-0 size-full object-cover opacity-35" />
        ) : null}
        <div className="relative mx-auto grid min-h-[520px] max-w-6xl content-center px-5 py-20 sm:px-8 lg:py-28">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] opacity-80">{event.name}</p>
          <h1 className="mt-5 max-w-4xl text-4xl font-bold leading-tight sm:text-6xl" style={{ fontFamily: eventFontFamilies[branding.headingFont] }}>
            {branding.heroHeadline || event.name}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 opacity-90">
            {branding.heroDescription || event.description || "Choose your session and book your Event experience."}
          </p>
          <div className="mt-9">
            <Link href={`/book/${event.id}/session`} className="inline-flex items-center gap-2 rounded-xl px-6 py-3 font-bold shadow-lg transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4" style={{ backgroundColor: branding.accentColor, color: branding.textColor }}>
              Book tickets <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-5 px-5 py-14 sm:px-8 md:grid-cols-3">
        <Info icon={<CalendarDays />} label="Event dates" value={dates} surface={branding.surfaceColor} />
        <Info icon={<MapPin />} label="Location" value={[event.venueName, event.suburb].filter(Boolean).join(", ") || "Location details coming soon"} surface={branding.surfaceColor} />
        <Info icon={<ShieldCheck />} label="Secure booking" value="Tickets and payments are processed securely by Glacier." surface={branding.surfaceColor} />
      </section>

      {event.description ? <section className="mx-auto max-w-3xl px-5 pb-14 text-center sm:px-8"><h2 className="text-2xl font-bold" style={{ fontFamily: eventFontFamilies[branding.headingFont] }}>About this Event</h2><p className="mt-4 leading-7 opacity-75">{event.description}</p>{event.waiverPublicSlug ? <Link className="mt-5 inline-block font-semibold underline underline-offset-4" href={`/waivers/${event.waiverPublicSlug}`}>View Event Waiver</Link> : null}</section> : null}
    </main>
  );
}

function Info({ icon, label, value, surface }: { icon: React.ReactNode; label: string; value: string; surface: string }) {
  return <div className="rounded-2xl p-6" style={{ backgroundColor: surface }}><span className="opacity-60">{icon}</span><p className="mt-5 text-xs font-semibold uppercase tracking-widest opacity-55">{label}</p><p className="mt-2 font-semibold leading-6">{value}</p></div>;
}
