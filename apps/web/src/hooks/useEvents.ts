"use client";

import { useEffect, useState } from "react";

import {
  eventService,
  GlacierEvent,
} from "@/services/event.service";

export function useEvents() {
  const [events, setEvents] = useState<GlacierEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadEvents() {
      try {
        const data = await eventService.getEvents();
        setEvents(data);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load events",
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadEvents();
  }, []);

  return {
    events,
    isLoading,
    error,
  };
}