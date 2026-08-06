import { api } from "@/lib/api";

export interface GlacierEvent {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  startDate: string;
  endDate: string;
  status: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export const eventService = {
  getEvents: () => api.get<GlacierEvent[]>("/event"),

  getEvent: (eventId: string) =>
    api.get<GlacierEvent>(`/event/${eventId}`),
};