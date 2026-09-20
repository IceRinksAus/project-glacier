import { publicApi } from "@/lib/public-api";

export interface PublicWaiver {
  event: {
    name: string;
    venueName: string | null;
    startDate: string;
    endDate: string;
  };
  waiver: {
    publicSlug: string;
    version: number;
    title: string;
    content: string;
    acceptanceStatement: string;
    publishedAt: string;
  };
}

export interface WaiverMinorInput {
  fullName: string;
  dateOfBirth: string;
  bookingParticipantId?: string;
}

export interface CreateWaiverSubmissionInput {
  signatoryFullName: string;
  accepted: true;
  signatureData: string;
  signatoryParticipating: boolean;
  mediaConsent?: boolean;
  marketingConsent?: boolean;
  bookingId?: string;
  publicAccessToken?: string;
  signatoryParticipantId?: string;
  minors?: WaiverMinorInput[];
}

export interface WaiverBookingContext {
  bookingId: string;
  bookingNumber: string;
  participants: Array<{
    id: string;
    firstName: string;
    lastName: string | null;
    age: number;
    ticketType: { name: string };
  }>;
}

export interface WaiverVerification {
  verified: true;
  eventName: string;
  waiverTitle: string;
  waiverVersion: number;
  acceptedAt: string;
  verificationUrl: string;
  qrCodeDataUrl: string;
}

export interface WaiverSubmissionResponse {
  submissionId: string;
  acceptedAt: string;
  verificationToken: string;
}

export const publicWaiverService = {
  findPublishedWaiver(publicSlug: string) {
    return publicApi.get<PublicWaiver>(`/public/waivers/${publicSlug}`);
  },

  submit(publicSlug: string, data: CreateWaiverSubmissionInput) {
    return publicApi.post<WaiverSubmissionResponse>(
      `/public/waivers/${publicSlug}/submissions`,
      data,
    );
  },

  bookingContext(
    publicSlug: string,
    bookingId: string,
    publicAccessToken: string,
  ) {
    return publicApi.post<WaiverBookingContext>(
      `/public/waivers/${publicSlug}/booking-context`,
      { bookingId, publicAccessToken },
    );
  },

  verify(verificationToken: string) {
    return publicApi.get<WaiverVerification>(
      `/public/waivers/verifications/${verificationToken}`,
    );
  },
};
