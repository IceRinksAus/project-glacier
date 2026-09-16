import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { EventOverview } from "./EventOverview";

vi.mock("@/hooks/useOrganizationReport", () => ({
  useOrganizationReport: () => ({
    isLoading: false,
    error: "",
    report: {
      events: [{
        event: { id: "event-1" },
        lifecycle: "CURRENT",
        sessions: { today: 4, utilisationPercent: 62, next: { name: "Evening session", startDate: "2027-09-01T08:00:00.000Z" } },
        bookings: { confirmed: 21 },
        tickets: { issued: 35, admissions: 12 },
        paymentExceptionCount: 1,
      }],
    },
  }),
}));

vi.mock("./EventReadinessPanel", () => ({ EventReadinessPanel: () => <aside>Readiness</aside> }));

describe("EventOverview", () => {
  it("shows authoritative operational event metrics", () => {
    render(<EventOverview eventId="event-1" name="Winter Festival" description="Snow and skating" status="ACTIVE" slug="winter-festival" startDate="2027-09-01T00:00:00.000Z" endDate="2027-09-02T00:00:00.000Z" onNavigate={vi.fn()} onActivated={vi.fn()} />);

    expect(screen.getByText("Tickets issued").nextSibling).toHaveTextContent("35");
    expect(screen.getByText("Sessions today").nextSibling).toHaveTextContent("4");
    expect(screen.getByText("Confirmed bookings").nextSibling).toHaveTextContent("21");
    expect(screen.getByText("62%")).toBeVisible();
    expect(screen.getByText(/Evening session/)).toBeVisible();
  });
});
