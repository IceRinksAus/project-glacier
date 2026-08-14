"use client";

import {
  useMemo,
  useState,
} from "react";

import { useSessions } from "@/hooks/useSessions";

import { SessionDetailPanel } from "./SessionDetailPanel";

interface SessionsTimelineProps {
  eventId: string;
  eventTimezone: string | null;
}

function getTimeZone(
  eventTimezone: string | null,
) {
  return eventTimezone ?? "UTC";
}

export function SessionsTimeline({
  eventId,
  eventTimezone,
}: SessionsTimelineProps) {
const {
  sessions,
  isLoading,
  error,
  refresh,
} = useSessions(eventId);

  const [
    selectedSessionId,
    setSelectedSessionId,
  ] = useState<string | null>(null);

  const timeZone =
    getTimeZone(eventTimezone);

  const groupedSessions = useMemo(() => {
    return sessions.reduce<
      Record<string, typeof sessions>
    >(
      (groups, session) => {
        const dateKey = new Date(
          session.startDate,
        ).toLocaleDateString(
          "en-AU",
          {
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric",
            timeZone,
          },
        );

        groups[dateKey] ??= [];

        groups[dateKey].push(
          session,
        );

        return groups;
      },
      {},
    );
  }, [sessions, timeZone]);

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
          Sessions created for this
          event will appear here.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8">
        {Object.entries(
          groupedSessions,
        ).map(
          ([date, dateSessions]) => (
            <section key={date}>
              <h2 className="mb-4 text-lg font-semibold">
                {date}
              </h2>

              <div className="space-y-3">
                {dateSessions.map(
                  (session) => {
                    const startTime =
                      new Date(
                        session.startDate,
                      ).toLocaleTimeString(
                        "en-AU",
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                          timeZone,
                        },
                      );

                    const endTime =
                      new Date(
                        session.endDate,
                      ).toLocaleTimeString(
                        "en-AU",
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                          timeZone,
                        },
                      );

                    return (
                      <button
                        key={session.id}
                        type="button"
                        onClick={() =>
                          setSelectedSessionId(
                            session.id,
                          )
                        }
                        className="w-full rounded-xl border bg-card p-5 text-left transition hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">
                              {startTime} –{" "}
                              {endTime}
                            </p>

                            <h3 className="mt-1 text-base font-semibold">
                              {
                                session.name
                              }
                            </h3>

                            {session.scheduleExceptionType &&
                            session.scheduleExceptionType !==
                              "NONE" ? (
                              <p className="mt-2 text-xs font-medium text-muted-foreground">
                                Schedule
                                exception:{" "}
                                {
                                  session.scheduleExceptionType
                                }
                              </p>
                            ) : null}
                          </div>

                          <div className="flex items-center gap-6 text-sm">
                            <div>
                              <p className="text-muted-foreground">
                                Capacity
                              </p>

                              <p className="font-semibold">
                                {
                                  session.capacity
                                }
                              </p>
                            </div>

                            <span className="rounded-full border px-3 py-1 text-xs font-medium">
                              {
                                session.status
                              }
                            </span>

                            <span className="text-sm font-medium text-muted-foreground">
                              View →
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  },
                )}
              </div>
            </section>
          ),
        )}
      </div>

<SessionDetailPanel
  sessionId={selectedSessionId}
  eventTimezone={eventTimezone}
  onClose={() =>
    setSelectedSessionId(null)
  }
  onSessionChanged={refresh}
/>
    </>
  );
}