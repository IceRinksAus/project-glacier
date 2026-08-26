import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Suspense } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  getTicketTypes: vi.fn(),
  quoteFlexibleTicket: vi.fn(),
  evaluateRules: vi.fn(),
  getEvent: vi.fn(),
  getSessions: vi.fn(),
  createCustomer: vi.fn(),
  createBooking: vi.fn(),
  getBookingStatus: vi.fn(),
  setRulePreview: vi.fn(),
  setBookingStatus: vi.fn(),
}));

let journey: Record<string, unknown>;

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, replace: mocks.replace }),
}));

vi.mock("@/components/booking/BookingJourneyProvider", () => ({
  useBookingJourney: () => journey,
}));

vi.mock("@/components/booking/BookingJourneyShell", () => ({
  BookingJourneyShell: ({ children }: { children: React.ReactNode }) => (
    <main>{children}</main>
  ),
}));

vi.mock("@/components/booking/PaymentStep", () => ({
  PaymentStep: () => <div>Payment form</div>,
}));

vi.mock("@/components/booking/ReservationCountdown", () => ({
  ReservationCountdown: () => <div>Reservation countdown</div>,
}));

vi.mock("@/services/public-booking.service", () => ({
  publicBookingService: {
    getTicketTypes: mocks.getTicketTypes,
    quoteFlexibleTicket: mocks.quoteFlexibleTicket,
    evaluateRules: mocks.evaluateRules,
    getEvent: mocks.getEvent,
    getSessions: mocks.getSessions,
    createCustomer: mocks.createCustomer,
    createBooking: mocks.createBooking,
    getBookingStatus: mocks.getBookingStatus,
  },
}));

import ParticipantsPage from "./participants/page";
import PaymentPage from "./payment/page";
import ReviewPage from "./review/page";
import TicketsPage from "./tickets/page";

const params = Promise.resolve({ eventId: "event-1" });

async function renderRoute(page: React.ReactNode) {
  await act(async () => {
    render(<Suspense fallback={<p>Loading route…</p>}>{page}</Suspense>);
    await params;
  });
}

describe("routed public booking pages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    journey = {
      selectedDateKey: null,
      selectedSessionId: null,
      ticketQuantities: {},
      flexibleTicketQuote: null,
      flexibleTicketQuantities: {},
      flexibleTicketDecision: "UNDECIDED",
      participantData: {},
      rulePreview: null,
      selectedProducts: [],
      productSubtotal: 0,
      customerData: { firstName: "", lastName: "", email: "", phone: "" },
      reservation: null,
      paymentSubmitted: false,
      totalTicketQuantity: 0,
      setTicketQuantity: vi.fn(),
      setFlexibleTicketQuote: vi.fn(),
      acceptFlexibleTickets: vi.fn(),
      declineFlexibleTickets: vi.fn(),
      updateParticipant: vi.fn(),
      setRulePreview: mocks.setRulePreview,
      setReservation: vi.fn(),
      setPaymentSubmitted: vi.fn(),
      setBookingStatus: mocks.setBookingStatus,
    };
  });

  it("returns direct Ticket navigation to Date when its prerequisites are absent", async () => {
    await renderRoute(<TicketsPage params={params} />);

    expect(mocks.replace).toHaveBeenCalledWith("/book/event-1/date");
    expect(mocks.getTicketTypes).not.toHaveBeenCalled();
  });

  it("keeps the customer on Participants when authoritative Rules reject the party", async () => {
    const user = userEvent.setup();
    Object.assign(journey, {
      selectedDateKey: "2027-07-01",
      selectedSessionId: "session-1",
      ticketQuantities: { adult: 1 },
      participantData: {
        "adult-0": { firstName: "Alex", lastName: "", age: "12" },
      },
      totalTicketQuantity: 1,
    });
    mocks.getTicketTypes.mockResolvedValue([
      { id: "adult", name: "Adult", price: 24 },
    ]);
    mocks.evaluateRules.mockResolvedValue({
      valid: false,
      matchedRuleIds: ["adult-age-rule"],
      requiredProducts: [],
      errors: ["Adult Tickets require an adult participant."],
      warnings: [],
    });

    await renderRoute(<ParticipantsPage params={params} />);
    await user.click(await screen.findByRole("button", { name: /Continue to Add-ons/ }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Adult Tickets require an adult participant.",
    );
    expect(mocks.setRulePreview).toHaveBeenCalledWith(
      expect.objectContaining({ valid: false }),
    );
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it("offers Flexible Ticket immediately after Tickets are selected", async () => {
    const user = userEvent.setup();
    Object.assign(journey, {
      selectedDateKey: "2027-07-01",
      selectedSessionId: "session-1",
      ticketQuantities: { adult: 2 },
      totalTicketQuantity: 2,
      flexibleTicketQuote: {
        available: true,
        policyId: "policy-1",
        customerSummary: "$4.00 per covered Ticket",
        materialTerms: "Requests must be made before the stated cut-off.",
        allowsSessionChange: true,
        allowsRefundRequest: true,
        tickets: [
          {
            ticketTypeId: "adult",
            ticketTypeName: "Adult",
            quantity: 2,
            feePerTicket: 4,
          },
        ],
        totalFee: 8,
      },
    });
    mocks.getTicketTypes.mockResolvedValue([
      { id: "adult", name: "Adult", price: 24 },
    ]);
    mocks.quoteFlexibleTicket.mockResolvedValue({
      available: true,
      policyId: "policy-1",
      customerSummary: "$4.00 per covered Ticket",
      materialTerms: "Requests must be made before the stated cut-off.",
      allowsSessionChange: true,
      allowsRefundRequest: true,
      tickets: [
        {
          ticketTypeId: "adult",
          ticketTypeName: "Adult",
          quantity: 2,
          feePerTicket: 4,
        },
      ],
      totalFee: 8,
    });

    await renderRoute(<TicketsPage params={params} />);
    await user.click(await screen.findByRole("button", { name: /Continue/ }));

    expect(await screen.findByRole("dialog", { name: "Want peace of mind?" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Add to all Tickets — $8.00" })).toBeVisible();
    expect(mocks.push).not.toHaveBeenCalledWith("/book/event-1/participants");
  });

  it("shows the authoritative reservation failure instead of advancing to Payment", async () => {
    const user = userEvent.setup();
    Object.assign(journey, {
      selectedDateKey: "2027-07-01",
      selectedSessionId: "session-1",
      ticketQuantities: { adult: 1 },
      participantData: {
        "adult-0": { firstName: "Jamie", lastName: "Stoller", age: "35" },
      },
      rulePreview: { valid: true, requiredProducts: [] },
      customerData: {
        firstName: "Jamie",
        lastName: "Stoller",
        email: "jamie@example.com",
        phone: "",
      },
      totalTicketQuantity: 1,
    });
    mocks.getEvent.mockResolvedValue({ id: "event-1", name: "Winter Festival" });
    mocks.getSessions.mockResolvedValue([
      { id: "session-1", name: "10am", startDate: "2027-07-01T00:00:00.000Z" },
    ]);
    mocks.getTicketTypes.mockResolvedValue([
      { id: "adult", name: "Adult", price: 24 },
    ]);
    mocks.createCustomer.mockResolvedValue({ id: "customer-1" });
    mocks.createBooking.mockRejectedValue(new Error("This Session has sold out."));

    await renderRoute(<ReviewPage params={params} />);
    await user.click(await screen.findByRole("button", { name: "Reserve tickets" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "This Session has sold out.",
    );
    expect(mocks.push).not.toHaveBeenCalledWith("/book/event-1/payment");
  });

  it("describes submitted payment as pending until webhook-confirmed status is returned", async () => {
    Object.assign(journey, {
      reservation: {
        booking: {
          id: "booking-1",
          bookingNumber: "PG-1001",
          publicAccessToken: "a".repeat(64),
          reservedUntil: "2027-07-01T00:15:00.000Z",
        },
      },
      paymentSubmitted: true,
    });
    mocks.getBookingStatus.mockResolvedValue({
      status: "PENDING",
      paymentStatus: "PENDING",
      tickets: [],
    });

    await renderRoute(<PaymentPage params={params} />);

    expect(screen.getByRole("heading", { name: "Payment submitted" })).toBeVisible();
    expect(screen.getByText(/only be marked paid and tickets issued after Glacier receives/)).toBeVisible();
    await act(async () => {
      await Promise.resolve();
    });
    expect(mocks.getBookingStatus).toHaveBeenCalledWith("booking-1", "a".repeat(64));
    expect(mocks.replace).not.toHaveBeenCalledWith("/book/event-1/confirmation");
  });
});
