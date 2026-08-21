import { api } from "@/lib/api";

export type EventBrandingFont =
  | "INTER"
  | "NUNITO_SANS"
  | "PLAYFAIR_DISPLAY"
  | "OSWALD";

export interface EventBranding {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  headingFont: EventBrandingFont;
  bodyFont: EventBrandingFont;
  heroHeadline?: string;
  heroDescription?: string;
}

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
  branding: (EventBranding & { id: string }) | null;
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
  branding?: EventBranding;
}

export interface EventReadinessItem {
  id: "EVENT_DETAILS" | "SESSIONS" | "TICKET_TYPES" | "WAIVER";
  label: string;
  status: "COMPLETE" | "INCOMPLETE" | "NOT_REQUIRED";
  explanation: string;
  destinationTab: "Overview" | "Sessions" | "Ticket Types" | "Waiver";
}

export interface EventReadiness {
  eventId: string;
  readyToActivate: boolean;
  completedRequiredItems: number;
  requiredItems: number;
  percentage: number;
  items: EventReadinessItem[];
}

export const eventService = {
  getEvents: () => api.get<GlacierEvent[]>("/event"),

  getEvent: (eventId: string) => api.get<GlacierEvent>(`/event/${eventId}`),

  createEvent: (data: CreateGlacierEvent) =>
    api.post<GlacierEvent>("/event", data),

  getReadiness: (eventId: string) =>
    api.get<EventReadiness>(`/event/${eventId}/readiness`),

  updateStatus: (eventId: string, status: "DRAFT" | "ACTIVE" | "INACTIVE") =>
    api.patch<GlacierEvent>(`/event/${eventId}/status`, { status }),

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

  updateBranding: (eventId: string, branding: EventBranding) =>
    api.patch<EventBranding>(`/event/${eventId}/branding`, branding),
};
