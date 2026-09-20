import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { PublicBookingCalendar } from "./PublicBookingCalendar";

const dates = [
  { key: "2027-08-31", label: "Tuesday 31 August 2027", sessionCount: 1 },
  { key: "2027-09-02", label: "Thursday 2 September 2027", sessionCount: 2 },
  { key: "2027-10-03", label: "Sunday 3 October 2027", sessionCount: 1 },
];

describe("PublicBookingCalendar", () => {
  it("defaults to the next bookable Event-local date and disables past dates", async () => {
    const onSelect = vi.fn();
    render(<PublicBookingCalendar dates={dates} selectedDateKey={null} onSelect={onSelect} todayKey="2027-09-01" />);

    await waitFor(() => expect(onSelect).toHaveBeenCalledWith("2027-09-02"));
    expect(screen.getByRole("button", { name: "31 August 2027, unavailable" })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Thursday 2 September 2027/ })).toHaveAttribute("aria-pressed", "true");
  });

  it("navigates months and selects only an available date", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<PublicBookingCalendar dates={dates} selectedDateKey="2027-09-02" onSelect={onSelect} todayKey="2027-09-01" />);

    await user.click(screen.getByRole("button", { name: "Next month" }));
    expect(screen.getByText("October 2027")).toBeVisible();
    await user.click(screen.getByRole("button", { name: /Sunday 3 October 2027/ }));
    expect(onSelect).toHaveBeenCalledWith("2027-10-03");
  });
});
