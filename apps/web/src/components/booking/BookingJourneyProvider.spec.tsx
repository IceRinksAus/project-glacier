import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getEvent, getEventSite } = vi.hoisted(() => ({
  getEvent: vi.fn(),
  getEventSite: vi.fn(),
}));

vi.mock("@/services/public-booking.service", () => ({
  publicBookingService: { getEvent, getEventSite },
}));

import { BookingJourneyProvider, useBookingJourney } from "./BookingJourneyProvider";

function JourneyHarness() {
  const journey = useBookingJourney();
  return (
    <div>
      <span>Session: {journey.selectedSessionId ?? "none"}</span>
      <span>Tickets: {journey.totalTicketQuantity}</span>
      <span>Participant: {journey.participantData["adult-0"]?.firstName ?? "none"}</span>
      <span>Customer: {journey.customerData.email || "none"}</span>
      <button type="button" onClick={() => journey.selectSession("session-1")}>Select first Session</button>
      <button type="button" onClick={() => journey.selectSession("session-2")}>Select another Session</button>
      <button type="button" onClick={() => journey.setTicketQuantity("adult", 2)}>Add Tickets</button>
      <button type="button" onClick={() => journey.updateParticipant("adult-0", "firstName", "Jamie")}>Add Participant</button>
      <button type="button" onClick={() => journey.updateCustomer("email", "jamie@example.com")}>Add Customer</button>
    </div>
  );
}

describe("BookingJourneyProvider", () => {
  beforeEach(() => {
    getEvent.mockResolvedValue({ id: "event-1", slug: "winter-festival" });
    getEventSite.mockResolvedValue({
      id: "event-1",
      name: "Winter Festival",
      slug: "winter-festival",
      branding: null,
    });
  });

  it("preserves selections between steps and clears incompatible Tickets when the Session changes", async () => {
    const user = userEvent.setup();
    render(
      <BookingJourneyProvider eventId="event-1">
        <JourneyHarness />
      </BookingJourneyProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Select first Session" }));
    await user.click(screen.getByRole("button", { name: "Add Tickets" }));
    await user.click(screen.getByRole("button", { name: "Add Participant" }));
    await user.click(screen.getByRole("button", { name: "Add Customer" }));
    expect(screen.getByText("Session: session-1")).toBeInTheDocument();
    expect(screen.getByText("Tickets: 2")).toBeInTheDocument();
    expect(screen.getByText("Participant: Jamie")).toBeInTheDocument();
    expect(screen.getByText("Customer: jamie@example.com")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Select another Session" }));
    expect(screen.getByText("Session: session-2")).toBeInTheDocument();
    expect(screen.getByText("Tickets: 0")).toBeInTheDocument();
    expect(screen.getByText("Participant: none")).toBeInTheDocument();
    expect(screen.getByText("Customer: jamie@example.com")).toBeInTheDocument();
  });
});
