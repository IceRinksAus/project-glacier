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

export const reportingService = {
  getOrganizationSummary: () => api.get<OrganizationReport>("/reporting/organization"),
};
