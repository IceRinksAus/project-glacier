"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import type { SelectedBookingProduct } from "./AddOnsStep";
import {
  PublicBookingResponse,
  PublicBookingStatus,
  PublicEventSite,
  PublicFlexibleTicketQuote,
  PublicRulePreviewResponse,
  publicBookingService,
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
  eventSite: PublicEventSite | null;
  eventSiteLoaded: boolean;
  selectedDateKey: string | null;
  selectedSessionId: string | null;
  ticketQuantities: Record<string, number>;
  flexibleTicketQuote: PublicFlexibleTicketQuote | null;
  flexibleTicketQuantities: Record<string, number>;
  flexibleTicketDecision: "UNDECIDED" | "ACCEPTED" | "DECLINED";
  participantData: Record<string, BookingParticipantData>;
  rulePreview: PublicRulePreviewResponse | null;
  selectedProducts: SelectedBookingProduct[];
  productSubtotal: number;
  customerData: BookingCustomerData;
  reservation: PublicBookingResponse | null;
  paymentSubmitted: boolean;
  bookingStatus: PublicBookingStatus | null;
  selectDate: (dateKey: string) => void;
  selectSession: (sessionId: string) => void;
  setTicketQuantity: (ticketTypeId: string, quantity: number) => void;
  setFlexibleTicketQuote: (quote: PublicFlexibleTicketQuote | null) => void;
  acceptFlexibleTickets: (quantities: Record<string, number>) => void;
  declineFlexibleTickets: () => void;
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
  setBookingStatus: (status: PublicBookingStatus | null) => void;
  totalTicketQuantity: number;
}

const BookingJourneyContext = createContext<BookingJourneyState | null>(null);

export function BookingJourneyProvider({
  children,
  eventId,
}: {
  children: React.ReactNode;
  eventId: string;
}) {
  const [eventSiteResult, setEventSiteResult] = useState<{
    eventId: string;
    site: PublicEventSite | null;
  } | null>(null);
  const eventSite = eventSiteResult?.eventId === eventId
    ? eventSiteResult.site
    : null;
  const eventSiteLoaded = eventSiteResult?.eventId === eventId;
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [ticketQuantities, setTicketQuantities] = useState<Record<string, number>>({});
  const [flexibleTicketQuote, setFlexibleTicketQuote] =
    useState<PublicFlexibleTicketQuote | null>(null);
  const [flexibleTicketQuantities, setFlexibleTicketQuantities] = useState<
    Record<string, number>
  >({});
  const [flexibleTicketDecision, setFlexibleTicketDecision] = useState<
    "UNDECIDED" | "ACCEPTED" | "DECLINED"
  >("UNDECIDED");
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
  const [bookingStatus, setBookingStatus] = useState<PublicBookingStatus | null>(null);

  useEffect(() => {
    let active = true;

    void publicBookingService
      .getEvent(eventId)
      .then((event) => publicBookingService.getEventSite(event.slug))
      .then((site) => {
        if (active) setEventSiteResult({ eventId, site });
      })
      .catch(() => {
        // Booking remains available with Glacier's safe default theme.
        if (active) setEventSiteResult({ eventId, site: null });
      });

    return () => {
      active = false;
    };
  }, [eventId]);

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
      eventSite,
      eventSiteLoaded,
      selectedDateKey,
      selectedSessionId,
      ticketQuantities,
      flexibleTicketQuote,
      flexibleTicketQuantities,
      flexibleTicketDecision,
      participantData,
      rulePreview,
      selectedProducts,
      productSubtotal,
      customerData,
      reservation,
      paymentSubmitted,
      bookingStatus,
      selectDate(dateKey) {
        if (dateKey !== selectedDateKey) {
          setSelectedDateKey(dateKey);
          setSelectedSessionId(null);
          setTicketQuantities({});
          setFlexibleTicketQuote(null);
          setFlexibleTicketQuantities({});
          setFlexibleTicketDecision("UNDECIDED");
          setParticipantData({});
          setRulePreview(null);
          setSelectedProducts([]);
          setProductSubtotal(0);
          setReservation(null);
          setPaymentSubmitted(false);
          setBookingStatus(null);
        }
      },
      selectSession(sessionId) {
        if (sessionId !== selectedSessionId) {
          setSelectedSessionId(sessionId);
          setTicketQuantities({});
          setFlexibleTicketQuote(null);
          setFlexibleTicketQuantities({});
          setFlexibleTicketDecision("UNDECIDED");
          setParticipantData({});
          setRulePreview(null);
          setSelectedProducts([]);
          setProductSubtotal(0);
          setReservation(null);
          setPaymentSubmitted(false);
          setBookingStatus(null);
        }
      },
      setTicketQuantity(ticketTypeId, quantity) {
        setTicketQuantities((current) => ({
          ...current,
          [ticketTypeId]: Math.max(0, quantity),
        }));
        setRulePreview(null);
        setFlexibleTicketQuote(null);
        setFlexibleTicketQuantities({});
        setFlexibleTicketDecision("UNDECIDED");
      },
      setFlexibleTicketQuote,
      acceptFlexibleTickets(quantities) {
        setFlexibleTicketQuantities(quantities);
        setFlexibleTicketDecision("ACCEPTED");
      },
      declineFlexibleTickets() {
        setFlexibleTicketQuantities({});
        setFlexibleTicketDecision("DECLINED");
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
      setBookingStatus,
      totalTicketQuantity: Object.values(ticketQuantities).reduce(
        (total, quantity) => total + quantity,
        0,
      ),
    }),
    [
      bookingStatus,
      customerData,
      eventSite,
      eventSiteLoaded,
      flexibleTicketDecision,
      flexibleTicketQuantities,
      flexibleTicketQuote,
      participantData,
      paymentSubmitted,
      productSubtotal,
      reservation,
      rulePreview,
      selectedProducts,
      selectedDateKey,
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
