import { api } from "@/lib/api";

export type FlexibleTicketEventMode = "INHERIT" | "OVERRIDE" | "DISABLED";
export type FlexibleTicketFeeType = "FIXED" | "PERCENTAGE";

export interface FlexibleTicketPolicyInput {
  available: boolean;
  feeType: FlexibleTicketFeeType;
  feeValue: number;
  allowsSessionChange: boolean;
  allowsRefundRequest: boolean;
  cutoffMinutesBeforeSession: number;
  permittedUseLimit: number;
  priceIncreaseTreatment: "CUSTOMER_PAYS_DIFFERENCE" | "CHANGE_NOT_PERMITTED";
  priceDecreaseTreatment: "KEEP_ORIGINAL_PRICE" | "REFUND_DIFFERENCE";
  feeRefundability:
    "NON_REFUNDABLE" | "REFUNDABLE_WITH_TICKET" | "EVENT_CANCELLATION_ONLY";
  customerSummary: string;
  materialTerms: string;
}

export interface FlexibleTicketPolicy extends FlexibleTicketPolicyInput {
  id: string;
  eventId: string | null;
  version: number;
  status: "DRAFT" | "PUBLISHED" | "SUPERSEDED";
  currency: string;
  sourceMode?: FlexibleTicketEventMode;
  publishedAt: string | null;
}

export interface FlexibleTicketPolicyContext {
  draft: FlexibleTicketPolicy | null;
  published: FlexibleTicketPolicy | null;
  history: FlexibleTicketPolicy[];
}

export interface FlexibleTicketEventContext {
  event: {
    id: string;
    name: string;
    flexibleTicketMode: FlexibleTicketEventMode;
  };
  organization: FlexibleTicketPolicyContext;
  override: FlexibleTicketPolicyContext;
  effectivePolicy: FlexibleTicketPolicy | null;
  ready: boolean;
}

const root = "/flexible-ticket-policies";

export const flexibleTicketPolicyService = {
  organization: () =>
    api.get<FlexibleTicketPolicyContext>(`${root}/organization`),
  createOrganizationDraft: (input: FlexibleTicketPolicyInput) =>
    api.post<FlexibleTicketPolicy>(`${root}/organization/drafts`, input),
  publishOrganization: (policyId: string) =>
    api.post<FlexibleTicketPolicy>(
      `${root}/organization/policies/${policyId}/publish`,
      {},
    ),
  event: (eventId: string) =>
    api.get<FlexibleTicketEventContext>(`${root}/events/${eventId}`),
  updateEventMode: (eventId: string, mode: FlexibleTicketEventMode) =>
    api.patch(`${root}/events/${eventId}/mode`, { mode }),
  createEventDraft: (eventId: string, input: FlexibleTicketPolicyInput) =>
    api.post<FlexibleTicketPolicy>(`${root}/events/${eventId}/drafts`, input),
  publishEvent: (eventId: string, policyId: string) =>
    api.post<FlexibleTicketPolicy>(
      `${root}/events/${eventId}/policies/${policyId}/publish`,
      {},
    ),
};
