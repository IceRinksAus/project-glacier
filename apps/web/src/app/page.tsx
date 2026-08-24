"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";

import { PlatformShell } from "@/components/layout/PlatformShell";
import { Button } from "@/components/ui/button";
import { useOrganizationReport } from "@/hooks/useOrganizationReport";
import { getAuthRoleSnapshot, getServerAuthRoleSnapshot, subscribeAuthSession } from "@/lib/auth";

const money = new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" });

export default function DashboardPage() {
  const router = useRouter();
  const role = useSyncExternalStore(subscribeAuthSession, getAuthRoleSnapshot, getServerAuthRoleSnapshot);
  const { report, isLoading, error } = useOrganizationReport();

  return (
    <PlatformShell>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              {new Intl.DateTimeFormat("en-AU", { dateStyle: "full" }).format(new Date())}
            </p>

            <h1 className="mt-1 text-3xl font-semibold tracking-tight">
              Organisation overview
            </h1>

            <p className="mt-2 text-muted-foreground">
              A live operational view across your events.
            </p>
          </div>

          {role === "OWNER" ? (
            <Button size="lg" onClick={() => router.push("/events/new")}>Create new event</Button>
          ) : null}
        </div>

        {isLoading ? <StateCard>Loading dashboard...</StateCard> : null}
        {error ? <StateCard error>{error}</StateCard> : null}
        {report ? <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Metric label="Current events" value={report.totals.currentEvents} />
            <Metric label="Sessions today" value={report.totals.sessionsToday} />
            <Metric label="Confirmed bookings" value={report.totals.confirmedBookings} />
            <Metric label="Net collected" value={money.format(report.totals.netCollected)} />
          </section>
          <section className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <h2 className="text-lg font-semibold">Attendance</h2>
              <div className="mt-5 grid grid-cols-2 gap-4">
                <Metric label="Tickets issued" value={report.totals.ticketsIssued} compact />
                <Metric label="Admissions" value={report.totals.admissions} compact />
              </div>
            </div>
            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <h2 className="text-lg font-semibold">Operational attention</h2>
              <p className="mt-5 text-3xl font-semibold">{report.totals.paymentExceptions}</p>
              <p className="mt-1 text-sm text-muted-foreground">Bookings with pending payments</p>
            </div>
          </section>
          <section className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div><h2 className="text-lg font-semibold">Events requiring attention</h2><p className="mt-1 text-sm text-muted-foreground">Current and upcoming operations at a glance.</p></div>
              <Link className="text-sm font-medium" href="/events">View all events →</Link>
            </div>
            <div className="mt-5 grid gap-3">
              {report.events.filter(({ lifecycle }) => lifecycle !== "COMPLETED").slice(0, 5).map((row) => (
                <Link key={row.event.id} href={`/events/${row.event.id}`} className="flex flex-col justify-between gap-3 rounded-lg border p-4 transition hover:bg-muted/40 sm:flex-row sm:items-center">
                  <div><p className="font-medium">{row.event.name}</p><p className="mt-1 text-sm text-muted-foreground">{row.sessions.today} sessions today · {row.bookings.confirmed} confirmed bookings</p></div>
                  <span className="text-sm font-medium">{row.lifecycle}</span>
                </Link>
              ))}
              {report.events.length === 0 ? <p className="text-sm text-muted-foreground">No events have been created yet.</p> : null}
            </div>
          </section>
        </> : null}
      </div>
    </PlatformShell>
  );
}

function Metric({ label, value, compact = false }: { label: string; value: string | number; compact?: boolean }) {
  return <div className={compact ? "" : "rounded-xl border bg-card p-6 shadow-sm"}><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-3xl font-semibold">{value}</p></div>;
}

function StateCard({ children, error = false }: { children: React.ReactNode; error?: boolean }) {
  return <div className={`rounded-xl border bg-card p-6 ${error ? "border-destructive/30 text-destructive" : ""}`}>{children}</div>;
}
