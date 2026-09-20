import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { WaiverWorkspace } from "./WaiverWorkspace";

const {
  findForEvent,
  getPreparation,
  listSubmissions,
  generatePublicQrCode,
  createDraft,
} = vi.hoisted(() => ({
  findForEvent: vi.fn(),
  getPreparation: vi.fn(),
  listSubmissions: vi.fn(),
  generatePublicQrCode: vi.fn(),
  createDraft: vi.fn(),
}));

vi.mock("@/services/waiver.service", () => ({
  waiverService: {
    findForEvent,
    getPreparation,
    listSubmissions,
    generatePublicQrCode,
    createDraft,
  },
}));

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((next) => {
    resolve = next;
  });
  return { promise, resolve };
}

function version(eventId: string, number = 1) {
  return {
    id: `${eventId}-version-${number}`,
    version: number,
    title: `${eventId} Waiver`,
    content: `Controlled wording for ${eventId}`,
    acceptanceStatement: `Acceptance for ${eventId}`,
    contentHash: "hash",
    status: "DRAFT" as const,
    publishedAt: null,
    createdAt: "2026-09-20T00:00:00.000Z",
    sourceTemplate: {
      id: "template-1",
      name: "VIC Ice Skating",
      revision: 1,
      jurisdiction: "VIC",
      activityType: "ICE_SKATING",
    },
    publishedByUser: null,
  };
}

function waiver(eventId: string, number = 1) {
  return {
    id: `${eventId}-waiver`,
    eventId,
    publicSlug: `${eventId}-public`,
    createdAt: "2026-09-20T00:00:00.000Z",
    updatedAt: "2026-09-20T00:00:00.000Z",
    versions: [version(eventId, number)],
  };
}

function preparation(eventId: string) {
  return {
    event: {
      id: eventId,
      name: eventId,
      status: "DRAFT",
      activityType: "ICE_SKATING",
      jurisdiction: "VIC",
    },
    template: {
      id: "template-1",
      name: "VIC Ice Skating",
      revision: 1,
      jurisdiction: "VIC",
      activityType: "ICE_SKATING",
      authority: "PLATFORM",
      approvalReference: "Test approval",
    },
    fields: {
      promoter: `${eventId} promoter`,
      eventLocation: `${eventId} location`,
      siteAddress: `${eventId} address`,
      eventStartDate: "2026-10-02",
      eventEndDate: "2026-10-05",
      additionalInformation: "",
    },
    missingFields: [],
    ready: true,
  };
}

describe("WaiverWorkspace", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listSubmissions.mockResolvedValue([]);
    generatePublicQrCode.mockResolvedValue(null);
  });

  it("does not show a previous Event version while a new Event loads", async () => {
    const eventTwoWaiver = deferred<ReturnType<typeof waiver>>();
    const eventTwoPreparation = deferred<ReturnType<typeof preparation>>();

    findForEvent.mockImplementation((eventId: string) =>
      eventId === "event-1"
        ? Promise.resolve(waiver(eventId))
        : eventTwoWaiver.promise,
    );
    getPreparation.mockImplementation((eventId: string) =>
      eventId === "event-1"
        ? Promise.resolve(preparation(eventId))
        : eventTwoPreparation.promise,
    );

    const { rerender } = render(
      <WaiverWorkspace
        eventId="event-1"
        activityType="ICE_SKATING"
        jurisdiction="VIC"
      />,
    );
    expect(await screen.findByText("event-1 Waiver")).toBeVisible();

    rerender(
      <WaiverWorkspace
        eventId="event-2"
        activityType="ICE_SKATING"
        jurisdiction="VIC"
      />,
    );

    await waitFor(() =>
      expect(screen.getByText("Loading Waiver workspace…")).toBeVisible(),
    );
    expect(screen.queryByText("event-1 Waiver")).not.toBeInTheDocument();

    await act(async () => {
      eventTwoWaiver.resolve(waiver("event-2"));
      eventTwoPreparation.resolve(preparation("event-2"));
    });
    expect(await screen.findByText("event-2 Waiver")).toBeVisible();
  });

  it("marks field edits as unapplied and selects the newly generated version", async () => {
    const user = userEvent.setup();
    const initialWaiver = waiver("event-1");
    const updatedWaiver = {
      ...initialWaiver,
      versions: [
        {
          ...version("event-1", 2),
          content: "Controlled wording for the updated location",
        },
        ...initialWaiver.versions,
      ],
    };
    findForEvent
      .mockResolvedValueOnce(initialWaiver)
      .mockResolvedValueOnce(updatedWaiver);
    getPreparation
      .mockResolvedValueOnce(preparation("event-1"))
      .mockResolvedValueOnce({
        ...preparation("event-1"),
        fields: {
          ...preparation("event-1").fields,
          eventLocation: "Updated location",
        },
      });
    createDraft.mockResolvedValue(updatedWaiver.versions[0]);

    render(
      <WaiverWorkspace
        eventId="event-1"
        activityType="ICE_SKATING"
        jurisdiction="VIC"
      />,
    );

    const location = await screen.findByRole("textbox", {
      name: "Event location",
    });
    await user.clear(location);
    await user.type(location, "Updated location");
    expect(
      screen.getByText(/These edits are not in the preview yet/),
    ).toBeVisible();

    await user.click(
      screen.getByRole("button", { name: "Generate updated preview" }),
    );

    expect(
      await screen.findByText("Controlled wording for the updated location"),
    ).toBeVisible();
    expect(screen.getByText("Version 2 preview")).toBeVisible();
    expect(createDraft).toHaveBeenCalledWith(
      "event-1",
      expect.objectContaining({ eventLocation: "Updated location" }),
    );
  });
});
