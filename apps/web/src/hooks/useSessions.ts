"use client";

import { useEffect, useState } from "react";

import {
  Session,
  sessionService,
} from "@/services/session.service";

export function useSessions(eventId: string) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSessions() {
      try {
        const data = await sessionService.getSessions(eventId);
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
    }

    loadSessions();
  }, [eventId]);

  return {
    sessions,
    isLoading,
    error,
  };
}