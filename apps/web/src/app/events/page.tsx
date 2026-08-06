"use client";

import Link from "next/link";

import { PlatformShell } from "@/components/layout/PlatformShell";
import { Button } from "@/components/ui/button";
import { useEvents } from "@/hooks/useEvents";

export default function EventsPage() {
  const { events, isLoading, error } = useEvents();

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
              Manage your organisation&apos;s events.
            </p>
          </div>

          <Button size="lg">
            Create event
          </Button>
        </div>

        {isLoading ? (
          <div className="rounded-xl border bg-card p-6">
            Loading events...
          </div>
        ) : null}

        {error ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {!isLoading && !error ? (
          <div className="grid gap-4">
            {events.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="rounded-xl border bg-card p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-lg font-semibold">
                        {event.name}
                      </h2>

                      <span className="rounded-full border px-2.5 py-1 text-xs font-medium">
                        {event.status}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-muted-foreground">
                      {event.description || "No description provided."}
                    </p>

                    <p className="mt-4 text-sm text-muted-foreground">
                      {new Date(event.startDate).toLocaleDateString("en-AU")}
                      {" — "}
                      {new Date(event.endDate).toLocaleDateString("en-AU")}
                    </p>
                  </div>

                  <span className="text-sm font-medium">
                    View event →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </PlatformShell>
  );
}