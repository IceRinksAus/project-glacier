import { api } from "@/lib/api";

export interface Session {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  capacity: number;
  status: string;
  salesStart: string | null;
  salesEnd: string | null;
  eventId: string;
}

export const sessionService = {
  getSessions(eventId: string) {
    return api.get<Session[]>(
      `/session?eventId=${eventId}`,
    );
  },
};