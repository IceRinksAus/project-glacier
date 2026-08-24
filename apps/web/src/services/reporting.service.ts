import { api } from "@/lib/api";

export interface OrganizationReportEvent {
  event: { id: string; name: string; slug: string; status: string; startDate: string; endDate: string; timezone: string };
  lifecycle: "UPCOMING" | "CURRENT" | "COMPLETED";
  sessions: { total: number; today: number; next: { id: string; name: string; startDate: string } | null; totalCapacity: number; reservedAttendance: number; utilisationPercent: number };
  bookings: { confirmed: number };
  tickets: { issued: number; admissions: number };
  commercial: { grossCollected: number; refunded: number; netCollected: number };
  paymentExceptionCount: number;
}

export interface OrganizationReport {
  generatedAt: string;
  totals: { events: number; currentEvents: number; upcomingEvents: number; sessionsToday: number; confirmedBookings: number; ticketsIssued: number; admissions: number; grossCollected: number; refunded: number; netCollected: number; paymentExceptions: number };
  events: OrganizationReportEvent[];
}

export interface EventReport {
  event: { id: string; name: string; status: string; startDate: string; endDate: string; timezone: string };
  filter: { date: string | null; sessionId: string | null; startsAt: string; endsAt: string };
  commercial: { confirmedBookings: number; grossCollected: number; refunded: number; netCollected: number; averageBookingValue: number };
  tickets: { issued: number; admissions: number; attendanceRate: number };
  bookings: { total: number; byStatus: Record<string, number> };
  payments: {
    byStatus: Record<string, number>;
    exceptionCount: number;
    exceptions: Array<{
      bookingId: string;
      bookingNumber: string;
      latestReconciliation: { succeeded: boolean; outcome: string; attemptedAt: string } | null;
    }>;
  };
  sessions: Array<{
    id: string;
    name: string;
    status: string;
    startDate: string;
    endDate: string;
    capacity: number;
    reservedAttendance: number;
    confirmedAttendance: number;
    remainingCapacity: number;
    utilisationPercent: number;
    ticketsIssued: number;
    admissions: number;
  }>;
}

export const reportingService = {
  getOrganizationSummary: () => api.get<OrganizationReport>("/reporting/organization"),
  getEventReport: (eventId: string, filters: { date?: string; sessionId?: string } = {}) => {
    const query = new URLSearchParams();
    if (filters.date) query.set("date", filters.date);
    if (filters.sessionId) query.set("sessionId", filters.sessionId);
    const suffix = query.toString();
    return api.get<EventReport>(`/reporting/events/${eventId}${suffix ? `?${suffix}` : ""}`);
  },
};
