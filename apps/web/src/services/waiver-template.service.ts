import { api } from "@/lib/api";

export type WaiverTemplateStatus = "DRAFT" | "APPROVED" | "RETIRED";
export type WaiverTemplateAuthority = "PLATFORM_CURATED" | "ORGANIZATION";

export interface WaiverTemplate {
  id: string;
  authority: WaiverTemplateAuthority;
  organizationId: string | null;
  name: string;
  activityType: "ICE_SKATING" | "OTHER";
  jurisdiction: "ACT" | "NSW" | "NT" | "QLD" | "SA" | "TAS" | "VIC" | "WA";
  revision: number;
  contentTemplate: string;
  acceptanceStatement: string;
  legislationReferences: string[] | null;
  status: WaiverTemplateStatus;
  approvedAt: string | null;
  approvalReference: string | null;
  approvedByUser: { id: string; name: string } | null;
  waiverVersions: Array<{
    eventWaiver: { event: { id: string; name: string } };
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWaiverTemplate {
  name: string;
  activityType: WaiverTemplate["activityType"];
  jurisdiction: WaiverTemplate["jurisdiction"];
  contentTemplate: string;
  acceptanceStatement: string;
  legislationReferences?: string[];
}

export const waiverTemplateService = {
  list: () => api.get<WaiverTemplate[]>("/waiver-templates"),
  create: (data: CreateWaiverTemplate) =>
    api.post<WaiverTemplate>("/waiver-templates", data),
  approve: (templateId: string, approvalReference: string) =>
    api.post<WaiverTemplate>(`/waiver-templates/${templateId}/approve`, {
      approvalReference,
    }),
  retire: (templateId: string) =>
    api.post<WaiverTemplate>(`/waiver-templates/${templateId}/retire`, {}),
};
