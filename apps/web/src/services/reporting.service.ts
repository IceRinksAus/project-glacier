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

export interface TicketTypeSalesReport {
  event: { id: string; name: string; timezone: string };
  filter: { date: string | null; sessionId: string | null };
  totals: { unitsSold: number; grossItemSales: number; ticketsIssued: number; admissions: number };
  refundAllocation: string;
  rows: Array<{
    id: string;
    name: string;
    active: boolean;
    unitsSold: number;
    grossItemSales: number;
    unitSharePercent: number;
    ticketsIssued: number;
    admissions: number;
  }>;
}

export interface SessionSalesReport {
  event: { id: string; name: string; timezone: string };
  filter: { date: string | null; sessionId: string | null };
  rows: Array<{
    id: string;
    name: string;
    status: string;
    startDate: string;
    endDate: string;
    capacity: number;
    confirmedBookings: number;
    confirmedBookingValue: number;
    grossCollected: number;
    refunded: number;
    netCollected: number;
    ticketUnits: number;
    ticketsIssued: number;
    admissions: number;
    reservedAttendance: number;
    remainingCapacity: number;
    utilisationPercent: number;
  }>;
}

export interface ProductSalesReport {
  event: { id: string; name: string; timezone: string };
  filter: { date: string | null; sessionId: string | null };
  definitions: { inventoryScope: string; refundAllocation: string };
  totals: { confirmedBookings: number; bookingsWithProducts: number; attachRatePercent: number; unitsSold: number; grossItemSales: number };
  rows: Array<{
    id: string; name: string; slug: string; status: string;
    group: { id: string; name: string; sortOrder: number } | null;
    requiredByRule: boolean;
    unitsSold: number; grossItemSales: number; bookingCount: number; attachRatePercent: number;
    inventory: { tracked: boolean; quantity: number | null; committed: number | null; remaining: number | null; sellThroughPercent: number | null };
    capacity: {
      controlled: boolean; defaultLimit: number | null;
      peakSession: { sessionId: string; sessionName: string; startDate: string; limit: number | null; reserved: number; remaining: number | null; utilisationPercent: number } | null;
    };
    variants: Array<{
      id: string; name: string; status: string; inventoryTracked: boolean; inventoryQuantity: number | null;
      unitsSold: number; grossItemSales: number; inventoryCommitted: number | null; inventoryRemaining: number | null; sellThroughPercent: number | null;
    }>;
  }>;
}

export interface DateSalesReport {
  event: { id: string; name: string; timezone: string };
  filter: { date: string | null; sessionId: string | null };
  rows: Array<{
    date: string; sessionCount: number; confirmedBookings: number; ticketUnits: number;
    grossBookingValue: number; grossCollected: number; refunded: number; netCollected: number;
    ticketsIssued: number; admissions: number; capacity: number; reservedAttendance: number;
    remainingCapacity: number; utilisationPercent: number;
  }>;
}

export interface SalesPaceReport {
  event: { id: string; name: string; timezone: string };
  filter: { date: string | null; sessionId: string | null };
  basis: string;
  confirmationDisclosure: string;
  totals: { confirmedBookings: number; ticketUnits: number; grossBookingValue: number };
  rows: Array<{
    key: string; label: string; confirmedBookings: number; ticketUnits: number; grossBookingValue: number;
    cumulativeBookings: number; cumulativeTicketUnits: number;
  }>;
}

function eventReportPath(eventId: string, suffix = "", filters: { date?: string; sessionId?: string } = {}) {
  const query = new URLSearchParams();
  if (filters.date) query.set("date", filters.date);
  if (filters.sessionId) query.set("sessionId", filters.sessionId);
  const queryString = query.toString();
  return `/reporting/events/${eventId}${suffix}${queryString ? `?${queryString}` : ""}`;
}

export const reportingService = {
  getOrganizationSummary: () => api.get<OrganizationReport>("/reporting/organization"),
  getEventReport: (eventId: string, filters: { date?: string; sessionId?: string } = {}) =>
    api.get<EventReport>(eventReportPath(eventId, "", filters)),
  getTicketTypeSales: (eventId: string, filters: { date?: string; sessionId?: string } = {}) =>
    api.get<TicketTypeSalesReport>(eventReportPath(eventId, "/ticket-types", filters)),
  getSessionSales: (eventId: string, filters: { date?: string; sessionId?: string } = {}) =>
    api.get<SessionSalesReport>(eventReportPath(eventId, "/sessions", filters)),
  getProductSales: (eventId: string, filters: { date?: string; sessionId?: string } = {}) =>
    api.get<ProductSalesReport>(eventReportPath(eventId, "/products", filters)),
  getDateSales: (eventId: string, filters: { date?: string; sessionId?: string } = {}) =>
    api.get<DateSalesReport>(eventReportPath(eventId, "/dates", filters)),
  getSalesPace: (eventId: string, filters: { date?: string; sessionId?: string } = {}) =>
    api.get<SalesPaceReport>(eventReportPath(eventId, "/sales-pace", filters)),
};
