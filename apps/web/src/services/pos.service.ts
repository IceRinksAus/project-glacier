import { api } from "@/lib/api";

export interface PosSession {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  capacity: number;
  salesStart: string | null;
  salesEnd: string | null;
}

export interface PosTicketType {
  id: string;
  name: string;
  description: string | null;
  price: string | number;
  saleStart: string | null;
  saleEnd: string | null;
}

export interface PosProductVariant {
  id: string;
  name: string;
  priceOverride: string | number | null;
  inventoryTracked: boolean;
  inventoryQuantity: number | null;
  sortOrder: number;
}

export interface PosSessionProduct {
  id: string;
  productId: string;
  capacityOverride: number | null;
  sortOrder: number;
  product: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    price: string | number;
    minQuantity: number;
    maxQuantity: number | null;
    capacityControlled: boolean;
    capacity: number | null;
    inventoryTracked: boolean;
    inventoryQuantity: number | null;
    productGroup: { id: string; name: string; sortOrder: number } | null;
    variants: PosProductVariant[];
  };
}

export interface PosCatalogue {
  event: { id: string; name: string; timezone: string | null };
  sessions: PosSession[];
  ticketTypes: PosTicketType[];
  sessionProducts: PosSessionProduct[];
}

export interface PosParticipant {
  firstName: string;
  lastName?: string;
  age: number;
  ticketTypeId: string;
}

export interface PosReservation {
  booking: {
    id: string;
    bookingNumber: string;
    total: string | number;
    reservedUntil: string | null;
  };
}

export interface PosCompletion {
  id: string;
  bookingNumber: string;
  total: number;
  status: string;
  paymentStatus: string;
  tickets: Array<{
    id: string;
    ticketNumber: string;
    secureToken: string;
    status: string;
    participant: { firstName: string; lastName: string | null };
  }>;
}

export const posService = {
  getCatalogue: (eventId: string, sessionId?: string) =>
    api.get<PosCatalogue>(
      `/pos/events/${eventId}/catalogue${sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : ""}`,
    ),

  evaluateRules: (
    eventId: string,
    sessionId: string,
    participants: PosParticipant[],
  ) =>
    api.post<{
      valid: boolean;
      requiredProducts: Array<{ productSlug: string; quantity: number }>;
      errors: string[];
      warnings: string[];
    }>(`/pos/events/${eventId}/evaluate-rules`, { sessionId, participants }),

  createCustomer: (
    eventId: string,
    customer: {
      firstName: string;
      lastName?: string;
      email?: string;
      phone?: string;
    },
  ) => api.post<{ id: string }>(`/pos/events/${eventId}/customers`, customer),

  createReservation: (
    eventId: string,
    input: {
      customerId: string;
      sessionId: string;
      participants: PosParticipant[];
      products: Array<{
        productId: string;
        productVariantId?: string;
        quantity: number;
      }>;
    },
  ) => api.post<PosReservation>(`/pos/events/${eventId}/reservations`, input),

  completePayment: (
    eventId: string,
    bookingId: string,
    input: {
      method: "CASH" | "STANDALONE_EFTPOS";
      amount: number;
      idempotencyKey: string;
      standaloneReference?: string;
    },
  ) =>
    api.post<PosCompletion>(
      `/pos/events/${eventId}/reservations/${bookingId}/complete`,
      input,
    ),
};
