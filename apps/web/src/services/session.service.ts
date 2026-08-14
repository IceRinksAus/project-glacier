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
  operationalScheduleId?: string | null;
  scheduleEntryId?: string | null;
  scheduleExceptionType?: string;
}

export interface SessionBookingItem {
  id: string;
  quantity: number;
  ticketType: {
    id: string;
    name: string;
  };
}

export interface SessionBooking {
  id: string;
  status: string;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  items: SessionBookingItem[];
}

export interface SessionDetail extends Session {
  event: {
    id: string;
    name: string;
    timezone: string | null;
  };
  bookings: SessionBooking[];
}

export interface UpdateSessionPayload {
  name?: string;
  startDate?: string;
  endDate?: string;
  capacity?: number;
  status?: string;
  salesStart?: string;
  salesEnd?: string;
}

export const sessionService = {
  getSessions(eventId: string) {
    return api.get<Session[]>(
      `/session?eventId=${eventId}`,
    );
  },

  getSession(sessionId: string) {
    return api.get<SessionDetail>(
      `/session/${sessionId}`,
    );
  },

  updateSession(
    sessionId: string,
    data: UpdateSessionPayload,
  ) {
    return api.patch<SessionDetail>(
      `/session/${sessionId}`,
      data,
    );
  },

  cancelSession(sessionId: string) {
    return api.patch<SessionDetail>(
      `/session/${sessionId}/cancel`,
      {},
    );
  },

  deleteSession(sessionId: string) {
    return api.delete<Session>(
      `/session/${sessionId}`,
    );
  },
};