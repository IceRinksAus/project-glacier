import { api } from "@/lib/api";

export type BookingRescheduleReason =
  "CUSTOMER_REQUEST" | "EVENT_SESSION_ISSUE" | "ORGANISER_CORRECTION" | "OTHER";

type SessionSummary = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
};

export interface BookingRescheduleContext {
  bookingId: string;
  bookingNumber: string;
  eligible: boolean;
  eligibilityReasons: string[];
  currentSession: SessionSummary | null;
  ticketCount: number;
  total: number;
  products: Array<{
    bookingProductId: string;
    name: string;
    quantity: number;
    capacityControlled: boolean;
    finiteInventoryUnchanged: boolean;
  }>;
  destinations: Array<
    SessionSummary & {
      capacity: number;
      remainingAdmissionBeforeMove: number;
      remainingAdmissionAfterMove: number;
      productEffects: ProductEffect[];
    }
  >;
  history: BookingRescheduleResult[];
}

export type ProductEffect = {
  bookingProductId: string;
  productId: string;
  name: string;
  quantity: number;
  capacityTransferred: number;
  remainingCapacity: number | null;
  originalSessionProductId: string | null;
  destinationSessionProductId: string;
  finiteInventoryUnchanged: boolean;
};

export interface BookingReschedulePreview {
  previewHash: string;
  bookingId: string;
  bookingNumber: string;
  reason: BookingRescheduleReason;
  note: string;
  originalSession: SessionSummary;
  destinationSession: SessionSummary;
  ticketCount: number;
  admissionPlacesTransferred: number;
  tickets: Array<{
    id: string;
    ticketNumber: string;
    participantName: string;
    ticketTypeName: string;
  }>;
  productEffects: ProductEffect[];
  totalUnchanged: number;
  priceDifference: 0;
  finiteInventoryUnchanged: true;
}

export interface BookingRescheduleResult {
  id: string;
  rescheduleNumber: string;
  status: string;
  reason: BookingRescheduleReason;
  note: string;
  ticketCount: number;
  admissionPlacesTransferred: number;
  createdAt: string;
  completedAt: string | null;
  originalSession: SessionSummary;
  destinationSession: SessionSummary;
  requestedByUser: { id: string; name: string };
  ticketMappings: Array<{
    id: string;
    participantNameSnapshot: string;
    ticketTypeNameSnapshot: string;
    originalTicketNumberSnapshot: string;
    replacementTicketNumberSnapshot: string | null;
    originalTicket?: { id: string; ticketNumber: string; status: string };
    replacementTicket?: {
      id: string;
      ticketNumber: string;
      status: string;
    } | null;
  }>;
  productAllocations: Array<{
    id: string;
    productNameSnapshot: string;
    variantNameSnapshot: string | null;
    quantity: number;
    capacityTransferred: number;
  }>;
}

type PreviewInput = {
  destinationSessionId: string;
  reason: BookingRescheduleReason;
  note: string;
};

export const bookingRescheduleService = {
  context: (bookingId: string) =>
    api.get<BookingRescheduleContext>(`/booking/${bookingId}/reschedules`),
  preview: (bookingId: string, input: PreviewInput) =>
    api.post<BookingReschedulePreview>(
      `/booking/${bookingId}/reschedules/preview`,
      input,
    ),
  execute: (
    bookingId: string,
    input: PreviewInput & { previewHash: string; idempotencyKey: string },
  ) =>
    api.post<BookingRescheduleResult>(
      `/booking/${bookingId}/reschedules`,
      input,
    ),
};
