import { api } from "@/lib/api";

export interface CustomerListItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  createdAt: string;
  bookingCount: number;
  latestBooking: {
    id: string;
    bookingNumber: string;
    createdAt: string;
    event: { id: string; name: string };
  } | null;
}

export interface CustomerSearchResponse {
  items: CustomerListItem[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface CustomerDetail {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  createdAt: string;
  bookings: Array<{
    id: string;
    bookingNumber: string;
    status: string;
    paymentStatus: string;
    total: string | number;
    createdAt: string;
    event: { id: string; name: string };
    items: Array<{
      id: string;
      quantity: number;
      ticketType: { id: string; name: string };
    }>;
  }>;
}

export const customerService = {
  search: (query: {
    search?: string;
    eventId?: string;
    page: number;
    pageSize: number;
  }) => {
    const params = new URLSearchParams();
    if (query.search) params.set("search", query.search);
    if (query.eventId) params.set("eventId", query.eventId);
    params.set("page", String(query.page));
    params.set("pageSize", String(query.pageSize));
    return api.get<CustomerSearchResponse>(`/customer/search?${params}`);
  },
  findOne: (customerId: string) =>
    api.get<CustomerDetail>(`/customer/${customerId}`),
};
