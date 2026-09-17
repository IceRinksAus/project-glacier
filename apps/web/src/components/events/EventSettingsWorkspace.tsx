"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { EventEntryPolicySettings } from "@/components/events/EventEntryPolicySettings";
import { EventFlexibleTicketSettings } from "@/components/flexible-ticket/FlexibleTicketPolicySettings";
import type { EventTab } from "@/components/events/EventTabs";
import type { GlacierEvent } from "@/services/event.service";

export function EventSettingsWorkspace({
  event,
  onNavigate,
}: {
  event: GlacierEvent;
  onNavigate: (tab: EventTab) => void;
}) {
  const websiteStatus = event.status === "ACTIVE" ? "Live" : "Draft preview";
  const brandingStatus = event.branding ? "Configured" : "Needs attention";

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Event setting</p>
        <h2 className="mt-2 text-2xl font-semibold">Event configuration</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Settings on this page apply to {event.name}. Organisation defaults are labelled separately where they are inherited.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <SettingsCard scope="Event setting" title="Tickets and sales" status="Configured in catalogue" description="Manage Ticket Types, visual tiles, Products, inventory and selling availability." action="Open Ticket Types" onClick={() => onNavigate("Ticket Types")} />
        <SettingsCard scope="Effective for this Event" title="Website and publishing" status={`${websiteStatus} · ${brandingStatus}`} description="Manage visual identity and the separate preview or public-live action." action="Open Website" onClick={() => onNavigate("Website")} />
        <SettingsCard scope="Event setting" title="Waiver" status="Open workspace for authoritative status" description="Create, publish and review Event-specific Waiver evidence in its dedicated workspace." action="Open Waiver" onClick={() => onNavigate("Waiver")} />
        <SettingsCard scope="Event setting" title="Data and reporting" status="Available" description="Open Event KPIs, exports and reporting views without changing calculation authority." action="Open Reports" onClick={() => onNavigate("Reports")} />
        <section className="rounded-2xl border bg-card p-5 shadow-sm md:col-span-2">
          <p className="text-xs font-bold uppercase tracking-wide text-primary">Event setting</p>
          <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">Gate Entry readiness</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {event.timezone || "Event timezone not set"} · Entry opens {event.entryOpensMinutesBeforeStart} minutes before start and closes {event.entryClosesMinutesAfterEnd} minutes after end.
              </p>
            </div>
            <Link href="/staff/scanner" className="rounded-lg border px-3 py-2 text-sm font-semibold">Scanner guidance</Link>
          </div>
          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
            <p className="rounded-lg bg-muted/40 p-3"><strong>Device:</strong> dedicated SCANNER login</p>
            <p className="rounded-lg bg-muted/40 p-3"><strong>Lookup:</strong> read-only until confirmed</p>
            <p className="rounded-lg bg-muted/40 p-3"><strong>POS:</strong> deliberate individual admission</p>
          </div>
        </section>
      </div>

      <section className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-wide text-primary">Organisation policy and Event override</p>
        <EventFlexibleTicketSettings eventId={event.id} />
      </section>

      <EventEntryPolicySettings
        eventId={event.id}
        initialOpensMinutesBeforeStart={event.entryOpensMinutesBeforeStart}
        initialClosesMinutesAfterEnd={event.entryClosesMinutesAfterEnd}
      />
    </div>
  );
}

function SettingsCard({ scope, title, status, description, action, onClick }: { scope: string; title: string; status: string; description: string; action: string; onClick: () => void }) {
  return (
    <section className="rounded-2xl border bg-card p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-primary">{scope}</p>
      <h3 className="mt-2 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm font-medium">{status}</p>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      <Button type="button" variant="outline" className="mt-4" onClick={onClick}>{action}</Button>
    </section>
  );
}
