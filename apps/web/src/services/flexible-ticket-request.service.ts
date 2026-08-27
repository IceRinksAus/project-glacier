import { api } from "@/lib/api";
import { publicApi } from "@/lib/public-api";

export type FlexibleTicketRequestType = "REFUND" | "SESSION_CHANGE";
export type FlexibleTicketRequestStatus =
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "COMPLETED"
  | "DECLINED"
  | "WITHDRAWN"
  | "FAILED"
  | "EXPIRED";
export type FlexibleTicketRequestReason =
  "CHANGE_OF_PLANS" | "ILLNESS_OR_INJURY" | "BOOKING_ERROR" | "OTHER";
export type FlexibleTicketDecisionReason =
  | "APPROVED_UNDER_ENTITLEMENT"
  | "OUTSIDE_ENTITLEMENT"
  | "INELIGIBLE_TICKET"
  | "CUTOFF_PASSED"
  | "CAPACITY_UNAVAILABLE"
  | "PAYMENT_ACTION_REQUIRED"
  | "OTHER";

export interface FlexibleTicketRequestSummary {
  requestNumber: string;
  type: FlexibleTicketRequestType;
  status: FlexibleTicketRequestStatus;
  customerReason: FlexibleTicketRequestReason;
  customerNote: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  decidedAt: string | null;
  withdrawnAt?: string | null;
  completedAt: string | null;
  failedAt: string | null;
  expiredAt: string | null;
  destinationSession: {
    id: string;
    name: string;
    startDate: string;
    endDate?: string;
  } | null;
  items: Array<{
    entitlementNumber?: string;
    participantName: string;
    ticketId?: string;
    ticketNumber: string;
    ticketTypeName: string;
    ticketValue: number;
    flexibleFee: number;
    currency: string;
    cutoffAt: string;
    remainingUses?: number;
    remainingUsesSnapshot?: number;
    feeRefundability?: string;
  }>;
  adjustment: {
    adjustmentNumber: string;
    status: string;
    requestedAmount?: number;
    refundedAmount?: number;
  } | null;
  reschedule: { rescheduleNumber: string; status: string } | null;
  canWithdraw?: boolean;
  reviewedByUser?: { id: string; name: string } | null;
  decisionReason?: FlexibleTicketDecisionReason | null;
  decisionNote?: string | null;
  useAllocations?: Array<{
    entitlementId: string;
    remainingUsesBefore: number;
    remainingUsesAfter: number;
  }>;
}

export interface PublicFlexibleTicketRequestContext {
  booking: {
    id: string;
    bookingNumber: string;
    status: string;
    paymentStatus: string;
    event: { id: string; name: string; timezone: string | null };
    session: {
      id: string;
      name: string;
      startDate: string;
      endDate: string;
    } | null;
  };
  entitlements: Array<{
    id: string;
    entitlementNumber: string;
    participantId: string;
    participantName: string;
    ticketId: string | null;
    ticketNumber: string | null;
    status: string;
    remainingUses: number;
    cutoffAt: string;
    ticketValue: number;
    feeAmount: number;
    currency: string;
    feeRefundability: string;
    canRequestRefund: boolean;
    canRequestSessionChange: boolean;
  }>;
  canRequestSessionChange: boolean;
  destinations: Array<{
    id: string;
    name: string;
    startDate: string;
    endDate: string;
  }>;
  requests: FlexibleTicketRequestSummary[];
}

export interface OperatorFlexibleTicketRequestContext {
  bookingId: string;
  bookingNumber: string;
  requests: FlexibleTicketRequestSummary[];
}

export interface FlexibleTicketDecisionPreview {
  previewHash: string;
  decision: "APPROVE" | "DECLINE";
  reason: FlexibleTicketDecisionReason;
  note: string;
  request: FlexibleTicketRequestSummary;
  mutation: null | {
    previewHash: string;
    refundAmount?: number;
    currency?: string;
    ticketCount?: number;
    payment?: { method: string } | null;
    destinationSession?: { name: string; startDate: string };
    capacityPlacesReleased?: number;
  };
  consumesUses: number;
}

export const flexibleTicketRequestService = {
  publicContext(bookingId: string, publicAccessToken: string) {
    return publicApi.post<PublicFlexibleTicketRequestContext>(
      `/public/bookings/${bookingId}/flexible-ticket-requests/context`,
      { publicAccessToken },
    );
  },

  createPublic(
    bookingId: string,
    input: {
      publicAccessToken: string;
      idempotencyKey: string;
      type: FlexibleTicketRequestType;
      entitlementIds: string[];
      destinationSessionId?: string;
      customerReason: FlexibleTicketRequestReason;
      customerNote?: string;
    },
  ) {
    return publicApi.post<FlexibleTicketRequestSummary>(
      `/public/bookings/${bookingId}/flexible-ticket-requests`,
      input,
    );
  },

  withdrawPublic(
    bookingId: string,
    requestNumber: string,
    publicAccessToken: string,
  ) {
    return publicApi.post<FlexibleTicketRequestSummary>(
      `/public/bookings/${bookingId}/flexible-ticket-requests/${requestNumber}/withdraw`,
      { publicAccessToken },
    );
  },

  operatorContext(bookingId: string) {
    return api.get<OperatorFlexibleTicketRequestContext>(
      `/booking/${bookingId}/flexible-ticket-requests`,
    );
  },

  review(bookingId: string, requestNumber: string) {
    return api.post<FlexibleTicketRequestSummary>(
      `/booking/${bookingId}/flexible-ticket-requests/${requestNumber}/review`,
      {},
    );
  },

  previewDecision(
    bookingId: string,
    requestNumber: string,
    input: {
      decision: "APPROVE" | "DECLINE";
      reason: FlexibleTicketDecisionReason;
      note: string;
    },
  ) {
    return api.post<FlexibleTicketDecisionPreview>(
      `/booking/${bookingId}/flexible-ticket-requests/${requestNumber}/decision-preview`,
      input,
    );
  },

  executeDecision(
    bookingId: string,
    requestNumber: string,
    input: {
      decision: "APPROVE" | "DECLINE";
      reason: FlexibleTicketDecisionReason;
      note: string;
      previewHash: string;
      manualRefundConfirmed?: boolean;
      standaloneReference?: string;
    },
  ) {
    return api.post<FlexibleTicketRequestSummary>(
      `/booking/${bookingId}/flexible-ticket-requests/${requestNumber}/decision`,
      input,
    );
  },
};
