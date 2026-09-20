"use client";

import { useOrganizationReport } from "@/hooks/useOrganizationReport";
import { getAuthUser } from "@/lib/auth";
import type { GlacierEvent } from "@/services/event.service";
import { Button } from "@/components/ui/button";
import { useState } from "react";

import { EventDetailsEditor } from "./EventDetailsEditor";
import { EventReadinessPanel } from "./EventReadinessPanel";
import type { EventTab } from "./EventTabs";

interface EventOverviewProps {
  event: GlacierEvent;
  onNavigate: (tab: EventTab) => void;
  onActivated: () => void;
}

export function EventOverview({
  event,
  onNavigate,
  onActivated,
}: EventOverviewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const { id: eventId, name, description, status, slug, startDate, endDate } = event;
  const { report } = useOrganizationReport();
  const metrics = report?.events.find((row) => row.event.id === eventId);
  const formattedStartDate = new Date(startDate).toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const formattedEndDate = new Date(endDate).toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  if (isEditing) {
    return <div className="grid gap-6"><EventDetailsEditor event={event} onCancel={() => setIsEditing(false)} onSaved={() => window.location.reload()} /></div>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      <section className="glacier-panel p-6">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-muted-foreground">Event overview</p>
          {getAuthUser()?.role === "OWNER" ? <Button type="button" variant="outline" onClick={() => setIsEditing(true)}>Edit Event details</Button> : null}
        </div>

        <h2 className="mt-2 text-2xl font-semibold tracking-tight">{name}</h2>

        <p className="mt-4 leading-7 text-muted-foreground">
          {description || "No event description has been added yet."}
        </p>

        <dl className="mt-8 grid gap-6 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-muted-foreground">
              Event dates
            </dt>
            <dd className="mt-1 text-sm font-semibold">
              {formattedStartDate} — {formattedEndDate}
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-muted-foreground">
              Status
            </dt>
            <dd className="mt-1 text-sm font-semibold">{status}</dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-muted-foreground">
              Website slug
            </dt>
            <dd className="mt-1 text-sm font-semibold">{slug}</dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-muted-foreground">
              Future event website
            </dt>
            <dd className="mt-1 text-sm font-semibold">{slug}.glacier.com</dd>
          </div>
        </dl>

        {metrics ? (
          <div className="mt-8 border-t pt-6">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
              <div>
                <p className="glacier-kicker">Live operations</p>
                <h3 className="mt-2 text-lg font-semibold">Event activity</h3>
              </div>
              <span className="w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                {metrics.lifecycle === "COMPLETED" ? "PAST" : metrics.lifecycle}
              </span>
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <OverviewMetric label="Tickets issued" value={metrics.tickets.issued} />
              <OverviewMetric label="Admissions" value={metrics.tickets.admissions} />
              <OverviewMetric label="Sessions today" value={metrics.sessions.today} />
              <OverviewMetric label="Confirmed bookings" value={metrics.bookings.confirmed} />
              <OverviewMetric label="Capacity used" value={`${metrics.sessions.utilisationPercent}%`} />
              <OverviewMetric label="Payment exceptions" value={metrics.paymentExceptionCount} attention={metrics.paymentExceptionCount > 0} />
            </dl>
            {metrics.sessions.next ? (
              <p className="mt-4 text-sm text-muted-foreground">
                Next session: <span className="font-medium text-foreground">{metrics.sessions.next.name}</span>
                {" · "}
                {new Date(metrics.sessions.next.startDate).toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" })}
              </p>
            ) : null}
          </div>
        ) : null}
      </section>

      <EventReadinessPanel
        eventId={eventId}
        eventStatus={status}
        onNavigate={onNavigate}
        onActivated={onActivated}
      />
    </div>
  );
}

function OverviewMetric({ label, value, attention = false }: { label: string; value: string | number; attention?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${attention ? "border-destructive/30 bg-destructive/5" : "bg-muted/30"}`}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={`mt-1 text-xl font-semibold ${attention ? "text-destructive" : ""}`}>{value}</dd>
    </div>
  );
}
