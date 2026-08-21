"use client";

import { fromZonedTime } from "date-fns-tz";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { PlatformShell } from "@/components/layout/PlatformShell";
import { Button } from "@/components/ui/button";
import { getAuthUser } from "@/lib/auth";
import {
  CreateGlacierEvent,
  EventBranding,
  EventBrandingFont,
  eventService,
} from "@/services/event.service";

const steps = [
  "Basics",
  "Branding",
  "Dates & timezone",
  "Venue & activity",
  "Gate entry",
  "Waiver & terms",
  "Review",
];

const timezones = [
  "Australia/Melbourne",
  "Australia/Sydney",
  "Australia/Brisbane",
  "Australia/Adelaide",
  "Australia/Perth",
  "Australia/Hobart",
  "Australia/Darwin",
  "Australia/Broken_Hill",
  "Australia/Eucla",
  "Australia/Lord_Howe",
];

const jurisdictions = [
  "ACT",
  "NSW",
  "NT",
  "QLD",
  "SA",
  "TAS",
  "VIC",
  "WA",
] as const;

interface WizardData {
  name: string;
  slug: string;
  description: string;
  startLocal: string;
  endLocal: string;
  timezone: string;
  venueName: string;
  addressLine1: string;
  addressLine2: string;
  suburb: string;
  postcode: string;
  jurisdiction: CreateGlacierEvent["jurisdiction"] | "";
  activityType: CreateGlacierEvent["activityType"];
  opensBefore: string;
  closesAfter: string;
  waiverChoice: "NONE" | "CONFIGURE" | "";
  branding: EventBranding;
}

const defaultBranding: EventBranding = {
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

const brandPresets: { name: string; branding: EventBranding }[] = [
  { name: "Glacier", branding: defaultBranding },
  {
    name: "Winter night",
    branding: {
      ...defaultBranding,
      primaryColor: "#172554",
      secondaryColor: "#1E3A8A",
      accentColor: "#38BDF8",
      backgroundColor: "#F8FAFC",
    },
  },
  {
    name: "Festival",
    branding: {
      ...defaultBranding,
      primaryColor: "#581C87",
      secondaryColor: "#86198F",
      accentColor: "#F59E0B",
      backgroundColor: "#FFFBEB",
      headingFont: "PLAYFAIR_DISPLAY",
    },
  },
];

const fontOptions: { value: EventBrandingFont; label: string }[] = [
  { value: "INTER", label: "Inter · clean and modern" },
  { value: "NUNITO_SANS", label: "Nunito Sans · friendly and rounded" },
  { value: "PLAYFAIR_DISPLAY", label: "Playfair Display · editorial" },
  { value: "OSWALD", label: "Oswald · strong and condensed" },
];

const initialData: WizardData = {
  name: "",
  slug: "",
  description: "",
  startLocal: "",
  endLocal: "",
  timezone: "Australia/Melbourne",
  venueName: "",
  addressLine1: "",
  addressLine2: "",
  suburb: "",
  postcode: "",
  jurisdiction: "",
  activityType: "ICE_SKATING",
  opensBefore: "30",
  closesAfter: "0",
  waiverChoice: "",
  branding: defaultBranding,
};

function makeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 200);
}

function fieldClass() {
  return "mt-2 h-11 w-full rounded-lg border bg-background px-3 text-sm";
}

function relativeLuminance(hex: string) {
  const channels = hex
    .slice(1)
    .match(/.{2}/g)
    ?.map((channel) => Number.parseInt(channel, 16) / 255)
    .map((channel) =>
      channel <= 0.03928
        ? channel / 12.92
        : ((channel + 0.055) / 1.055) ** 2.4,
    );
  if (!channels || channels.some(Number.isNaN)) return 0;
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function contrastRatio(first: string, second: string) {
  const [lighter, darker] = [
    relativeLuminance(first),
    relativeLuminance(second),
  ].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

export default function NewEventPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState(initialData);
  const [slugWasEdited, setSlugWasEdited] = useState(false);
  const [error, setError] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const role = getAuthUser()?.role;
    if (role && role !== "OWNER") router.replace("/events");
  }, [router]);

  const interpretedDates = useMemo(() => {
    try {
      if (!data.startLocal || !data.endLocal) return null;
      return {
        start: fromZonedTime(data.startLocal, data.timezone),
        end: fromZonedTime(data.endLocal, data.timezone),
      };
    } catch {
      return null;
    }
  }, [data.endLocal, data.startLocal, data.timezone]);

  const brandingContrastIssues = useMemo(() => {
    const issues: string[] = [];
    if (contrastRatio(data.branding.textColor, data.branding.backgroundColor) < 4.5)
      issues.push("Text needs more contrast against the page background.");
    if (contrastRatio(data.branding.backgroundColor, data.branding.primaryColor) < 4.5)
      issues.push("Hero text needs more contrast against the primary colour.");
    if (contrastRatio(data.branding.textColor, data.branding.accentColor) < 4.5)
      issues.push("Button text needs more contrast against the accent colour.");
    return issues;
  }, [data.branding]);

  function update<K extends keyof WizardData>(key: K, value: WizardData[K]) {
    setData((current) => ({ ...current, [key]: value }));
    setError("");
  }

  function validateCurrentStep() {
    if (step === 0) {
      if (!data.name.trim()) return "Enter an Event name.";
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.slug))
        return "Use a lowercase Event URL containing words and hyphens only.";
    }
    if (step === 1) {
      if (
        Object.values(data.branding)
          .filter((value) => typeof value === "string" && value.startsWith("#"))
          .some((value) => !/^#[0-9A-F]{6}$/.test(value))
      )
        return "Choose valid six-digit branding colours.";
      if (brandingContrastIssues.length > 0)
        return "Adjust the brand colours until the essential text contrast checks pass.";
    }
    if (step === 2) {
      if (!interpretedDates) return "Enter valid Event start and end times.";
      if (interpretedDates.end <= interpretedDates.start)
        return "Event end must be after Event start.";
    }
    if (step === 3) {
      if (
        !data.venueName.trim() ||
        !data.addressLine1.trim() ||
        !data.suburb.trim() ||
        !/^\d{4}$/.test(data.postcode) ||
        !data.jurisdiction
      )
        return "Complete the required venue, postcode and jurisdiction fields.";
    }
    if (step === 4) {
      const values = [Number(data.opensBefore), Number(data.closesAfter)];
      if (
        values.some(
          (value) => !Number.isInteger(value) || value < 0 || value > 240,
        )
      )
        return "Entry settings must be whole minutes from 0 to 240.";
    }
    if (step === 5 && !data.waiverChoice)
      return "Choose whether this Event requires Waiver setup.";
    return "";
  }

  function continueForward() {
    const validationError = validateCurrentStep();
    if (validationError) return setError(validationError);
    setError("");
    setStep((current) => Math.min(current + 1, steps.length - 1));
  }

  async function createEvent() {
    if (!interpretedDates || !data.jurisdiction || !data.waiverChoice) return;
    setIsCreating(true);
    setError("");
    try {
      const event = await eventService.createEvent({
        name: data.name.trim(),
        slug: data.slug,
        description: data.description.trim() || undefined,
        startDate: interpretedDates.start.toISOString(),
        endDate: interpretedDates.end.toISOString(),
        timezone: data.timezone,
        venueName: data.venueName.trim(),
        addressLine1: data.addressLine1.trim(),
        addressLine2: data.addressLine2.trim() || undefined,
        suburb: data.suburb.trim(),
        postcode: data.postcode,
        country: "AU",
        jurisdiction: data.jurisdiction,
        activityType: data.activityType,
        entryOpensMinutesBeforeStart: Number(data.opensBefore),
        entryClosesMinutesAfterEnd: Number(data.closesAfter),
        branding: {
          ...data.branding,
          heroHeadline: data.branding.heroHeadline?.trim() || undefined,
          heroDescription: data.branding.heroDescription?.trim() || undefined,
        },
      });
      router.push(
        `/events/${event.id}${data.waiverChoice === "CONFIGURE" ? "?tab=Waiver" : ""}`,
      );
    } catch (creationError) {
      setError(
        creationError instanceof Error
          ? creationError.message
          : "Unable to create this Event.",
      );
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <PlatformShell>
      <div className="mx-auto max-w-4xl">
        <Button variant="ghost" onClick={() => router.push("/events")}>
          <ArrowLeft /> Events
        </Button>
        <div className="mt-5">
          <p className="text-sm font-medium text-muted-foreground">
            Event setup
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Create a draft Event
          </h1>
          <p className="mt-2 text-muted-foreground">
            Nothing becomes public until the Event is ready and an owner
            activates it.
          </p>
        </div>

        <ol
          className="mt-8 grid gap-2 sm:grid-cols-4 lg:grid-cols-7"
          aria-label="Event setup progress"
        >
          {steps.map((label, index) => (
            <li
              key={label}
              className={`rounded-lg border p-3 text-xs font-medium ${index === step ? "border-primary bg-primary/5" : index < step ? "bg-muted" : "text-muted-foreground"}`}
            >
              <span className="block">
                {index < step ? <Check className="size-4" /> : index + 1}
              </span>
              <span className="mt-1 block">{label}</span>
            </li>
          ))}
        </ol>

        <section className="mt-6 rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold">{steps[step]}</h2>

          {step === 0 ? (
            <div className="mt-5 grid gap-5">
              <label className="text-sm font-medium">
                Event name
                <input
                  className={fieldClass()}
                  value={data.name}
                  maxLength={200}
                  onChange={(event) => {
                    const name = event.target.value;
                    update("name", name);
                    if (!slugWasEdited) update("slug", makeSlug(name));
                  }}
                />
              </label>
              <label className="text-sm font-medium">
                Public Event URL
                <input
                  className={fieldClass()}
                  value={data.slug}
                  maxLength={200}
                  onChange={(event) => {
                    setSlugWasEdited(true);
                    update("slug", makeSlug(event.target.value));
                  }}
                />
                <span className="mt-2 block text-xs font-normal text-muted-foreground">
                  glacier.com/events/{data.slug || "your-event"}
                </span>
              </label>
              <label className="text-sm font-medium">
                Description{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
                <textarea
                  className="mt-2 min-h-28 w-full rounded-lg border bg-background p-3 text-sm"
                  value={data.description}
                  maxLength={2000}
                  onChange={(event) =>
                    update("description", event.target.value)
                  }
                />
              </label>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_1fr]">
              <div className="space-y-5">
                <fieldset>
                  <legend className="text-sm font-medium">Brand preset</legend>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {brandPresets.map((preset) => (
                      <Button
                        key={preset.name}
                        type="button"
                        variant="outline"
                        onClick={() => update("branding", { ...preset.branding })}
                      >
                        {preset.name}
                      </Button>
                    ))}
                  </div>
                </fieldset>
                <div className="grid grid-cols-2 gap-3">
                  {([
                    ["primaryColor", "Primary"],
                    ["secondaryColor", "Secondary"],
                    ["accentColor", "Accent"],
                    ["backgroundColor", "Background"],
                    ["surfaceColor", "Surface"],
                    ["textColor", "Text"],
                  ] as const).map(([key, label]) => (
                    <label key={key} className="text-sm font-medium">
                      {label}
                      <span className="mt-2 flex items-center gap-2 rounded-lg border p-2">
                        <input
                          type="color"
                          aria-label={`${label} colour`}
                          value={data.branding[key]}
                          onChange={(event) =>
                            update("branding", {
                              ...data.branding,
                              [key]: event.target.value.toUpperCase(),
                            })
                          }
                          className="size-8 cursor-pointer border-0 bg-transparent"
                        />
                        <span className="font-mono text-xs">{data.branding[key]}</span>
                      </span>
                    </label>
                  ))}
                </div>
                {(["headingFont", "bodyFont"] as const).map((key) => (
                  <label key={key} className="block text-sm font-medium">
                    {key === "headingFont" ? "Heading font" : "Body font"}
                    <select
                      className={fieldClass()}
                      value={data.branding[key]}
                      onChange={(event) =>
                        update("branding", {
                          ...data.branding,
                          [key]: event.target.value as EventBrandingFont,
                        })
                      }
                    >
                      {fontOptions.map((font) => (
                        <option key={font.value} value={font.value}>{font.label}</option>
                      ))}
                    </select>
                  </label>
                ))}
                <label className="block text-sm font-medium">
                  Hero headline <span className="font-normal text-muted-foreground">(optional)</span>
                  <input
                    className={fieldClass()}
                    maxLength={120}
                    value={data.branding.heroHeadline}
                    onChange={(event) => update("branding", { ...data.branding, heroHeadline: event.target.value })}
                  />
                </label>
                <label className="block text-sm font-medium">
                  Hero supporting copy <span className="font-normal text-muted-foreground">(optional)</span>
                  <textarea
                    className="mt-2 min-h-24 w-full rounded-lg border bg-background p-3 text-sm"
                    maxLength={500}
                    value={data.branding.heroDescription}
                    onChange={(event) => update("branding", { ...data.branding, heroDescription: event.target.value })}
                  />
                </label>
              </div>
              <div>
                <p className="text-sm font-medium">Live public preview</p>
                <div
                  className="mt-2 overflow-hidden rounded-2xl border shadow-sm"
                  style={{ backgroundColor: data.branding.backgroundColor, color: data.branding.textColor }}
                >
                  <div className="p-7" style={{ backgroundColor: data.branding.primaryColor, color: data.branding.backgroundColor }}>
                    <p className="text-xs font-semibold uppercase tracking-widest">{data.name || "Your Event"}</p>
                    <h3 className="mt-8 text-3xl font-bold">{data.branding.heroHeadline || "An unforgettable Event starts here"}</h3>
                    <p className="mt-3 text-sm opacity-90">{data.branding.heroDescription || data.description || "Your Event introduction will appear here."}</p>
                    <span className="mt-6 inline-block rounded-lg px-4 py-2 text-sm font-semibold" style={{ backgroundColor: data.branding.accentColor, color: data.branding.textColor }}>Book tickets</span>
                  </div>
                  <div className="p-5" style={{ backgroundColor: data.branding.surfaceColor }}>
                    <p className="font-semibold">Consistent Glacier booking</p>
                    <p className="mt-1 text-sm">Your colours and voice will continue through every customer step.</p>
                  </div>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">Logo and hero image upload will be added through Glacier&apos;s safe media storage foundation.</p>
                <div
                  className={`mt-3 rounded-lg p-3 text-sm ${brandingContrastIssues.length === 0 ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900"}`}
                  role="status"
                >
                  {brandingContrastIssues.length === 0 ? (
                    <p className="font-medium">Essential text contrast passes.</p>
                  ) : (
                    <>
                      <p className="font-medium">Contrast needs attention</p>
                      <ul className="mt-1 list-disc pl-5">
                        {brandingContrastIssues.map((issue) => <li key={issue}>{issue}</li>)}
                      </ul>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <label className="text-sm font-medium">
                Starts
                <input
                  type="datetime-local"
                  className={fieldClass()}
                  value={data.startLocal}
                  onChange={(event) => update("startLocal", event.target.value)}
                />
              </label>
              <label className="text-sm font-medium">
                Ends
                <input
                  type="datetime-local"
                  className={fieldClass()}
                  value={data.endLocal}
                  onChange={(event) => update("endLocal", event.target.value)}
                />
              </label>
              <label className="text-sm font-medium sm:col-span-2">
                Timezone
                <select
                  className={fieldClass()}
                  value={data.timezone}
                  onChange={(event) => update("timezone", event.target.value)}
                >
                  {timezones.map((timezone) => (
                    <option key={timezone}>{timezone}</option>
                  ))}
                </select>
              </label>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <label className="text-sm font-medium sm:col-span-2">
                Venue name
                <input
                  className={fieldClass()}
                  value={data.venueName}
                  onChange={(event) => update("venueName", event.target.value)}
                />
              </label>
              <label className="text-sm font-medium sm:col-span-2">
                Address line 1
                <input
                  className={fieldClass()}
                  value={data.addressLine1}
                  onChange={(event) =>
                    update("addressLine1", event.target.value)
                  }
                />
              </label>
              <label className="text-sm font-medium sm:col-span-2">
                Address line 2{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
                <input
                  className={fieldClass()}
                  value={data.addressLine2}
                  onChange={(event) =>
                    update("addressLine2", event.target.value)
                  }
                />
              </label>
              <label className="text-sm font-medium">
                Suburb
                <input
                  className={fieldClass()}
                  value={data.suburb}
                  onChange={(event) => update("suburb", event.target.value)}
                />
              </label>
              <label className="text-sm font-medium">
                Postcode
                <input
                  inputMode="numeric"
                  className={fieldClass()}
                  value={data.postcode}
                  maxLength={4}
                  onChange={(event) =>
                    update("postcode", event.target.value.replace(/\D/g, ""))
                  }
                />
              </label>
              <label className="text-sm font-medium">
                Jurisdiction
                <select
                  className={fieldClass()}
                  value={data.jurisdiction}
                  onChange={(event) =>
                    update(
                      "jurisdiction",
                      event.target.value as WizardData["jurisdiction"],
                    )
                  }
                >
                  <option value="">Select state or territory</option>
                  {jurisdictions.map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium">
                Activity
                <select
                  className={fieldClass()}
                  value={data.activityType}
                  onChange={(event) =>
                    update(
                      "activityType",
                      event.target.value as WizardData["activityType"],
                    )
                  }
                >
                  <option value="ICE_SKATING">Ice skating</option>
                  <option value="OTHER">Other</option>
                </select>
              </label>
            </div>
          ) : null}

          {step === 4 ? (
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <label className="text-sm font-medium">
                Entry opens before start
                <input
                  type="number"
                  min={0}
                  max={240}
                  step={1}
                  className={fieldClass()}
                  value={data.opensBefore}
                  onChange={(event) =>
                    update("opensBefore", event.target.value)
                  }
                />
                <span className="mt-2 block text-xs font-normal text-muted-foreground">
                  Minutes; default 30.
                </span>
              </label>
              <label className="text-sm font-medium">
                Entry closes after end
                <input
                  type="number"
                  min={0}
                  max={240}
                  step={1}
                  className={fieldClass()}
                  value={data.closesAfter}
                  onChange={(event) =>
                    update("closesAfter", event.target.value)
                  }
                />
                <span className="mt-2 block text-xs font-normal text-muted-foreground">
                  Minutes; default 0.
                </span>
              </label>
              <p className="sm:col-span-2 rounded-lg bg-muted p-4 text-sm">
                Session-linked Tickets use Session times. Other Tickets use the
                Event start and end times.
              </p>
            </div>
          ) : null}

          {step === 5 ? (
            <fieldset className="mt-5 space-y-3">
              <legend className="text-sm text-muted-foreground">
                Choose one. No Waiver is a valid Event setup.
              </legend>
              {[
                [
                  "NONE",
                  "No Waiver",
                  "Continue setup without creating legal content.",
                ],
                [
                  "CONFIGURE",
                  "Configure a Waiver",
                  "Open the existing Waiver Workspace after Event creation.",
                ],
              ].map(([value, title, detail]) => (
                <label
                  key={value}
                  className="flex cursor-pointer gap-3 rounded-xl border p-4"
                >
                  <input
                    type="radio"
                    name="waiver"
                    value={value}
                    checked={data.waiverChoice === value}
                    onChange={() =>
                      update(
                        "waiverChoice",
                        value as WizardData["waiverChoice"],
                      )
                    }
                  />
                  <span>
                    <span className="block font-semibold">{title}</span>
                    <span className="mt-1 block text-sm text-muted-foreground">
                      {detail}
                    </span>
                  </span>
                </label>
              ))}
            </fieldset>
          ) : null}

          {step === 6 ? (
            <dl className="mt-5 grid gap-5 sm:grid-cols-2">
              <Review label="Event" value={`${data.name} · ${data.slug}`} />
              <Review
                label="Branding"
                value={`${data.branding.headingFont.replaceAll("_", " ")} · ${data.branding.primaryColor} · ${data.branding.accentColor}`}
              />
              <Review
                label="Dates"
                value={
                  interpretedDates
                    ? `${interpretedDates.start.toLocaleString("en-AU", { timeZone: data.timezone })} – ${interpretedDates.end.toLocaleString("en-AU", { timeZone: data.timezone })} (${data.timezone})`
                    : "—"
                }
              />
              <Review
                label="Venue"
                value={`${data.venueName}, ${data.addressLine1}, ${data.suburb} ${data.postcode}`}
              />
              <Review
                label="Activity"
                value={`${data.activityType === "ICE_SKATING" ? "Ice skating" : "Other"} · ${data.jurisdiction}`}
              />
              <Review
                label="Gate entry"
                value={`Opens ${data.opensBefore} min before · closes ${data.closesAfter} min after`}
              />
              <Review
                label="Waiver"
                value={
                  data.waiverChoice === "CONFIGURE"
                    ? "Configure after creation"
                    : "No Waiver"
                }
              />
            </dl>
          ) : null}

          {error ? (
            <p
              role="alert"
              className="mt-5 rounded-lg bg-destructive/10 p-3 text-sm font-medium text-destructive"
            >
              {error}
            </p>
          ) : null}

          <div className="mt-7 flex justify-between gap-3">
            <Button
              variant="outline"
              disabled={step === 0 || isCreating}
              onClick={() => {
                setError("");
                setStep((current) => current - 1);
              }}
            >
              <ArrowLeft /> Back
            </Button>
            {step < steps.length - 1 ? (
              <Button onClick={continueForward}>
                Continue <ArrowRight />
              </Button>
            ) : (
              <Button disabled={isCreating} onClick={() => void createEvent()}>
                {isCreating ? "Creating..." : "Create draft Event"}
              </Button>
            )}
          </div>
        </section>
      </div>
    </PlatformShell>
  );
}

function Review({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-4">
      <dt className="text-xs font-medium uppercase text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-2 text-sm font-semibold">{value}</dd>
    </div>
  );
}
