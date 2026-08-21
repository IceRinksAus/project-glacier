"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

import type { SelectedBookingProduct } from "./AddOnsStep";
import {
  PublicBookingResponse,
  PublicRulePreviewResponse,
} from "@/services/public-booking.service";

export interface BookingParticipantData {
  firstName: string;
  lastName: string;
  age: string;
}

export interface BookingCustomerData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface BookingJourneyState {
  selectedSessionId: string | null;
  ticketQuantities: Record<string, number>;
  participantData: Record<string, BookingParticipantData>;
  rulePreview: PublicRulePreviewResponse | null;
  selectedProducts: SelectedBookingProduct[];
  productSubtotal: number;
  customerData: BookingCustomerData;
  reservation: PublicBookingResponse | null;
  paymentSubmitted: boolean;
  selectSession: (sessionId: string) => void;
  setTicketQuantity: (ticketTypeId: string, quantity: number) => void;
  updateParticipant: (
    key: string,
    field: keyof BookingParticipantData,
    value: string,
  ) => void;
  setRulePreview: (preview: PublicRulePreviewResponse | null) => void;
  updateSelectedProducts: (
    products: SelectedBookingProduct[],
    subtotal: number,
  ) => void;
  updateCustomer: (field: keyof BookingCustomerData, value: string) => void;
  setReservation: (reservation: PublicBookingResponse | null) => void;
  setPaymentSubmitted: (submitted: boolean) => void;
  totalTicketQuantity: number;
}

const BookingJourneyContext = createContext<BookingJourneyState | null>(null);

export function BookingJourneyProvider({ children }: { children: React.ReactNode }) {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [ticketQuantities, setTicketQuantities] = useState<Record<string, number>>({});
  const [participantData, setParticipantData] = useState<
    Record<string, BookingParticipantData>
  >({});
  const [rulePreview, setRulePreview] = useState<PublicRulePreviewResponse | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<SelectedBookingProduct[]>([]);
  const [productSubtotal, setProductSubtotal] = useState(0);
  const [customerData, setCustomerData] = useState<BookingCustomerData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [reservation, setReservation] = useState<PublicBookingResponse | null>(null);
  const [paymentSubmitted, setPaymentSubmitted] = useState(false);

  const updateSelectedProducts = useCallback(
    (products: SelectedBookingProduct[], subtotal: number) => {
      setSelectedProducts(products);
      setProductSubtotal(subtotal);
    },
    [],
  );
  const updateCustomer = useCallback(
    (field: keyof BookingCustomerData, value: string) => {
      setCustomerData((current) => ({ ...current, [field]: value }));
    },
    [],
  );

  const value = useMemo<BookingJourneyState>(
    () => ({
      selectedSessionId,
      ticketQuantities,
      participantData,
      rulePreview,
      selectedProducts,
      productSubtotal,
      customerData,
      reservation,
      paymentSubmitted,
      selectSession(sessionId) {
        if (sessionId !== selectedSessionId) {
          setSelectedSessionId(sessionId);
          setTicketQuantities({});
          setParticipantData({});
          setRulePreview(null);
          setSelectedProducts([]);
          setProductSubtotal(0);
          setReservation(null);
          setPaymentSubmitted(false);
        }
      },
      setTicketQuantity(ticketTypeId, quantity) {
        setTicketQuantities((current) => ({
          ...current,
          [ticketTypeId]: Math.max(0, quantity),
        }));
        setRulePreview(null);
      },
      updateParticipant(key, field, value) {
        setParticipantData((current) => ({
          ...current,
          [key]: {
            firstName: current[key]?.firstName ?? "",
            lastName: current[key]?.lastName ?? "",
            age: current[key]?.age ?? "",
            [field]: value,
          },
        }));
        setRulePreview(null);
      },
      setRulePreview,
      updateSelectedProducts,
      updateCustomer,
      setReservation,
      setPaymentSubmitted,
      totalTicketQuantity: Object.values(ticketQuantities).reduce(
        (total, quantity) => total + quantity,
        0,
      ),
    }),
    [
      customerData,
      participantData,
      paymentSubmitted,
      productSubtotal,
      reservation,
      rulePreview,
      selectedProducts,
      selectedSessionId,
      ticketQuantities,
      updateSelectedProducts,
      updateCustomer,
    ],
  );

  return (
    <BookingJourneyContext.Provider value={value}>
      {children}
    </BookingJourneyContext.Provider>
  );
}

export function useBookingJourney() {
  const context = useContext(BookingJourneyContext);

  if (!context) {
    throw new Error("useBookingJourney must be used within BookingJourneyProvider.");
  }

  return context;
}
