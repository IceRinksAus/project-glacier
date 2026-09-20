import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ScheduleReviewStep } from "./ScheduleReviewStep";

const entry = {
  id: "entry-1",
  name: "Public Skate",
  startTime: "10:00",
  duration: 120,
  capacity: 100,
  type: "BOOKABLE" as const,
};

describe("ScheduleReviewStep", () => {
  it("offers an explicit draft or active Session outcome", () => {
    const onActivateSessionsChange = vi.fn();
    render(
      <ScheduleReviewStep
        scheduleName="Daily Public Skating"
        pattern="DAILY"
        startDate="2026-10-03"
        endDate="2026-10-05"
        entries={[entry]}
        isGenerating={false}
        generateError=""
        activateSessions={false}
        onActivateSessionsChange={onActivateSessionsChange}
        onBack={vi.fn()}
        onCancel={vi.fn()}
        onGenerate={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Generate Schedule as draft" }),
    ).toBeEnabled();

    fireEvent.click(
      screen.getByRole("checkbox", { name: /Create Sessions as active/i }),
    );
    expect(onActivateSessionsChange).toHaveBeenCalledWith(true);
  });

  it("makes the active outcome clear in the primary action", () => {
    render(
      <ScheduleReviewStep
        scheduleName="Daily Public Skating"
        pattern="DAILY"
        startDate="2026-10-03"
        endDate="2026-10-05"
        entries={[entry]}
        isGenerating={false}
        generateError=""
        activateSessions
        onActivateSessionsChange={vi.fn()}
        onBack={vi.fn()}
        onCancel={vi.fn()}
        onGenerate={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", {
        name: "Generate and activate Sessions",
      }),
    ).toBeEnabled();
  });
});
