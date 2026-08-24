import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Suspense } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  selectDate: vi.fn(),
  getEvent: vi.fn(),
  getSessions: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
}));

vi.mock("@/components/booking/BookingJourneyProvider", () => ({
  useBookingJourney: () => ({
    selectedDateKey: null,
    selectDate: mocks.selectDate,
  }),
}));

vi.mock("@/components/booking/BookingJourneyShell", () => ({
  BookingJourneyShell: ({ children }: { children: React.ReactNode }) => (
    <main>{children}</main>
  ),
}));

vi.mock("@/services/public-booking.service", () => ({
  publicBookingService: {
    getEvent: mocks.getEvent,
    getSessions: mocks.getSessions,
  },
}));

import DatePage from "./page";

describe("DatePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getEvent.mockResolvedValue({
      id: "event-1",
      timezone: "Australia/Melbourne",
    });
    mocks.getSessions.mockResolvedValue([
      { id: "session-1", startDate: "2027-09-01T00:30:00.000Z" },
      { id: "session-2", startDate: "2027-09-01T03:00:00.000Z" },
      { id: "session-3", startDate: "2027-09-02T00:30:00.000Z" },
    ]);
  });

  it("groups Sessions into Event-timezone dates before Session selection", async () => {
    const user = userEvent.setup();
    const params = Promise.resolve({ eventId: "event-1" });
    await act(async () => {
      render(
        <Suspense fallback={<p>Loading route…</p>}>
          <DatePage params={params} />
        </Suspense>,
      );
      await params;
    });

    expect(await screen.findByText("2 Sessions available")).toBeVisible();
    expect(screen.getByText("1 Session available")).toBeVisible();
    expect(screen.getByText("Wednesday 1 September 2027")).toBeVisible();
    expect(screen.getByText("Thursday 2 September 2027")).toBeVisible();

    await user.click(screen.getByRole("button", { name: /Wednesday 1 September 2027/ }));
    expect(mocks.selectDate).toHaveBeenCalledWith("2027-09-01");
  });
});
