import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { EventDetailsEditor } from "./EventDetailsEditor";

const { updateDetails } = vi.hoisted(() => ({ updateDetails: vi.fn() }));
vi.mock("@/services/event.service", async () => {
  const actual = await vi.importActual<typeof import("@/services/event.service")>("@/services/event.service");
  return { ...actual, eventService: { ...actual.eventService, updateDetails } };
});

const event = {
  id: "event-1", name: "Winter Festival", slug: "winter-festival",
  description: "Fictional Event", startDate: "2027-08-31T14:00:00.000Z",
  endDate: "2027-09-05T08:00:00.000Z", timezone: "Australia/Melbourne",
  venueName: "Preview Arena", addressLine1: "1 Example Street", addressLine2: null,
  suburb: "Melbourne", postcode: "3000", country: "AU", status: "DRAFT",
  activityType: "ICE_SKATING", jurisdiction: "VIC", entryOpensMinutesBeforeStart: 30,
  entryClosesMinutesAfterEnd: 0, organizationId: "org-1",
  createdAt: "2027-01-01T00:00:00.000Z", updatedAt: "2027-01-01T00:00:00.000Z",
  branding: null,
};

describe("EventDetailsEditor", () => {
  it("saves edited Event identity through the server authority", async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();
    updateDetails.mockResolvedValue({});
    render(<EventDetailsEditor event={event} onCancel={vi.fn()} onSaved={onSaved} />);

    const name = screen.getByLabelText("Event name");
    await user.clear(name);
    await user.type(name, "Updated Festival");
    await user.click(screen.getByRole("button", { name: "Save Event details" }));

    expect(updateDetails).toHaveBeenCalledWith(
      "event-1",
      expect.objectContaining({ name: "Updated Festival", jurisdiction: "VIC" }),
    );
    expect(onSaved).toHaveBeenCalled();
  });

  it("explains required venue details before submitting", async () => {
    const user = userEvent.setup();
    render(<EventDetailsEditor event={{ ...event, venueName: null }} onCancel={vi.fn()} onSaved={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Save Event details" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Complete the Event name, venue and address fields.");
  });
});
