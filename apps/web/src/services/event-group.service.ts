import { api } from "@/lib/api";

export type EventGroupType = "SEASON" | "TOUR" | "PROMOTER" | "CAMPAIGN" | "CUSTOM";

export interface EventGroup {
  id: string;
  name: string;
  description: string | null;
  type: EventGroupType;
  status: "ACTIVE" | "ARCHIVED";
  events: Array<{
    sortOrder: number;
    event: {
      id: string;
      name: string;
      slug: string;
      status: string;
      startDate: string;
      endDate: string;
      timezone: string | null;
    };
  }>;
}

export const eventGroupService = {
  getAll: () => api.get<EventGroup[]>("/event-group"),
  create: (data: { name: string; description?: string; type: EventGroupType }) =>
    api.post<EventGroup>("/event-group", data),
  update: (id: string, data: { status?: "ACTIVE" | "ARCHIVED" }) =>
    api.patch<EventGroup>(`/event-group/${id}`, data),
  replaceEvents: (id: string, eventIds: string[]) =>
    api.put<EventGroup>(`/event-group/${id}/events`, { eventIds }),
};
