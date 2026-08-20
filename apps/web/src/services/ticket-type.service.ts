import { api } from "@/lib/api";

export interface TicketType {
  id: string;
  name: string;
  description: string | null;
  price: string | number;
  capacity: number;
  active: boolean;
  saleStart: string | null;
  saleEnd: string | null;
  eventId: string;
}

export interface CreateTicketType {
  eventId: string;
  name: string;
  description?: string;
  price: number;
  capacity: number;
  active: boolean;
}

export const ticketTypeService = {
  findForEvent: (eventId: string) =>
    api.get<TicketType[]>(`/ticket-type?eventId=${encodeURIComponent(eventId)}`),

  create: (data: CreateTicketType) =>
    api.post<TicketType>("/ticket-type", data),
};
