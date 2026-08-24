"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";

import { PlatformShell } from "@/components/layout/PlatformShell";
import { Button } from "@/components/ui/button";
import { useOrganizationReport } from "@/hooks/useOrganizationReport";
import {
  getAuthRoleSnapshot,
  getServerAuthRoleSnapshot,
  subscribeAuthSession,
} from "@/lib/auth";

export default function EventsPage() {
  const router = useRouter();
  const role = useSyncExternalStore(
    subscribeAuthSession,
    getAuthRoleSnapshot,
    getServerAuthRoleSnapshot,
  );
  const { report, isLoading, error } = useOrganizationReport();

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
          <div className="grid gap-4">
            {report?.events.map((row) => (
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
            {report?.events.length === 0 ? (
              <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">No events have been created yet.</div>
            ) : null}
          </div>
        ) : null}
      </div>
    </PlatformShell>
  );
}

function EventMetric({ label, value }: { label: string; value: string | number }) {
  return <div><p className="text-muted-foreground">{label}</p><p className="mt-1 font-semibold text-foreground">{value}</p></div>;
}
