"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Session,
  sessionService,
} from "@/services/session.service";

export function useSessions(
  eventId: string,
) {
  const [sessions, setSessions] =
    useState<Session[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const loadSessions = useCallback(
    async () => {
      try {
        setIsLoading(true);
        setError("");

        const data =
          await sessionService.getSessions(
            eventId,
          );

        setSessions(data);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load sessions",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [eventId],
  );

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  return {
    sessions,
    isLoading,
    error,
    refresh: loadSessions,
  };
}