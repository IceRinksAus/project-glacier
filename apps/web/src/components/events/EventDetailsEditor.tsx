"use client";

import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  eventService,
  GlacierEvent,
  UpdateGlacierEventDetails,
} from "@/services/event.service";

const timezones = [
  "Australia/Adelaide", "Australia/Brisbane", "Australia/Broken_Hill",
  "Australia/Darwin", "Australia/Eucla", "Australia/Hobart",
  "Australia/Lord_Howe", "Australia/Melbourne", "Australia/Perth",
  "Australia/Sydney",
];
const jurisdictions = ["ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"] as const;

interface Props {
  event: GlacierEvent;
  onCancel: () => void;
  onSaved: () => void;
}

export function EventDetailsEditor({ event, onCancel, onSaved }: Props) {
  const initialTimezone = event.timezone ?? "Australia/Melbourne";
  const [form, setForm] = useState({
    name: event.name,
    description: event.description ?? "",
    startLocal: formatInTimeZone(event.startDate, initialTimezone, "yyyy-MM-dd'T'HH:mm"),
    endLocal: formatInTimeZone(event.endDate, initialTimezone, "yyyy-MM-dd'T'HH:mm"),
    timezone: initialTimezone,
    venueName: event.venueName ?? "",
    addressLine1: event.addressLine1 ?? "",
    addressLine2: event.addressLine2 ?? "",
    suburb: event.suburb ?? "",
    postcode: event.postcode ?? "",
    jurisdiction: event.jurisdiction ?? "",
    activityType: event.activityType ?? "ICE_SKATING",
  });
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  function update(name: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
    setError("");
  }

  async function save() {
    if (!form.name.trim() || !form.venueName.trim() || !form.addressLine1.trim() || !form.suburb.trim()) {
      return setError("Complete the Event name, venue and address fields.");
    }
    if (!/^\d{4}$/.test(form.postcode) || !form.jurisdiction) {
      return setError("Enter a four-digit postcode and jurisdiction.");
    }
    const startDate = fromZonedTime(form.startLocal, form.timezone);
    const endDate = fromZonedTime(form.endLocal, form.timezone);
    if (endDate <= startDate) return setError("Event end must be after Event start.");

    const payload: UpdateGlacierEventDetails = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      timezone: form.timezone,
      venueName: form.venueName.trim(),
      addressLine1: form.addressLine1.trim(),
      addressLine2: form.addressLine2.trim() || undefined,
      suburb: form.suburb.trim(),
      postcode: form.postcode,
      jurisdiction: form.jurisdiction as UpdateGlacierEventDetails["jurisdiction"],
      activityType: form.activityType as UpdateGlacierEventDetails["activityType"],
    };
    setIsSaving(true);
    try {
      await eventService.updateDetails(event.id, payload);
      onSaved();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to update Event details.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="glacier-panel p-6 lg:col-span-2">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="glacier-kicker">Event overview</p>
          <h2 className="mt-2 text-2xl font-semibold">Edit Event details</h2>
        </div>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>

      <div className="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
        Existing Sessions must remain inside the new Event dates. Timezone changes stop once Sessions exist, and legal Event details lock once Waiver evidence has been generated.
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Field label="Event name"><input value={form.name} onChange={(e) => update("name", e.target.value)} /></Field>
        <Field label="Description"><input value={form.description} onChange={(e) => update("description", e.target.value)} /></Field>
        <Field label="Starts"><input type="datetime-local" value={form.startLocal} onChange={(e) => update("startLocal", e.target.value)} /></Field>
        <Field label="Ends"><input type="datetime-local" value={form.endLocal} onChange={(e) => update("endLocal", e.target.value)} /></Field>
        <Field label="Timezone"><select value={form.timezone} onChange={(e) => update("timezone", e.target.value)}>{timezones.map((value) => <option key={value}>{value}</option>)}</select></Field>
        <Field label="Venue"><input value={form.venueName} onChange={(e) => update("venueName", e.target.value)} /></Field>
        <Field label="Address line 1"><input value={form.addressLine1} onChange={(e) => update("addressLine1", e.target.value)} /></Field>
        <Field label="Address line 2 (optional)"><input value={form.addressLine2} onChange={(e) => update("addressLine2", e.target.value)} /></Field>
        <Field label="Suburb"><input value={form.suburb} onChange={(e) => update("suburb", e.target.value)} /></Field>
        <Field label="Postcode"><input inputMode="numeric" value={form.postcode} onChange={(e) => update("postcode", e.target.value)} /></Field>
        <Field label="Jurisdiction"><select value={form.jurisdiction} onChange={(e) => update("jurisdiction", e.target.value)}>{jurisdictions.map((value) => <option key={value}>{value}</option>)}</select></Field>
        <Field label="Activity"><select value={form.activityType} onChange={(e) => update("activityType", e.target.value)}><option value="ICE_SKATING">Ice skating</option><option value="OTHER">Other</option></select></Field>
      </div>

      {error ? <p role="alert" className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p> : null}
      <div className="mt-6 flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="button" disabled={isSaving} onClick={save}>{isSaving ? "Saving..." : "Save Event details"}</Button>
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactElement<{ className?: string; "aria-label"?: string }> }) {
  return (
    <label className="text-sm font-medium">
      {label}
      <span className="mt-2 block [&>input]:h-11 [&>input]:w-full [&>input]:rounded-lg [&>input]:border [&>input]:bg-background [&>input]:px-3 [&>select]:h-11 [&>select]:w-full [&>select]:rounded-lg [&>select]:border [&>select]:bg-background [&>select]:px-3">
        {children}
      </span>
    </label>
  );
}
