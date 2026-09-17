"use client";

import { useEffect, useMemo, useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { getAuthUser } from "@/lib/auth";
import {
  EventBranding,
  EventBrandingAsset,
  EventBrandingFont,
  PersistedEventBranding,
  eventService,
} from "@/services/event.service";

const defaults: EventBranding = {
  primaryColor: "#0F172A",
  secondaryColor: "#334155",
  accentColor: "#0EA5E9",
  backgroundColor: "#FFFFFF",
  surfaceColor: "#F8FAFC",
  textColor: "#0F172A",
  headingFont: "INTER",
  bodyFont: "INTER",
  heroHeadline: "",
  heroDescription: "",
};

const fonts: { value: EventBrandingFont; label: string }[] = [
  { value: "INTER", label: "Inter · clean and modern" },
  { value: "NUNITO_SANS", label: "Nunito Sans · friendly and rounded" },
  { value: "PLAYFAIR_DISPLAY", label: "Playfair Display · editorial" },
  { value: "OSWALD", label: "Oswald · strong and condensed" },
];

function ImagePreview({
  eventId,
  asset,
  alt,
  className,
}: {
  eventId: string;
  asset: EventBrandingAsset | null;
  alt: string;
  className: string;
}) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    if (!asset) return;
    let objectUrl = "";
    void eventService.getBrandingAsset(eventId, asset.id).then((blob) => {
      objectUrl = URL.createObjectURL(blob);
      setUrl(objectUrl);
    });
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [asset, eventId]);
  if (!asset || !url) return null;
  // Authenticated object URLs are intentionally used instead of exposing storage keys.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={alt} className={className} />;
}

export function EventBrandingWorkspace({
  eventId,
  eventSlug,
  eventName,
  eventDescription,
  eventStatus,
  initialBranding,
}: {
  eventId: string;
  eventSlug: string;
  eventName: string;
  eventDescription: string | null;
  eventStatus: string;
  initialBranding: PersistedEventBranding | null;
}) {
  const canEdit = getAuthUser()?.role === "OWNER";
  const [branding, setBranding] = useState<EventBranding>(initialBranding ?? defaults);
  const [logo, setLogo] = useState(initialBranding?.logoAsset ?? null);
  const [hero, setHero] = useState(initialBranding?.heroAsset ?? null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const publicUrl = useMemo(
    () =>
      typeof window === "undefined"
        ? `/event/${eventSlug}`
        : `${window.location.origin}/event/${eventSlug}`,
    [eventSlug],
  );
  const isPublished = eventStatus === "ACTIVE";

  function update<K extends keyof EventBranding>(key: K, value: EventBranding[K]) {
    setBranding((current) => ({ ...current, [key]: value }));
    setMessage(""); setError("");
  }

  async function save() {
    setBusy(true); setError(""); setMessage("");
    try {
      await eventService.updateBranding(eventId, {
        ...branding,
        heroHeadline: branding.heroHeadline?.trim() || undefined,
        heroDescription: branding.heroDescription?.trim() || undefined,
      });
      setMessage("Branding saved.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save branding.");
    } finally { setBusy(false); }
  }

  async function copyPublicUrl() {
    setMessage(""); setError("");
    try {
      await navigator.clipboard.writeText(publicUrl);
      setMessage("Public URL copied.");
    } catch {
      setError("Unable to copy the public URL. You can select it from the live website panel instead.");
    }
  }

  async function upload(
    purpose: "EVENT_LOGO" | "EVENT_HERO",
    file: File | undefined,
  ) {
    if (!file) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const asset = await eventService.uploadBrandingAsset(eventId, purpose, file);
      if (purpose === "EVENT_LOGO") setLogo(asset); else setHero(asset);
      setMessage(`${purpose === "EVENT_LOGO" ? "Logo" : "Hero image"} uploaded.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to upload image.");
    } finally { setBusy(false); }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.8fr)]">
      <section className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Website & branding</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Your Event keeps Glacier&apos;s booking structure while using this controlled visual identity.
            </p>
          </div>
          {isPublished ? (
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => void copyPublicUrl()}>
                Copy public URL
              </Button>
              <a className={buttonVariants({ variant: "outline" })} href={publicUrl} target="_blank" rel="noreferrer">Open live website</a>
            </div>
          ) : (
            <a className={buttonVariants({ variant: "outline" })} href="#website-design-preview">Preview design</a>
          )}
        </div>

        {isPublished ? (
          <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
            <p className="font-medium">Public website is live</p>
            <p className="mt-1 break-all text-muted-foreground">{publicUrl}</p>
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-amber-300/60 bg-amber-50 p-4 text-sm text-amber-950">
            <p className="font-medium">Private draft preview</p>
            <p className="mt-1 text-amber-900/80">This authenticated preview is visible to your team. A public URL will be available after the Event is activated.</p>
          </div>
        )}

        {!canEdit ? <p className="mt-4 rounded-lg bg-muted p-3 text-sm">Members can preview branding. Only an owner can change it.</p> : null}

        <div className="mt-4 grid gap-2 sm:grid-cols-3" aria-label="Website readiness">
          <ReadinessState label="Event logo" ready={Boolean(logo)} />
          <ReadinessState label="Hero image" ready={Boolean(hero)} />
          <ReadinessState label="Hero copy" ready={Boolean(branding.heroHeadline?.trim() || eventName)} />
        </div>

        <fieldset disabled={!canEdit || busy} className="mt-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {([
              ["primaryColor", "Primary"], ["secondaryColor", "Secondary"],
              ["accentColor", "Accent"], ["backgroundColor", "Background"],
              ["surfaceColor", "Surface"], ["textColor", "Text"],
            ] as const).map(([key, label]) => (
              <label key={key} className="text-sm font-medium">
                {label} colour
                <span className="mt-2 flex h-11 items-center gap-3 rounded-lg border px-3">
                  <input type="color" value={branding[key]} onChange={(event) => update(key, event.target.value.toUpperCase())} className="size-7" />
                  <span className="font-mono text-xs">{branding[key]}</span>
                </span>
              </label>
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {(["headingFont", "bodyFont"] as const).map((key) => (
              <label key={key} className="text-sm font-medium">
                {key === "headingFont" ? "Heading font" : "Body font"}
                <select value={branding[key]} onChange={(event) => update(key, event.target.value as EventBrandingFont)} className="mt-2 h-11 w-full rounded-lg border bg-background px-3 text-sm">
                  {fonts.map((font) => <option key={font.value} value={font.value}>{font.label}</option>)}
                </select>
              </label>
            ))}
          </div>
          <label className="block text-sm font-medium">Hero headline
            <input maxLength={120} value={branding.heroHeadline ?? ""} onChange={(event) => update("heroHeadline", event.target.value)} className="mt-2 h-11 w-full rounded-lg border bg-background px-3 text-sm" />
          </label>
          <label className="block text-sm font-medium">Hero supporting copy
            <textarea maxLength={500} value={branding.heroDescription ?? ""} onChange={(event) => update("heroDescription", event.target.value)} className="mt-2 min-h-24 w-full rounded-lg border bg-background p-3 text-sm" />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="rounded-lg border p-4 text-sm font-medium">Event logo
              <span className="mt-1 block text-xs font-normal text-muted-foreground">PNG/JPEG · 2 MB · 64–4000 px</span>
              <input type="file" accept="image/png,image/jpeg" className="mt-3 block w-full text-xs" onChange={(event) => void upload("EVENT_LOGO", event.target.files?.[0])} />
              {logo ? <span className="mt-2 block text-xs">{logo.displayName} · {logo.width} × {logo.height}</span> : null}
            </label>
            <label className="rounded-lg border p-4 text-sm font-medium">Hero image
              <span className="mt-1 block text-xs font-normal text-muted-foreground">PNG/JPEG · 5 MB · minimum 600 × 300 px</span>
              <input type="file" accept="image/png,image/jpeg" className="mt-3 block w-full text-xs" onChange={(event) => void upload("EVENT_HERO", event.target.files?.[0])} />
              {hero ? <span className="mt-2 block text-xs">{hero.displayName} · {hero.width} × {hero.height}</span> : null}
            </label>
          </div>
          {canEdit ? <Button type="button" disabled={busy} onClick={() => void save()}>{busy ? "Saving..." : "Save branding"}</Button> : null}
        </fieldset>
        {message ? <p role="status" className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p> : null}
        {error ? <p role="alert" className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}
      </section>

      <section id="website-design-preview" className="scroll-mt-6 rounded-xl border bg-card p-5 shadow-sm">
        <p className="text-sm font-medium">{isPublished ? "Public website preview" : "Authenticated design preview"}</p>
        <div className="mt-3 overflow-hidden rounded-2xl border" style={{ backgroundColor: branding.backgroundColor, color: branding.textColor }}>
          <div className="relative min-h-80 p-7" style={{ backgroundColor: branding.primaryColor, color: branding.backgroundColor }}>
            <ImagePreview eventId={eventId} asset={hero} alt="" className="absolute inset-0 size-full object-cover opacity-30" />
            <div className="relative">
              <ImagePreview eventId={eventId} asset={logo} alt={`${eventName} logo`} className="max-h-16 max-w-40 object-contain" />
              <p className="mt-8 text-xs font-semibold uppercase tracking-widest">{eventName}</p>
              <h3 className="mt-4 text-3xl font-bold">{branding.heroHeadline || eventName}</h3>
              <p className="mt-3 text-sm opacity-90">{branding.heroDescription || eventDescription || "Book your Event experience."}</p>
              <span className="mt-6 inline-block rounded-lg px-4 py-2 text-sm font-semibold" style={{ backgroundColor: branding.accentColor, color: branding.textColor }}>Book tickets</span>
            </div>
          </div>
          <div className="p-5" style={{ backgroundColor: branding.surfaceColor }}><p className="font-semibold">Your booking journey</p><p className="mt-1 text-sm">The same identity continues across every step.</p></div>
        </div>
      </section>
    </div>
  );
}

function ReadinessState({ label, ready }: { label: string; ready: boolean }) {
  return (
    <p className={`rounded-lg border p-3 text-sm ${ready ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-amber-200 bg-amber-50 text-amber-900"}`}>
      <strong>{label}:</strong> {ready ? "Ready" : "Needs attention"}
    </p>
  );
}
