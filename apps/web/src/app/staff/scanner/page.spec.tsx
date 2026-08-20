import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import StaffScannerPage from "./page";

const { apiGet, apiPost, routerPush } = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  routerPush: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPush }),
}));

vi.mock("@/lib/api", () => ({
  api: { get: apiGet, post: apiPost },
}));

vi.mock("@/components/scanner/ScannerCamera", () => ({
  ScannerCamera: () => <div data-testid="scanner-camera" />,
}));

const token = "a".repeat(64);
const scannerEvent = {
  id: "event-1",
  name: "Ice Event",
  venueName: "Ice Arena",
  timezone: "Australia/Melbourne",
  entryOpensMinutesBeforeStart: 30,
  entryClosesMinutesAfterEnd: 0,
};
const ticketDetails = {
  ticketNumber: "TKT-1",
  ticketType: "Admission",
  participantName: "Alex Example",
  eventName: "Ice Event",
  sessionName: "10am Session",
  sessionStart: "2027-09-01T00:00:00.000Z",
  sessionEnd: "2027-09-01T01:00:00.000Z",
  entryOpensAt: "2027-08-31T23:30:00.000Z",
  entryClosesAt: "2027-09-01T01:00:00.000Z",
  issuedAt: "2027-08-20T00:00:00.000Z",
  status: "ACTIVE",
  checkedInAt: null,
};

async function renderScanner() {
  render(<StaffScannerPage />);
  await screen.findByRole("option", { name: "Ice Event" });
}

async function submitToken(user: ReturnType<typeof userEvent.setup>) {
  const input = screen.getByRole("textbox", {
    name: "Manual or hardware scanner entry",
  });
  await user.type(input, `${token}{Enter}`);
}

describe("StaffScannerPage", () => {
  beforeEach(() => {
    localStorage.clear();
    apiGet.mockResolvedValue([scannerEvent]);
    apiPost.mockReset();
  });

  it("automatically admits a Gate Entry scan without a second action", async () => {
    const user = userEvent.setup();
    apiPost.mockResolvedValue({
      ...ticketDetails,
      result: "ENTRY_GRANTED",
      status: "SCANNED",
      checkedInAt: "2027-09-01T00:01:00.000Z",
    });
    await renderScanner();

    await submitToken(user);

    expect(apiPost).toHaveBeenCalledWith(
      "/staff/scanner/events/event-1/admit",
      { token, mode: "GATE_ENTRY" },
    );
    expect(
      await screen.findByRole("heading", { name: "Entry granted" }),
    ).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Grant entry" }),
    ).not.toBeInTheDocument();
  });

  it("keeps Ticket Lookup read-only until Process ticket is confirmed", async () => {
    const user = userEvent.setup();
    apiPost
      .mockResolvedValueOnce({ ...ticketDetails, result: "READY_TO_ADMIT" })
      .mockResolvedValueOnce({
        ...ticketDetails,
        result: "ENTRY_GRANTED",
        status: "SCANNED",
        checkedInAt: "2027-09-01T00:01:00.000Z",
      });
    await renderScanner();

    await user.click(screen.getByRole("button", { name: /Ticket Lookup/ }));
    await submitToken(user);

    expect(apiPost).toHaveBeenCalledTimes(1);
    expect(apiPost).toHaveBeenLastCalledWith(
      "/staff/scanner/events/event-1/validate",
      { token, mode: "TICKET_LOOKUP" },
    );
    await user.click(
      await screen.findByRole("button", { name: "Process ticket" }),
    );
    expect(apiPost).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Confirm entry for Alex Example?")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Confirm entry" }));

    await waitFor(() => expect(apiPost).toHaveBeenCalledTimes(2));
    expect(apiPost).toHaveBeenLastCalledWith(
      "/staff/scanner/events/event-1/admit",
      { token, mode: "TICKET_LOOKUP" },
    );
  });

  it("closes a Lookup result without admitting the Ticket", async () => {
    const user = userEvent.setup();
    apiPost.mockResolvedValue({ ...ticketDetails, result: "READY_TO_ADMIT" });
    await renderScanner();
    await user.click(screen.getByRole("button", { name: /Ticket Lookup/ }));
    await submitToken(user);

    await user.click(
      await screen.findByRole("button", { name: "Close without processing" }),
    );

    expect(apiPost).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole("heading", { name: "Ready to scan" }),
    ).toBeVisible();
  });

  it.each([
    ["NOT_YET_VALID", "Too early"],
    ["ENTRY_WINDOW_CLOSED", "Entry window closed"],
    ["ALREADY_SCANNED", "Already scanned"],
    ["INVALID_FOR_EVENT", "Invalid for this Event"],
    ["INVALID", "Ticket not recognised"],
  ])("renders %s as a fail-closed result", async (result, heading) => {
    const user = userEvent.setup();
    apiPost.mockResolvedValue({ ...ticketDetails, result });
    await renderScanner();

    await submitToken(user);

    expect(await screen.findByRole("heading", { name: heading })).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Process ticket" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Confirm entry" }),
    ).not.toBeInTheDocument();
  });

  it("rejects malformed credentials without contacting the API", async () => {
    const user = userEvent.setup();
    await renderScanner();
    const input = screen.getByRole("textbox", {
      name: "Manual or hardware scanner entry",
    });

    await user.type(input, "not-a-ticket{Enter}");

    expect(apiPost).not.toHaveBeenCalled();
    expect(
      screen.getByText("Enter or scan a valid Glacier Ticket code."),
    ).toBeVisible();
  });

  it("fails closed when admission cannot reach the server", async () => {
    const user = userEvent.setup();
    apiPost.mockRejectedValue(new Error("Unable to reach the Glacier API."));
    await renderScanner();

    await submitToken(user);

    expect(
      await screen.findByText("Unable to reach the Glacier API."),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "Ready to scan" }),
    ).toBeVisible();
    expect(screen.queryByText("Entry granted")).not.toBeInTheDocument();
  });
});
