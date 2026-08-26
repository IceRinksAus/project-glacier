import { api } from "@/lib/api";

export type AdjustmentAction = "CANCEL_ONLY" | "CANCEL_AND_REFUND";
export type AdjustmentReason =
  | "MEDICAL_COMPASSIONATE"
  | "EVENT_SESSION_ISSUE"
  | "DUPLICATE_PURCHASE"
  | "ORGANISER_CORRECTION"
  | "OTHER";

export interface TicketAdjustmentContext {
  id: string;
  bookingNumber: string;
  status: string;
  paymentStatus: string;
  tickets: Array<{
    id: string;
    ticketNumber: string;
    status: string;
    checkedInAt: string | null;
    cancelledAt: string | null;
    participantName: string;
    ticketTypeName: string;
    unitValue: number | null;
    eligible: boolean;
  }>;
  productsUnchanged: Array<{ id: string; name: string; quantity: number }>;
  adjustments: Array<{
    id: string;
    adjustmentNumber: string;
    action: AdjustmentAction;
    status: string;
    reason: AdjustmentReason;
    note: string;
    requestedAmount: number;
    refundedAmount: number;
    createdAt: string;
    completedAt: string | null;
    requestedByUser: { id: string; name: string };
    payment: { method: string } | null;
    paymentRefund: { amount: number; currency: string; status: string } | null;
    allocations: Array<{
      ticketNumberSnapshot: string;
      participantNameSnapshot: string;
    }>;
  }>;
}

export interface TicketAdjustmentPreview {
  previewHash: string;
  action: AdjustmentAction;
  reason: AdjustmentReason;
  note: string;
  refundAmount: number;
  currency: string;
  capacityPlacesReleased: number;
  payment: {
    id: string;
    method: "ONLINE_CARD" | "CASH" | "STANDALONE_EFTPOS";
    remaining: number;
  } | null;
  allocations: Array<{
    ticketId: string;
    ticketNumber: string;
    participantName: string;
    ticketTypeName: string;
    unitValue: number;
  }>;
  productsUnchanged: Array<{
    bookingProductId: string;
    name: string;
    quantity: number;
  }>;
}

export const ticketAdjustmentService = {
  context: (bookingId: string) =>
    api.get<TicketAdjustmentContext>(
      `/booking/${bookingId}/ticket-adjustments`,
    ),
  preview: (
    bookingId: string,
    input: {
      action: AdjustmentAction;
      reason: AdjustmentReason;
      note: string;
      ticketIds: string[];
    },
  ) =>
    api.post<TicketAdjustmentPreview>(
      `/booking/${bookingId}/ticket-adjustments/preview`,
      input,
    ),
  execute: (
    bookingId: string,
    input: {
      action: AdjustmentAction;
      reason: AdjustmentReason;
      note: string;
      ticketIds: string[];
      previewHash: string;
      idempotencyKey: string;
      manualRefundConfirmed?: boolean;
      standaloneReference?: string;
    },
  ) => api.post(`/booking/${bookingId}/ticket-adjustments`, input),
};
