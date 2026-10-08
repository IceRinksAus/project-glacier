"use client";

import {
  Accessibility,
  ArrowRight,
  CalendarDays,
  CarFront,
  ChevronDown,
  Clock3,
  Coffee,
  MapPin,
  ShieldCheck,
  Sparkles,
  ThermometerSnowflake,
} from "lucide-react";
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

export default function PublicEventPage({ params }: { params: Promise<{ eventSlug: string }> }) {
  const { eventSlug } = use(params);
  const [event, setEvent] = useState<PublicEventSite | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void publicBookingService.getEventSite(eventSlug)
      .then((result) => { if (active) setEvent(result); })
      .catch(() => { if (active) setError("This Event is not available."); });
    return () => { active = false; };
  }, [eventSlug]);

  const dates = useMemo(() => {
    if (!event) return "";
    const formatter = new Intl.DateTimeFormat("en-AU", {
      dateStyle: "long",
      timeZone: event.timezone ?? "Australia/Melbourne",
    });
    const start = formatter.format(new Date(event.startDate));
    const end = formatter.format(new Date(event.endDate));
    return start === end ? start : `${start} – ${end}`;
  }, [event]);

  if (error) {
    return <main className="grid min-h-screen place-items-center bg-slate-50 p-6"><div className="max-w-md text-center"><p className="text-sm font-semibold uppercase tracking-widest text-slate-500">Glacier</p><h1 className="mt-4 text-3xl font-bold">Event unavailable</h1><p className="mt-3 text-slate-600">{error}</p></div></main>;
  }
  if (!event) return <main className="grid min-h-screen place-items-center bg-slate-50"><p role="status">Loading Event…</p></main>;

  const branding = event.branding ?? defaultEventBranding;
  const content = event.siteContent;
  const logoUrl = branding.logoAsset ? publicBookingService.brandingAssetUrl(event.slug, branding.logoAsset.id) : null;
  const heroUrl = branding.heroAsset ? publicBookingService.brandingAssetUrl(event.slug, branding.heroAsset.id) : null;
  const location = [event.venueName, event.suburb].filter(Boolean).join(", ") || "Location details coming soon";
  const hasAbout = Boolean(content?.aboutBody || event.description);
  const hasHighlights = Boolean(content?.highlights.length);
  const visitItems = [
    { label: "Arrival", value: content?.arrivalInfo, icon: Clock3 },
    { label: "Transport & parking", value: content?.transportParkingInfo, icon: CarFront },
    { label: "Accessibility", value: content?.accessibilityInfo, icon: Accessibility },
    { label: "Food & drink", value: content?.foodDrinkInfo, icon: Coffee },
    { label: "What to bring", value: content?.whatToBringInfo, icon: ThermometerSnowflake },
  ].filter((item) => Boolean(item.value));
  const hasFaqs = Boolean(content?.faqs.length);

  return (
    <main className="min-h-screen" style={{ backgroundColor: branding.backgroundColor, color: branding.textColor, fontFamily: eventFontFamilies[branding.bodyFont] }}>
      <a href="#main-content" className="sr-only z-50 rounded-md bg-white px-4 py-2 text-slate-950 focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Skip to Event information</a>

      <header className="sticky top-0 z-40 border-b border-black/10 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex min-h-20 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
          <a href="#top" className="flex min-w-0 items-center gap-3">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={`${event.name} logo`} className="max-h-12 max-w-36 object-contain" />
            ) : <span className="truncate text-lg font-bold">{event.name}</span>}
          </a>
          <nav aria-label="Event website" className="hidden items-center gap-5 text-sm font-semibold md:flex">
            {hasAbout ? <a href="#about">About</a> : null}
            {hasHighlights ? <a href="#highlights">What&apos;s on</a> : null}
            {visitItems.length ? <a href="#visit">Plan your visit</a> : null}
            {hasFaqs ? <a href="#faqs">FAQs</a> : null}
          </nav>
          <BookTicketsLink eventId={event.id} accent={branding.accentColor} text={branding.textColor} compact />
        </div>
      </header>

      <div id="top" />
      <section className="relative overflow-hidden" style={{ backgroundColor: branding.primaryColor, color: branding.backgroundColor }}>
        {heroUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={heroUrl} alt="" className="absolute inset-0 size-full object-cover opacity-40" />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/20 to-transparent" />
        <div className="relative mx-auto grid min-h-[560px] max-w-6xl content-center px-5 py-20 sm:px-8 lg:py-28">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] opacity-85">{event.name}</p>
          <h1 className="mt-5 max-w-4xl text-4xl font-bold leading-tight sm:text-6xl" style={{ fontFamily: eventFontFamilies[branding.headingFont] }}>{branding.heroHeadline || event.name}</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 opacity-95">{branding.heroDescription || event.description || "Choose your session and book your Event experience."}</p>
          <div className="mt-6 flex flex-col gap-2 text-sm font-semibold sm:flex-row sm:gap-6">
            <span className="inline-flex items-center gap-2"><CalendarDays className="size-5" aria-hidden="true" /> {dates}</span>
            <span className="inline-flex items-center gap-2"><MapPin className="size-5" aria-hidden="true" /> {location}</span>
          </div>
          <div className="mt-9"><BookTicketsLink eventId={event.id} accent={branding.accentColor} text={branding.textColor} /></div>
        </div>
      </section>

      <div id="main-content">
        <section aria-labelledby="essentials-heading" className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
          <h2 id="essentials-heading" className="sr-only">Event essentials</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Info icon={<CalendarDays />} label="Event dates" value={dates} surface={branding.surfaceColor} />
            <Info icon={<MapPin />} label="Location" value={location} surface={branding.surfaceColor} />
            {event.waiverPublicSlug ? (
              <Link href={`/waivers/${event.waiverPublicSlug}`} className="rounded-2xl p-6 transition-transform motion-reduce:transition-none hover:-translate-y-0.5 motion-reduce:hover:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4" style={{ backgroundColor: branding.surfaceColor }}>
                <ShieldCheck className="size-6 opacity-60" aria-hidden="true" /><p className="mt-5 text-xs font-semibold uppercase tracking-widest opacity-55">Event waiver</p><p className="mt-2 font-semibold leading-6">Complete or view the participation Waiver</p>
              </Link>
            ) : <Info icon={<ShieldCheck />} label="Secure booking" value="Tickets and payments are processed securely by Glacier." surface={branding.surfaceColor} />}
          </div>
        </section>

        {hasAbout ? (
          <section id="about" aria-labelledby="about-heading" className="scroll-mt-28 px-5 py-16 sm:px-8"><div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-[0.55fr_1fr]"><div><p className="text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: branding.secondaryColor }}>Discover the Event</p><h2 id="about-heading" className="mt-3 text-3xl font-bold sm:text-4xl" style={{ fontFamily: eventFontFamilies[branding.headingFont] }}>{content?.aboutTitle || `About ${event.name}`}</h2></div><p className="whitespace-pre-line text-lg leading-8 opacity-80">{content?.aboutBody || event.description}</p></div></section>
        ) : null}

        {hasHighlights ? (
          <section id="highlights" aria-labelledby="highlights-heading" className="scroll-mt-28 px-5 py-16 sm:px-8" style={{ backgroundColor: branding.surfaceColor }}><div className="mx-auto max-w-6xl"><p className="text-center text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: branding.secondaryColor }}>Experience the Event</p><h2 id="highlights-heading" className="mt-3 text-center text-3xl font-bold sm:text-4xl" style={{ fontFamily: eventFontFamilies[branding.headingFont] }}>What&apos;s on</h2><div className="mt-9 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{content?.highlights.map((highlight, index) => <article key={`${highlight.title}-${index}`} className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm"><span className="grid size-11 place-items-center rounded-xl" style={{ backgroundColor: `${branding.accentColor}20`, color: branding.primaryColor }}><Sparkles className="size-5" aria-hidden="true" /></span><h3 className="mt-5 text-xl font-bold">{highlight.title}</h3><p className="mt-3 whitespace-pre-line leading-7 opacity-75">{highlight.description}</p></article>)}</div></div></section>
        ) : null}

        {visitItems.length ? (
          <section id="visit" aria-labelledby="visit-heading" className="scroll-mt-28 px-5 py-16 sm:px-8"><div className="mx-auto max-w-6xl"><p className="text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: branding.secondaryColor }}>Before you arrive</p><h2 id="visit-heading" className="mt-3 text-3xl font-bold sm:text-4xl" style={{ fontFamily: eventFontFamilies[branding.headingFont] }}>Plan your visit</h2><div className="mt-9 grid gap-5 md:grid-cols-2">{visitItems.map(({ label, value, icon: Icon }) => <article key={label} className="rounded-2xl border border-black/10 p-6"><Icon className="size-6" style={{ color: branding.secondaryColor }} aria-hidden="true" /><h3 className="mt-4 text-lg font-bold">{label}</h3><p className="mt-2 whitespace-pre-line leading-7 opacity-75">{value}</p></article>)}</div></div></section>
        ) : null}

        {hasFaqs ? (
          <section id="faqs" aria-labelledby="faqs-heading" className="scroll-mt-28 px-5 py-16 sm:px-8" style={{ backgroundColor: branding.surfaceColor }}><div className="mx-auto max-w-3xl"><p className="text-center text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: branding.secondaryColor }}>Helpful information</p><h2 id="faqs-heading" className="mt-3 text-center text-3xl font-bold sm:text-4xl" style={{ fontFamily: eventFontFamilies[branding.headingFont] }}>Frequently asked questions</h2><div className="mt-8 space-y-3">{content?.faqs.map((faq, index) => <details key={`${faq.question}-${index}`} className="group rounded-xl border border-black/10 bg-white p-5"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">{faq.question}<ChevronDown className="size-5 shrink-0 transition-transform motion-reduce:transition-none group-open:rotate-180" aria-hidden="true" /></summary><p className="mt-4 whitespace-pre-line leading-7 opacity-75">{faq.answer}</p></details>)}</div></div></section>
        ) : null}

        <section className="px-5 py-16 text-center sm:px-8"><div className="mx-auto max-w-4xl rounded-3xl px-6 py-12 sm:px-12" style={{ backgroundColor: branding.primaryColor, color: branding.backgroundColor }}><h2 className="text-3xl font-bold" style={{ fontFamily: eventFontFamilies[branding.headingFont] }}>Ready to join us?</h2><p className="mx-auto mt-3 max-w-xl leading-7 opacity-85">Choose a date and session, then build your Event experience.</p><div className="mt-7"><BookTicketsLink eventId={event.id} accent={branding.accentColor} text={branding.textColor} /></div></div></section>
      </div>

      <footer className="border-t border-black/10 px-5 py-8 text-sm opacity-65 sm:px-8"><div className="mx-auto flex max-w-6xl flex-col justify-between gap-2 sm:flex-row"><span>{event.name}</span><span>Ticketing powered by Glacier</span></div></footer>
    </main>
  );
}

function BookTicketsLink({ eventId, accent, text, compact = false }: { eventId: string; accent: string; text: string; compact?: boolean }) {
  return <Link href={`/book/${eventId}/date`} className={`inline-flex items-center justify-center gap-2 rounded-xl font-bold shadow-lg transition-transform motion-reduce:transition-none hover:-translate-y-0.5 motion-reduce:hover:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 ${compact ? "px-4 py-2 text-sm" : "px-6 py-3"}`} style={{ backgroundColor: accent, color: text }}>Book tickets <ArrowRight className="size-4" aria-hidden="true" /></Link>;
}

function Info({ icon, label, value, surface }: { icon: React.ReactNode; label: string; value: string; surface: string }) {
  return <div className="rounded-2xl p-6" style={{ backgroundColor: surface }}><span className="opacity-60" aria-hidden="true">{icon}</span><p className="mt-5 text-xs font-semibold uppercase tracking-widest opacity-55">{label}</p><p className="mt-2 font-semibold leading-6">{value}</p></div>;
}
