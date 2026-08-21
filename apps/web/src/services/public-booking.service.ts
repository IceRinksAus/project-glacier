import { publicApi } from "@/lib/public-api";

export interface PublicEvent {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  startDate: string;
  endDate: string;
  timezone: string | null;
  status: string;
  waiverPublicSlug: string | null;
}

export interface PublicEventSite extends PublicEvent {
  venueName: string | null;
  suburb: string | null;
  branding: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    backgroundColor: string;
    surfaceColor: string;
    textColor: string;
    headingFont: "INTER" | "NUNITO_SANS" | "PLAYFAIR_DISPLAY" | "OSWALD";
    bodyFont: "INTER" | "NUNITO_SANS" | "PLAYFAIR_DISPLAY" | "OSWALD";
    heroHeadline: string | null;
    heroDescription: string | null;
    logoAsset: { id: string; width: number; height: number } | null;
    heroAsset: { id: string; width: number; height: number } | null;
  } | null;
}

export interface PublicSession {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  capacity: number;
  status: string;
  salesStart: string | null;
  salesEnd: string | null;
  eventId: string;
}

export interface PublicTicketType {
  id: string;
  name: string;
  description: string | null;
  price: number;
  capacity: number;
  active: boolean;
  saleStart: string | null;
  saleEnd: string | null;
  eventId: string;
}

export interface PublicProduct {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  minQuantity: number;
  maxQuantity: number | null;
  salesStart: string | null;
  salesEnd: string | null;
  eventId: string;
  variants: PublicProductVariant[];
}

export interface PublicProductVariant {
  id: string;
  productId: string;
  name: string;
  slug: string;
  description: string | null;
  priceOverride: number | null;
  imageUrl: string | null;
  inventoryTracked: boolean;
  inventoryQuantity: number | null;
  remainingQuantity: number | null;
  sortOrder: number;
}

export interface PublicSessionProduct {
  id: string;
  sessionId: string;
  productId: string;
  sortOrder: number;
  remainingQuantity: number | null;
  product: PublicProduct;
}

export interface CreatePublicCustomerInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

export interface PublicCustomer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
}

export interface CreatePublicBookingParticipantInput {
  firstName: string;
  lastName?: string;
  age: number;
  ticketTypeId: string;
}

export interface CreatePublicBookingProductInput {
  productId: string;
  productVariantId?: string;
  quantity: number;
}

export interface CreatePublicBookingInput {
  customerId: string;
  eventId: string;
  sessionId: string;
  flexibleBooking?: boolean;
  participants: CreatePublicBookingParticipantInput[];
  products?: CreatePublicBookingProductInput[];
}

export interface PublicRulePreviewParticipant {
  firstName: string;
  lastName?: string;
  age: number;
  ticketTypeId: string;
}

export interface PublicRulePreviewInput {
  sessionId: string;
  flexibleBooking?: boolean;
  participants: PublicRulePreviewParticipant[];
}

export interface PublicRequiredProduct {
  productSlug: string;
  quantity: number;
  ruleIds: string[];
  messages: string[];
}

export interface PublicRulePreviewResponse {
  valid: boolean;
  matchedRuleIds: string[];
  requiredProducts: PublicRequiredProduct[];
  errors: string[];
  warnings: string[];
}

export interface PublicBookingResponse {
  booking: {
    id: string;
    bookingNumber: string;
    status: string;
    paymentStatus: string;
    total: number;
    reservedUntil: string | null;
    flexibleBooking: boolean;

    /*
     * Returned only when a public reservation is created.
     *
     * This credential is required for subsequent customer
     * operations such as payment.
     */
    publicAccessToken: string;

    customer: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      phone: string | null;
    };

    event: {
      id: string;
      name: string;
      slug: string;
      timezone: string | null;
    };

    session: {
      id: string;
      name: string;
      startDate: string;
      endDate: string;
    };

    items: Array<{
      ticketTypeId: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
      ticketType: {
        id: string;
        name: string;
      };
    }>;

    participants: Array<{
      id: string;
      firstName: string;
      lastName: string | null;
      age: number;
      ticketTypeId: string;
    }>;

    products: Array<{
      productId: string;
      quantity: number;
      unitPrice: number;
      product: {
        id: string;
        name: string;
        slug: string;
      };
    }>;
  };

  ruleEvaluation: {
    valid: boolean;
    matchedRuleIds: string[];
    requiredProducts: unknown[];
    errors: string[];
    warnings: string[];
  };
}

export interface PublicPaymentResponse {
  provider: string;
  paymentReference: string;
  status: "PENDING" | "SUCCEEDED" | "FAILED";
  clientSecret?: string;
}

export interface PublicBookingStatus {
  id: string;
  bookingNumber: string;
  status: string;
  paymentStatus: string;
  total: number;
  reservedUntil: string | null;
  confirmedAt: string | null;
  paidAt: string | null;
  event: {
    name: string;
    slug: string;
    waiverPublicSlug: string | null;
  };
  tickets: Array<{
    ticketNumber: string;
    secureToken: string;
    status: string;
    participant: {
      firstName: string;
      lastName: string | null;
    };
  }>;
}

export interface PublicTicketPresentation {
  ticketNumber: string;
  status: string;
  checkedInAt: string | null;
  participant: {
    firstName: string;
    lastName: string | null;
  };
  booking: {
    event: { name: string };
    session: {
      name: string;
      startDate: string;
      endDate: string;
    } | null;
  };
}

export const publicBookingService = {
  getEventSite(eventSlug: string) {
    return publicApi.get<PublicEventSite>(
      `/public/event-sites/${encodeURIComponent(eventSlug)}`,
    );
  },

  brandingAssetUrl(eventSlug: string, assetId: string) {
    return `${process.env.NEXT_PUBLIC_API_URL}/public/event-sites/${encodeURIComponent(eventSlug)}/assets/${encodeURIComponent(assetId)}`;
  },

  getEvent(eventId: string) {
    return publicApi.get<PublicEvent>(`/public/events/${eventId}`);
  },

  getSessions(eventId: string) {
    return publicApi.get<PublicSession[]>(`/public/events/${eventId}/sessions`);
  },

  getTicketTypes(eventId: string) {
    return publicApi.get<PublicTicketType[]>(
      `/public/events/${eventId}/ticket-types`,
    );
  },

  evaluateRules(eventId: string, data: PublicRulePreviewInput) {
    return publicApi.post<PublicRulePreviewResponse>(
      `/public/events/${eventId}/evaluate-rules`,
      data,
    );
  },

  getSessionProducts(sessionId: string) {
    return publicApi.get<PublicSessionProduct[]>(
      `/public/sessions/${sessionId}/products`,
    );
  },

  createCustomer(data: CreatePublicCustomerInput) {
    return publicApi.post<PublicCustomer>("/public/customers", data);
  },

  createBooking(data: CreatePublicBookingInput) {
    return publicApi.post<PublicBookingResponse>("/public/bookings", data);
  },

  createPayment(bookingId: string, publicAccessToken: string) {
    return publicApi.post<PublicPaymentResponse>(
      `/public/bookings/${bookingId}/payments`,
      {
        publicAccessToken,
      },
    );
  },

  getBookingStatus(bookingId: string, publicAccessToken: string) {
    return publicApi.post<PublicBookingStatus>(
      `/public/bookings/${bookingId}/status`,
      { publicAccessToken },
    );
  },

  getTicket(token: string) {
    return publicApi.get<PublicTicketPresentation>(
      `/ticket/token/${encodeURIComponent(token)}`,
    );
  },

  ticketQrUrl(token: string) {
    return `${process.env.NEXT_PUBLIC_API_URL}/ticket/token/${encodeURIComponent(token)}/qr`;
  },
};
