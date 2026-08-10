"use client";

import { useMemo } from "react";

import { useSessions } from "@/hooks/useSessions";

interface SessionsTimelineProps {
  eventId: string;
}

export function SessionsTimeline({
  eventId,
}: SessionsTimelineProps) {
  const { sessions, isLoading, error } = useSessions(eventId);

  const groupedSessions = useMemo(() => {
    return sessions.reduce<Record<string, typeof sessions>>(
      (groups, session) => {
        const dateKey = new Date(
          session.startDate,
        ).toLocaleDateString("en-AU", {
          weekday: "long",
          day: "2-digit",
          month: "long",
          year: "numeric",
        });

        groups[dateKey] ??= [];
        groups[dateKey].push(session);

        return groups;
      },
      {},
    );
  }, [sessions]);

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card p-6">
        Loading sessions...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
        {error}
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-8 text-center">
        <h2 className="text-lg font-semibold">
          No sessions yet
        </h2>

        <p className="mt-2 text-sm text-muted-foreground">
          Sessions created for this event will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {Object.entries(groupedSessions).map(
        ([date, dateSessions]) => (
          <section key={date}>
            <h2 className="mb-4 text-lg font-semibold">
              {date}
            </h2>

            <div className="space-y-3">
              {dateSessions.map((session) => {
                const startTime = new Date(
                  session.startDate,
                ).toLocaleTimeString("en-AU", {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                const endTime = new Date(
                  session.endDate,
                ).toLocaleTimeString("en-AU", {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <div
                    key={session.id}
                    className="rounded-xl border bg-card p-5"
                  >
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {startTime} – {endTime}
                        </p>

                        <h3 className="mt-1 text-base font-semibold">
                          {session.name}
                        </h3>
                      </div>

                      <div className="flex items-center gap-6 text-sm">
                        <div>
                          <p className="text-muted-foreground">
                            Capacity
                          </p>
                          <p className="font-semibold">
                            {session.capacity}
                          </p>
                        </div>

                        <span className="rounded-full border px-3 py-1 text-xs font-medium">
                          {session.status}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ),
      )}
    </div>
  );
}