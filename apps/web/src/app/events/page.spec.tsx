import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import EventsPage from "./page";

const report = {
  generatedAt: "2027-09-01T00:00:00.000Z",
  totals: {},
  events: [
    { event: { id: "event-1", name: "Winter Festival", slug: "winter-festival", status: "ACTIVE", startDate: "2027-08-31T14:00:00.000Z", endDate: "2027-09-05T13:59:59.999Z", timezone: "Australia/Melbourne" }, lifecycle: "CURRENT", sessions: { total: 10, today: 3, next: { id: "session-1", name: "Morning skate", startDate: "2027-09-01T00:30:00.000Z" }, totalCapacity: 1000, reservedAttendance: 200, utilisationPercent: 20 }, bookings: { confirmed: 12 }, tickets: { issued: 18, admissions: 7 }, commercial: { grossCollected: 540, refunded: 40, netCollected: 500 }, paymentExceptionCount: 2 },
    { event: { id: "event-2", name: "Spring Fair", slug: "spring-fair", status: "DRAFT", startDate: "2027-10-01T00:00:00.000Z", endDate: "2027-10-02T00:00:00.000Z", timezone: "Australia/Melbourne" }, lifecycle: "UPCOMING", sessions: { total: 2, today: 0, next: null, totalCapacity: 200, reservedAttendance: 0, utilisationPercent: 0 }, bookings: { confirmed: 0 }, tickets: { issued: 0, admissions: 0 }, commercial: { grossCollected: 0, refunded: 0, netCollected: 0 }, paymentExceptionCount: 0 },
  ],
};

vi.mock("@/hooks/useOrganizationReport", () => ({ useOrganizationReport: () => ({ report, isLoading: false, error: "" }) }));
vi.mock("@/lib/auth", () => ({ subscribeAuthSession: () => () => undefined, getAuthRoleSnapshot: () => "OWNER", getServerAuthRoleSnapshot: () => "OWNER" }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/components/layout/PlatformShell", () => ({ PlatformShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));

describe("EventsPage", () => {
  it("shows Event lifecycle, operational metrics and exceptions", () => {
    render(<EventsPage />);
    expect(screen.getByRole("link", { name: /Winter Festival/ })).toHaveAttribute("href", "/events/event-1");
    expect(screen.getByText("CURRENT")).toBeVisible();
    expect(screen.getByText("20%")).toBeVisible();
    expect(screen.getByText("2 payment exceptions requiring attention")).toBeVisible();
  });

  it("defaults to current events and supports lifecycle and name filters", () => {
    render(<EventsPage />);
    expect(screen.getByText("Winter Festival")).toBeVisible();
    expect(screen.queryByText("Spring Fair")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Upcoming/ }));
    expect(screen.getByText("Spring Fair")).toBeVisible();
    expect(screen.queryByText("Winter Festival")).not.toBeInTheDocument();

    fireEvent.change(screen.getByRole("searchbox", { name: "Search events" }), {
      target: { value: "missing" },
    });
    expect(screen.getByText(/No upcoming events match/)).toBeVisible();
  });
});
