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

export interface RetailProductVariant {
  id: string;
  name: string;
  priceOverride: number | null;
  inventoryTracked: boolean;
  remainingInventory: number | null;
}

export interface RetailProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  minQuantity: number;
  maxQuantity: number | null;
  inventoryTracked: boolean;
  remainingInventory: number | null;
  productGroup: { id: string; name: string; sortOrder: number } | null;
  variants: RetailProductVariant[];
}

export interface RetailCatalogue {
  event: { id: string; name: string; timezone: string | null };
  products: RetailProduct[];
}

export interface RetailSale {
  id: string;
  saleNumber: string;
  status: "RESERVED" | "COMPLETED" | "EXPIRED";
  paymentStatus: "UNPAID" | "PAID";
  total: number;
  currency: string;
  reservedUntil: string;
  completedAt: string | null;
  completedByUser: { id: string; name: string } | null;
  items: Array<{
    id: string;
    productNameSnapshot: string;
    variantNameSnapshot: string | null;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  payments: Array<{
    id: string;
    method: "CASH" | "STANDALONE_EFTPOS";
    amount: number;
    standaloneReference: string | null;
    receivedAt: string | null;
    receivedByUser: { id: string; name: string } | null;
  }>;
}

export interface RetailSaleSearchResult {
  total: number;
  page: number;
  pageSize: number;
  sales: Array<{
    id: string;
    saleNumber: string;
    status: "RESERVED" | "COMPLETED" | "EXPIRED";
    paymentStatus: "UNPAID" | "PAID";
    total: number;
    createdAt: string;
    completedAt: string | null;
    completedByUser: { id: string; name: string } | null;
    payments: Array<{ method: "CASH" | "STANDALONE_EFTPOS" }>;
    _count: { items: number };
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

  getMerchandiseCatalogue: (eventId: string) =>
    api.get<RetailCatalogue>(`/pos/events/${eventId}/merchandise`),

  createRetailSale: (
    eventId: string,
    items: Array<{
      productId: string;
      productVariantId?: string;
      quantity: number;
    }>,
  ) => api.post<RetailSale>(`/pos/events/${eventId}/retail-sales`, { items }),

  completeRetailSale: (
    eventId: string,
    retailSaleId: string,
    input: {
      method: "CASH" | "STANDALONE_EFTPOS";
      amount: number;
      idempotencyKey: string;
      standaloneReference?: string;
    },
  ) =>
    api.post<RetailSale>(
      `/pos/events/${eventId}/retail-sales/${retailSaleId}/complete`,
      input,
    ),

  searchRetailSales: (eventId: string, search = "") =>
    api.get<RetailSaleSearchResult>(
      `/pos/events/${eventId}/retail-sales${search ? `?search=${encodeURIComponent(search)}` : ""}`,
    ),

  getRetailSale: (eventId: string, retailSaleId: string) =>
    api.get<RetailSale>(`/pos/events/${eventId}/retail-sales/${retailSaleId}`),
};
