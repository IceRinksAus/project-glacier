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
  imageAsset: CatalogueAsset | null;
  saleStart: string | null;
  saleEnd: string | null;
  eventId: string;
}

export interface CreateTicketType {
  eventId: string;
  name: string;
  description?: string;
  price: number;
  active: boolean;
  tileLabel?: string;
  tileColor?: string;
}

export const ticketTypeService = {
  findForEvent: (eventId: string) =>
    api.get<TicketType[]>(
      `/ticket-type?eventId=${encodeURIComponent(eventId)}`,
    ),

  create: (data: CreateTicketType) =>
    api.post<TicketType>("/ticket-type", data),

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
};
