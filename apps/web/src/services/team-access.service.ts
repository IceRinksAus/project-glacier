import { api } from "@/lib/api";

export type OrganizationRole = "OWNER" | "MANAGER" | "STAFF" | "SCANNER";
export type OrganizationAccessScope = "ALL_EVENTS" | "ASSIGNED_EVENTS";

export interface TeamMember {
  id: string;
  role: OrganizationRole;
  accessScope: OrganizationAccessScope;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    isActive: boolean;
    eventAccess: Array<{
      event: {
        id: string;
        name: string;
        startDate: string;
        endDate: string;
        status: string;
      };
    }>;
  };
}

export interface UpdateTeamAccess {
  role: Exclude<OrganizationRole, "OWNER">;
  accessScope: OrganizationAccessScope;
  eventIds: string[];
}

export const teamAccessService = {
  getTeam: () => api.get<TeamMember[]>("/organization/team"),
  updateAccess: (userId: string, data: UpdateTeamAccess) =>
    api.patch<TeamMember>(`/organization/team/${userId}/access`, data),
};
