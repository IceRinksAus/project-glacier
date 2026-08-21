import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import NewEventPage from "./page";

const { createEvent, routerPush } = vi.hoisted(() => ({
  createEvent: vi.fn(),
  routerPush: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPush, replace: vi.fn() }),
}));

vi.mock("@/services/event.service", () => ({
  eventService: { createEvent },
}));

vi.mock("@/components/layout/PlatformShell", () => ({
  PlatformShell: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

async function reachReview(user: ReturnType<typeof userEvent.setup>) {
  await user.type(
    screen.getByRole("textbox", { name: "Event name" }),
    "Pilot Ice Night",
  );
  await user.click(screen.getByRole("button", { name: /Continue/ }));

  expect(screen.getByText("Live public preview")).toBeVisible();
  await user.click(screen.getByRole("button", { name: /Continue/ }));

  await user.type(screen.getByLabelText("Starts"), "2027-09-01T10:00");
  await user.type(screen.getByLabelText("Ends"), "2027-09-01T18:00");
  await user.click(screen.getByRole("button", { name: /Continue/ }));

  await user.type(
    screen.getByRole("textbox", { name: "Venue name" }),
    "Pilot Ice Arena",
  );
  await user.type(
    screen.getByRole("textbox", { name: "Address line 1" }),
    "1 Ice Street",
  );
  await user.type(screen.getByRole("textbox", { name: "Suburb" }), "Melbourne");
  await user.type(screen.getByRole("textbox", { name: "Postcode" }), "3000");
  await user.selectOptions(
    screen.getByRole("combobox", { name: "Jurisdiction" }),
    "VIC",
  );
  await user.click(screen.getByRole("button", { name: /Continue/ }));

  await user.click(screen.getByRole("button", { name: /Continue/ }));
  await user.click(screen.getByRole("radio", { name: /No Waiver/ }));
  await user.click(screen.getByRole("button", { name: /Continue/ }));
}

describe("NewEventPage", () => {
  beforeEach(() => {
    createEvent.mockReset();
    routerPush.mockReset();
  });

  it("generates an editable safe slug and blocks incomplete basics", async () => {
    const user = userEvent.setup();
    render(<NewEventPage />);

    await user.click(screen.getByRole("button", { name: /Continue/ }));
    expect(screen.getByRole("alert")).toHaveTextContent("Enter an Event name");

    await user.type(
      screen.getByRole("textbox", { name: "Event name" }),
      "Pilot Ice Night!",
    );
    expect(
      screen.getByRole("textbox", { name: /Public Event URL/ }),
    ).toHaveValue("pilot-ice-night");
  });

  it("creates one DRAFT Event payload with timezone-correct timestamps", async () => {
    const user = userEvent.setup();
    createEvent.mockResolvedValue({ id: "event-1" });
    render(<NewEventPage />);
    await reachReview(user);

    await user.click(
      screen.getByRole("button", { name: "Create draft Event" }),
    );

    await waitFor(() => expect(createEvent).toHaveBeenCalledTimes(1));
    expect(createEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Pilot Ice Night",
        slug: "pilot-ice-night",
        startDate: "2027-09-01T00:00:00.000Z",
        endDate: "2027-09-01T08:00:00.000Z",
        timezone: "Australia/Melbourne",
        jurisdiction: "VIC",
        activityType: "ICE_SKATING",
        entryOpensMinutesBeforeStart: 30,
        entryClosesMinutesAfterEnd: 0,
        branding: expect.objectContaining({
          primaryColor: "#0F172A",
          accentColor: "#0EA5E9",
          headingFont: "INTER",
          bodyFont: "INTER",
        }),
      }),
    );
    expect(routerPush).toHaveBeenCalledWith("/events/event-1");
  });

  it("preserves the review when creation returns a slug conflict", async () => {
    const user = userEvent.setup();
    createEvent.mockRejectedValue(
      new Error("This Event URL is already in use. Choose a different slug."),
    );
    render(<NewEventPage />);
    await reachReview(user);

    await user.click(
      screen.getByRole("button", { name: "Create draft Event" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "This Event URL is already in use",
    );
    expect(screen.getByText("Pilot Ice Night · pilot-ice-night")).toBeVisible();
  });
});
