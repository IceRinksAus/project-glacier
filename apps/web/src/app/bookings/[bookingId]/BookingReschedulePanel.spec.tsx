import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { BookingReschedulePanel } from "./BookingReschedulePanel";

const { context, preview, execute } = vi.hoisted(() => ({
  context: vi.fn(),
  preview: vi.fn(),
  execute: vi.fn(),
}));

vi.mock("@/services/booking-reschedule.service", () => ({
  bookingRescheduleService: { context, preview, execute },
}));

const originalSession = {
  id: "session-10",
  name: "10:00 Session",
  startDate: "2026-08-30T00:00:00.000Z",
  endDate: "2026-08-30T01:00:00.000Z",
};

const destinationSession = {
  id: "session-11",
  name: "11:00 Session",
  startDate: "2026-08-30T01:00:00.000Z",
  endDate: "2026-08-30T02:00:00.000Z",
};

const contextResponse = {
  bookingId: "booking-1",
  bookingNumber: "PG-1234",
  eligible: true,
  eligibilityReasons: [],
  currentSession: originalSession,
  ticketCount: 2,
  total: 74,
  products: [],
  destinations: [
    {
      ...destinationSession,
      capacity: 150,
      remainingAdmissionBeforeMove: 20,
      remainingAdmissionAfterMove: 18,
      productEffects: [],
    },
  ],
  history: [],
};

describe("BookingReschedulePanel", () => {
  beforeEach(() => {
    context.mockReset();
    preview.mockReset();
    execute.mockReset();
    context.mockResolvedValue(contextResponse);
  });

  it("requires a reviewed whole-Booking impact before execution", async () => {
    const user = userEvent.setup();
    preview.mockResolvedValue({
      previewHash: "preview-hash",
      bookingId: "booking-1",
      bookingNumber: "PG-1234",
      reason: "CUSTOMER_REQUEST",
      note: "Customer needs a later time",
      originalSession,
      destinationSession,
      ticketCount: 2,
      admissionPlacesTransferred: 2,
      tickets: [],
      productEffects: [],
      totalUnchanged: 74,
      priceDifference: 0,
      finiteInventoryUnchanged: true,
    });

    render(<BookingReschedulePanel bookingId="booking-1" />);

    await screen.findByRole("heading", { name: "Change Session" });
    await user.type(
      screen.getByRole("textbox", { name: "Session-change explanation" }),
      "Customer needs a later time",
    );
    await user.click(
      screen.getByRole("button", { name: "Review Session change" }),
    );

    expect(
      await screen.findByRole("heading", {
        name: "Confirm high-impact action",
      }),
    ).toBeVisible();
    expect(
      screen.getByText(/Every original Ticket will become unusable/),
    ).toBeVisible();
    expect(screen.getByText(/No Payment or refund will occur/)).toBeVisible();
    expect(execute).not.toHaveBeenCalled();
  });

  it("executes the reviewed change and reloads the immutable history", async () => {
    const user = userEvent.setup();
    const onCompleted = vi.fn();
    preview.mockResolvedValue({
      previewHash: "preview-hash",
      bookingId: "booking-1",
      bookingNumber: "PG-1234",
      reason: "CUSTOMER_REQUEST",
      note: "Customer needs a later time",
      originalSession,
      destinationSession,
      ticketCount: 2,
      admissionPlacesTransferred: 2,
      tickets: [],
      productEffects: [],
      totalUnchanged: 74,
      priceDifference: 0,
      finiteInventoryUnchanged: true,
    });
    execute.mockResolvedValue({
      id: "reschedule-1",
      rescheduleNumber: "RS-1234",
      status: "COMPLETED",
      reason: "CUSTOMER_REQUEST",
      note: "Customer needs a later time",
      ticketCount: 2,
      admissionPlacesTransferred: 2,
      createdAt: "2026-08-26T00:00:00.000Z",
      completedAt: "2026-08-26T00:00:00.000Z",
      originalSession,
      destinationSession,
      requestedByUser: { id: "user-1", name: "Jamie" },
      ticketMappings: [],
      productAllocations: [],
    });

    render(
      <BookingReschedulePanel
        bookingId="booking-1"
        onCompleted={onCompleted}
      />,
    );

    await user.type(
      await screen.findByRole("textbox", {
        name: "Session-change explanation",
      }),
      "Customer needs a later time",
    );
    await user.click(
      screen.getByRole("button", { name: "Review Session change" }),
    );
    await user.click(
      await screen.findByRole("button", { name: "Confirm Session change" }),
    );

    await waitFor(() => expect(execute).toHaveBeenCalledTimes(1));
    expect(execute.mock.calls[0][0]).toBe("booking-1");
    expect(execute.mock.calls[0][1]).toMatchObject({
      destinationSessionId: "session-11",
      previewHash: "preview-hash",
      reason: "CUSTOMER_REQUEST",
    });
    expect(execute.mock.calls[0][1].idempotencyKey).toEqual(expect.any(String));
    expect(await screen.findByText(/RS-1234 moved 2 Ticket/)).toBeVisible();
    expect(context).toHaveBeenCalledTimes(2);
    expect(onCompleted).toHaveBeenCalledTimes(1);
  });
});
