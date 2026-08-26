import { api } from "@/lib/api";

export interface BookingListItem {
  id: string;
  bookingNumber: string;
  status: string;
  source: "ONLINE" | "WALK_UP";
  paymentStatus: string;
  total: string | number;
  createdAt: string;
  customer: {
    firstName: string;
    lastName: string;
    email: string | null;
  };
  event: {
    id: string;
    name: string;
  };
  session: {
    id: string;
    name: string;
    startDate: string;
  } | null;
}

export interface BookingSearchOptions {
  search?: string;
  eventId?: string;
  sessionId?: string;
  bookingStatus?: string;
  paymentStatus?: string;
  sortBy?: "createdAt" | "sessionStart" | "customerName" | "total";
  sortDirection?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface BookingSearchResponse {
  items: BookingListItem[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface PaymentInvestigation {
  id: string;
  bookingNumber: string;
  status: string;
  source: "ONLINE" | "WALK_UP";
  paymentStatus: string;
  total: number;
  reservedUntil: string | null;
  confirmedAt: string | null;
  paidAt: string | null;
  expiredAt: string | null;
  createdAt: string;
  requiresReconciliation: boolean;
  customer: {
    firstName: string;
    lastName: string;
    email: string | null;
  };
  event: {
    id: string;
    name: string;
  };
  session: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
  } | null;
  tickets: Array<{
    ticketNumber: string;
    status: string;
    issuedAt: string;
  }>;
  payments: Array<{
    id: string;
    provider: string;
    method: "ONLINE_CARD" | "CASH" | "STANDALONE_EFTPOS";
    providerReferenceSummary: string | null;
    standaloneReference: string | null;
    amount: number;
    currency: string;
    status: string;
    failureCode: string | null;
    failureMessage: string | null;
    succeededAt: string | null;
    failedAt: string | null;
    cancelledAt: string | null;
    receivedAt: string | null;
    createdAt: string;
    receivedByUser: {
      id: string;
      name: string;
    } | null;
    refunds: Array<{
      id: string;
      amount: number;
      currency: string;
      status: string;
      reason: string | null;
      createdAt: string;
    }>;
  }>;
  paymentReconciliationAttempts: Array<{
    id: string;
    trigger: string;
    outcome: string;
    providerStatus: string | null;
    succeeded: boolean;
    errorMessage: string | null;
    attemptedAt: string;
    user: {
      id: string;
      name: string;
    };
  }>;
}

export const bookingOperationsService = {
  list: () =>
    api.get<BookingListItem[]>("/booking"),

  search: (options: BookingSearchOptions) => {
    const query = new URLSearchParams();

    for (const [key, value] of Object.entries(options)) {
      if (value !== undefined && value !== "") {
        query.set(key, String(value));
      }
    }

    return api.get<BookingSearchResponse>(
      `/booking/search?${query.toString()}`,
    );
  },

  investigate: (bookingId: string) =>
    api.get<PaymentInvestigation>(
      `/booking/${bookingId}/payment-investigation`,
    ),

  reconcile: (bookingId: string) =>
    api.post<{
      investigation: PaymentInvestigation;
    }>(
      `/booking/${bookingId}/payment-reconciliation`,
      {},
    ),
};
