"use client";

import { useEffect, useState } from "react";

import {
  eventService,
  GlacierEvent,
} from "@/services/event.service";

export function useEvent(eventId: string) {
  const [event, setEvent] = useState<GlacierEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadEvent() {
      try {
        const data = await eventService.getEvent(eventId);
        setEvent(data);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load event",
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadEvent();
  }, [eventId]);

  return {
    event,
    isLoading,
    error,
  };
}