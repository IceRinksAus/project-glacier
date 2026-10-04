import { api } from "@/lib/api";

export type CheckoutDocumentType =
  "TICKETING_TERMS" | "PRIVACY_NOTICE" | "MARKETING_DISCLOSURE";

export interface CheckoutDocument {
  id: string;
  type: CheckoutDocumentType;
  version: number;
  status: "DRAFT" | "PUBLISHED" | "SUPERSEDED";
  title: string;
  content: string;
  contentHash: string;
  testOnly: boolean;
  publishedAt: string | null;
  createdAt: string;
  createdByUser: { id: string; name: string };
  publishedByUser: { id: string; name: string } | null;
}

export interface CheckoutConsentContext {
  event: { id: string; name: string; status: string };
  documents: CheckoutDocument[];
  readiness: {
    readyForTicketCheckout: boolean;
    termsPublished: boolean;
    privacyPublished: boolean;
    marketingChoiceAvailable: boolean;
  };
}

const root = "/checkout-consent/events";

export const checkoutConsentService = {
  context: (eventId: string) =>
    api.get<CheckoutConsentContext>(`${root}/${eventId}`),
  createDraft: (
    eventId: string,
    input: {
      type: CheckoutDocumentType;
      title: string;
      content: string;
      testOnly: boolean;
    },
  ) => api.post<CheckoutDocument>(`${root}/${eventId}/documents`, input),
  publish: (eventId: string, documentId: string) =>
    api.post<CheckoutDocument>(
      `${root}/${eventId}/documents/${documentId}/publish`,
      {},
    ),
};
