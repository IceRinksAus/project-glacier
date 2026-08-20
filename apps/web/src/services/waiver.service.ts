import { api } from "@/lib/api";

export interface WaiverVersion {
  id: string;
  version: number;
  title: string;
  content: string;
  acceptanceStatement: string;
  contentHash: string;
  status: "DRAFT" | "PUBLISHED" | "SUPERSEDED";
  publishedAt: string | null;
  createdAt: string;
  sourceTemplate: {
    id: string;
    name: string;
    revision: number;
    jurisdiction: string;
    activityType: string;
  };
  publishedByUser: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export interface EventWaiverAdministration {
  id: string;
  eventId: string;
  publicSlug: string;
  createdAt: string;
  updatedAt: string;
  versions: WaiverVersion[];
}

export interface WaiverSubmissionSummary {
  id: string;
  signatoryFullName: string;
  acceptedAt: string;
  waiverVersion: {
    version: number;
    title: string;
  };
  _count: {
    minors: number;
  };
}

export interface WaiverSubmissionDetail {
  id: string;
  signatoryFullName: string;
  signatureData: string;
  acceptedAt: string;
  waiverContentHash: string;
  acceptanceStatementHash: string;
  waiverVersion: {
    version: number;
    title: string;
    content: string;
    acceptanceStatement: string;
    publishedAt: string | null;
  };
  minors: Array<{
    id: string;
    fullName: string;
    dateOfBirth: string;
  }>;
}

export interface WaiverQrCode {
  publicUrl: string;
  qrCodeDataUrl: string;
}

export const waiverService = {
  findForEvent(eventId: string) {
    return api.get<EventWaiverAdministration | null>(
      `/event/${eventId}/waiver`,
    );
  },

  createDraft(eventId: string) {
    return api.post<WaiverVersion>(`/event/${eventId}/waiver/drafts`, {});
  },

  generatePublicQrCode(eventId: string) {
    return api.get<WaiverQrCode>(`/event/${eventId}/waiver/qr-code`);
  },

  publishDraft(eventId: string, waiverVersionId: string) {
    return api.post<WaiverVersion>(
      `/event/${eventId}/waiver/versions/${waiverVersionId}/publish`,
      {},
    );
  },

  listSubmissions(eventId: string, search?: string) {
    const query = search?.trim()
      ? `?search=${encodeURIComponent(search.trim())}`
      : "";

    return api.get<WaiverSubmissionSummary[]>(
      `/event/${eventId}/waiver/submissions${query}`,
    );
  },

  findSubmission(eventId: string, submissionId: string) {
    return api.get<WaiverSubmissionDetail>(
      `/event/${eventId}/waiver/submissions/${submissionId}`,
    );
  },
};
