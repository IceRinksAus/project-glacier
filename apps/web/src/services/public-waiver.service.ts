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
}

export interface CreateWaiverSubmissionInput {
  signatoryFullName: string;
  accepted: true;
  signatureData: string;
  minors?: WaiverMinorInput[];
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
};
