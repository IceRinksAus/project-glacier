import { api } from "@/lib/api";
import type { CatalogueAsset } from "@/services/product-setup.service";

export interface TicketType {
  id: string;
  name: string;
  description: string | null;
  price: string | number;
  capacity: number;
  active: boolean;
  tileLabel: string | null;
  tileColor: string;
  minimumAge: number | null;
  maximumAge: number | null;
  imageAsset: CatalogueAsset | null;
  saleStart: string | null;
  saleEnd: string | null;
  eventId: string;
}

export interface TicketCompanionRule {
  id: string;
  eventId: string;
  ruleType: string;
  status: string;
  conditions: {
    all?: Array<{ field?: string; operator?: string; value?: unknown }>;
  };
  actions: { type?: string };
  message: string | null;
}

export interface CreateTicketType {
  eventId: string;
  name: string;
  description?: string;
  price: number;
  active: boolean;
  tileLabel?: string;
  tileColor?: string;
  minimumAge?: number;
  maximumAge?: number;
}

export const ticketTypeService = {
  findForEvent: (eventId: string) =>
    api.get<TicketType[]>(
      `/ticket-type?eventId=${encodeURIComponent(eventId)}`,
    ),

  create: (data: CreateTicketType) =>
    api.post<TicketType>("/ticket-type", data),

  updatePresentation: (
    ticketTypeId: string,
    data: { tileLabel?: string; tileColor: string },
  ) => api.patch<TicketType>(`/ticket-type/${ticketTypeId}/presentation`, data),

  updateAgePolicy: (
    ticketTypeId: string,
    data: { minimumAge: number | null; maximumAge: number | null },
  ) => api.patch<TicketType>(`/ticket-type/${ticketTypeId}/age-policy`, data),

  uploadImage: (ticketTypeId: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    form.append("displayName", file.name);
    return api.upload<CatalogueAsset>(
      `/ticket-type/${ticketTypeId}/image`,
      form,
    );
  },

  removeImage: (ticketTypeId: string) =>
    api.delete<void>(`/ticket-type/${ticketTypeId}/image`),

  findRules: () => api.get<TicketCompanionRule[]>("/rule"),

  createCompanionRule: (data: {
    eventId: string;
    name: string;
    slug: string;
    description: string;
    ruleType: "TICKET_COMPANION_REQUIREMENT";
    scope: "PARTICIPANT";
    status: "ACTIVE";
    priority: number;
    conditions: {
      all: Array<{
        field: "ticketTypeId" | "bookingTicketTypeIds";
        operator: "EQUALS" | "NOT_CONTAINS";
        value: string;
      }>;
    };
    actions: { type: "BLOCK_BOOKING" };
    message: string;
    stopProcessing: false;
  }) => api.post<TicketCompanionRule>("/rule", data),

  updateCompanionRule: (
    ruleId: string,
    data: {
      status: "ACTIVE" | "INACTIVE";
      conditions?: {
        all: Array<{
          field: "ticketTypeId" | "bookingTicketTypeIds";
          operator: "EQUALS" | "NOT_CONTAINS";
          value: string;
        }>;
      };
      actions?: { type: "BLOCK_BOOKING" };
      message?: string;
    },
  ) => api.patch<TicketCompanionRule>(`/rule/${ruleId}`, data),
};
