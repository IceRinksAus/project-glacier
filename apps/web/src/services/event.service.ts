import { api } from "@/lib/api";

export interface GlacierEvent {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  startDate: string;
  endDate: string;
  timezone: string | null;
  status: string;
  activityType: string | null;
  jurisdiction: string | null;
  entryOpensMinutesBeforeStart: number;
  entryClosesMinutesAfterEnd: number;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGlacierEvent {
  name: string;
  slug: string;
  description?: string;
  startDate: string;
  endDate: string;
  timezone: string;
  venueName: string;
  addressLine1: string;
  addressLine2?: string;
  suburb: string;
  postcode: string;
  country: "AU";
  jurisdiction: "ACT" | "NSW" | "NT" | "QLD" | "SA" | "TAS" | "VIC" | "WA";
  activityType: "ICE_SKATING" | "OTHER";
  entryOpensMinutesBeforeStart: number;
  entryClosesMinutesAfterEnd: number;
}

export const eventService = {
  getEvents: () => api.get<GlacierEvent[]>("/event"),

  getEvent: (eventId: string) => api.get<GlacierEvent>(`/event/${eventId}`),

  createEvent: (data: CreateGlacierEvent) =>
    api.post<GlacierEvent>("/event", data),

  updateEntryPolicy: (
    eventId: string,
    entryOpensMinutesBeforeStart: number,
    entryClosesMinutesAfterEnd: number,
  ) =>
    api.patch<
      Pick<
        GlacierEvent,
        "id" | "entryOpensMinutesBeforeStart" | "entryClosesMinutesAfterEnd"
      >
    >(`/event/${eventId}/entry-policy`, {
      entryOpensMinutesBeforeStart,
      entryClosesMinutesAfterEnd,
    }),
};
