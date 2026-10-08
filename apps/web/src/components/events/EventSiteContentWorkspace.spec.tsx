import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { EventSiteContentWorkspace } from "./EventSiteContentWorkspace";

const { getSiteContent, saveSiteContentDraft, publishSiteContent } = vi.hoisted(
  () => ({
    getSiteContent: vi.fn(),
    saveSiteContentDraft: vi.fn(),
    publishSiteContent: vi.fn(),
  }),
);

vi.mock("@/services/event.service", () => ({
  eventService: {
    getSiteContent,
    saveSiteContentDraft,
    publishSiteContent,
  },
}));

describe("EventSiteContentWorkspace", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSiteContent.mockResolvedValue({ draft: null, published: null });
    saveSiteContentDraft.mockResolvedValue({ version: 1 });
    publishSiteContent.mockResolvedValue({ version: 1 });
  });

  it("saves structured content as a private draft before publication", async () => {
    const user = userEvent.setup();
    render(
      <EventSiteContentWorkspace
        eventId="event-1"
        eventName="Fictional Winter Festival"
        canEdit
      />,
    );

    await user.type(
      await screen.findByLabelText("About description"),
      "A fictional family skating Event.",
    );
    await user.click(screen.getByRole("button", { name: "Add highlight" }));
    await user.type(screen.getByLabelText("Highlight 1 title"), "Ice skating");
    await user.type(
      screen.getByLabelText("Highlight 1 description"),
      "Sessions for all ages.",
    );
    await user.click(screen.getByRole("button", { name: "Save draft" }));

    await waitFor(() => expect(saveSiteContentDraft).toHaveBeenCalledTimes(1));
    expect(saveSiteContentDraft).toHaveBeenCalledWith(
      "event-1",
      expect.objectContaining({
        aboutBody: "A fictional family skating Event.",
        highlights: [
          { title: "Ice skating", description: "Sessions for all ages." },
        ],
      }),
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "live website has not changed",
    );
  });

  it("requires a saved non-empty draft before publishing", async () => {
    render(
      <EventSiteContentWorkspace
        eventId="event-1"
        eventName="Fictional Winter Festival"
        canEdit
      />,
    );

    expect(
      await screen.findByRole("button", { name: "Publish homepage" }),
    ).toBeDisabled();
  });

  it("publishes a previously saved draft deliberately", async () => {
    const user = userEvent.setup();
    getSiteContent.mockResolvedValue({
      draft: {
        id: "draft-2",
        version: 2,
        status: "DRAFT",
        publishedAt: null,
        aboutTitle: "About",
        aboutBody: "Fictional public content.",
        arrivalInfo: "",
        transportParkingInfo: "",
        accessibilityInfo: "",
        foodDrinkInfo: "",
        whatToBringInfo: "",
        highlights: [],
        faqs: [],
      },
      published: null,
    });
    publishSiteContent.mockResolvedValue({ version: 2 });

    render(
      <EventSiteContentWorkspace
        eventId="event-1"
        eventName="Fictional Winter Festival"
        canEdit
      />,
    );

    await user.click(
      await screen.findByRole("button", { name: "Publish homepage" }),
    );

    await waitFor(() => expect(publishSiteContent).toHaveBeenCalledWith("event-1"));
    expect(screen.getByRole("status")).toHaveTextContent(
      "Homepage version 2 is now live",
    );
  });

  it("adds a common FAQ question but requires an Event-specific answer", async () => {
    const user = userEvent.setup();
    render(
      <EventSiteContentWorkspace
        eventId="event-1"
        eventName="Fictional Winter Festival"
        canEdit
      />,
    );

    await user.click(
      await screen.findByRole("button", {
        name: "Add · How early should I arrive?",
      }),
    );

    expect(screen.getByLabelText("FAQ 1 question")).toHaveValue(
      "How early should I arrive?",
    );
    expect(screen.getByLabelText("FAQ 1 answer")).toHaveValue("");
    expect(
      screen.getByRole("button", {
        name: "Added · How early should I arrive?",
      }),
    ).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Save draft" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "every FAQ question and answer",
    );
    expect(saveSiteContentDraft).not.toHaveBeenCalled();
  });

  it("keeps the content studio read-only when Website mutation is unavailable", async () => {
    render(
      <EventSiteContentWorkspace
        eventId="event-1"
        eventName="Fictional Winter Festival"
        canEdit={false}
      />,
    );

    expect(await screen.findByText(/content is read-only/)).toBeVisible();
    expect(screen.getByLabelText("About description")).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Save draft" })).toBeNull();
  });
});
