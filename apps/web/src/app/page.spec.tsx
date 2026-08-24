import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import DashboardPage from "./page";

const report = {
  generatedAt: "2027-09-01T00:00:00.000Z",
  totals: { events: 1, currentEvents: 1, upcomingEvents: 0, sessionsToday: 3, confirmedBookings: 12, ticketsIssued: 18, admissions: 7, grossCollected: 540, refunded: 40, netCollected: 500, paymentExceptions: 2 },
  events: [{ event: { id: "event-1", name: "Winter Festival", slug: "winter-festival", status: "ACTIVE", startDate: "2027-08-31T14:00:00.000Z", endDate: "2027-09-05T13:59:59.999Z", timezone: "Australia/Melbourne" }, lifecycle: "CURRENT", sessions: { total: 10, today: 3, next: null, totalCapacity: 1000, reservedAttendance: 200, utilisationPercent: 20 }, bookings: { confirmed: 12 }, tickets: { issued: 18, admissions: 7 }, commercial: { grossCollected: 540, refunded: 40, netCollected: 500 }, paymentExceptionCount: 2 }],
};

vi.mock("@/hooks/useOrganizationReport", () => ({ useOrganizationReport: () => ({ report, isLoading: false, error: "" }) }));
vi.mock("@/lib/auth", () => ({ subscribeAuthSession: () => () => undefined, getAuthRoleSnapshot: () => "OWNER", getServerAuthRoleSnapshot: () => "OWNER" }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/components/layout/PlatformShell", () => ({ PlatformShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));

describe("DashboardPage", () => {
  it("renders trusted operational totals and Event attention links", () => {
    render(<DashboardPage />);
    expect(screen.getByText("Organisation overview")).toBeVisible();
    expect(screen.getByText("$500.00")).toBeVisible();
    expect(screen.getByText("Winter Festival")).toBeVisible();
    expect(screen.getByRole("link", { name: /Winter Festival/ })).toHaveAttribute("href", "/events/event-1");
    expect(screen.getByRole("button", { name: "Create new event" })).toBeVisible();
  });
});
