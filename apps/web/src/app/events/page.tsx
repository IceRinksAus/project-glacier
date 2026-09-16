"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useSyncExternalStore } from "react";

import { PlatformShell } from "@/components/layout/PlatformShell";
import { Button } from "@/components/ui/button";
import { useOrganizationReport } from "@/hooks/useOrganizationReport";
import {
  getAuthRoleSnapshot,
  getServerAuthRoleSnapshot,
  subscribeAuthSession,
} from "@/lib/auth";
import type { OrganizationReportEvent } from "@/services/reporting.service";

type Lifecycle = OrganizationReportEvent["lifecycle"];

const lifecycleLabels: Record<Lifecycle, string> = {
  CURRENT: "Current",
  UPCOMING: "Upcoming",
  COMPLETED: "Past",
};

export default function EventsPage() {
  const router = useRouter();
  const role = useSyncExternalStore(
    subscribeAuthSession,
    getAuthRoleSnapshot,
    getServerAuthRoleSnapshot,
  );
  const { report, isLoading, error } = useOrganizationReport();
  const [lifecycle, setLifecycle] = useState<Lifecycle>("CURRENT");
  const [query, setQuery] = useState("");
  const events = report?.events ?? [];
  const visibleEvents = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("en-AU");
    return events.filter((row) =>
      row.lifecycle === lifecycle &&
      (!normalizedQuery || row.event.name.toLocaleLowerCase("en-AU").includes(normalizedQuery)),
    );
  }, [events, lifecycle, query]);

  return (
    <PlatformShell>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Organisation
            </p>

            <h1 className="mt-1 text-3xl font-semibold tracking-tight">
              Events
            </h1>

            <p className="mt-2 text-muted-foreground">
              Track current, upcoming and completed events. Open an event for setup and detailed reporting.
            </p>
          </div>

          {role === "OWNER" ? (
            <Button size="lg" onClick={() => router.push("/events/new")}>
              Create event
            </Button>
          ) : null}
        </div>

        {isLoading ? (
          <div className="rounded-xl border bg-card p-6">Loading events...</div>
        ) : null}

        {error ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {!isLoading && !error ? (
          <>
            <section className="glacier-panel p-4 sm:p-5" aria-label="Filter events">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap gap-2" role="group" aria-label="Event timing">
                  {(Object.keys(lifecycleLabels) as Lifecycle[]).map((option) => {
                    const count = events.filter((row) => row.lifecycle === option).length;
                    const selected = lifecycle === option;
                    return (
                      <button
                        key={option}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setLifecycle(option)}
                        className={`rounded-full px-4 py-2 text-sm font-medium transition ${selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
                      >
                        {lifecycleLabels[option]} <span aria-label={`${count} events`}>({count})</span>
                      </button>
                    );
                  })}
                </div>
                <label className="relative block lg:w-80">
                  <span className="sr-only">Search events</span>
                  <input
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search events by name"
                    className="h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </label>
              </div>
            </section>
            <div className="grid gap-4">
            {visibleEvents.map((row) => (
              <Link
                key={row.event.id}
                href={`/events/${row.event.id}`}
                className="rounded-xl border bg-card p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-lg font-semibold">{row.event.name}</h2>

                      <span className="rounded-full border px-2.5 py-1 text-xs font-medium">
                        {row.lifecycle}
                      </span>
                    </div>

                    <p className="mt-3 text-sm text-muted-foreground">
                      {new Date(row.event.startDate).toLocaleDateString("en-AU")}
                      {" — "}
                      {new Date(row.event.endDate).toLocaleDateString("en-AU")}
                    </p>
                    <div className="mt-5 grid grid-cols-2 gap-x-8 gap-y-3 text-sm sm:grid-cols-4">
                      <EventMetric label="Sessions" value={row.sessions.total} />
                      <EventMetric label="Confirmed" value={row.bookings.confirmed} />
                      <EventMetric label="Admissions" value={row.tickets.admissions} />
                      <EventMetric label="Capacity used" value={`${row.sessions.utilisationPercent}%`} />
                    </div>
                    {row.sessions.next ? (
                      <p className="mt-4 text-sm text-muted-foreground">
                        Next: {row.sessions.next.name} · {new Date(row.sessions.next.startDate).toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" })}
                      </p>
                    ) : null}
                    {row.paymentExceptionCount > 0 ? (
                      <p className="mt-3 text-sm font-medium text-destructive">
                        {row.paymentExceptionCount} payment {row.paymentExceptionCount === 1 ? "exception" : "exceptions"} requiring attention
                      </p>
                    ) : null}
                  </div>

                  <span className="text-sm font-medium">View event →</span>
                </div>
              </Link>
            ))}
            {visibleEvents.length === 0 ? (
              <div className="glacier-panel p-8 text-center text-sm text-muted-foreground">
                {events.length === 0
                  ? "No events have been created yet."
                  : query.trim()
                    ? `No ${lifecycleLabels[lifecycle].toLowerCase()} events match “${query.trim()}”.`
                    : `There are no ${lifecycleLabels[lifecycle].toLowerCase()} events.`}
              </div>
            ) : null}
          </div>
          </>
        ) : null}
      </div>
    </PlatformShell>
  );
}

function EventMetric({ label, value }: { label: string; value: string | number }) {
  return <div><p className="text-muted-foreground">{label}</p><p className="mt-1 font-semibold text-foreground">{value}</p></div>;
}
