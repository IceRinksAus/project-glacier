import { api } from "@/lib/api";

export interface BookingListItem {
  id: string;
  bookingNumber: string;
  status: string;
  paymentStatus: string;
  total: string | number;
  createdAt: string;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
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

export interface PaymentInvestigation {
  id: string;
  bookingNumber: string;
  status: string;
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
    email: string;
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
    providerReferenceSummary: string | null;
    amount: number;
    currency: string;
    status: string;
    failureCode: string | null;
    failureMessage: string | null;
    succeededAt: string | null;
    failedAt: string | null;
    cancelledAt: string | null;
    createdAt: string;
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
