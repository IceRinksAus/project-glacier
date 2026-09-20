import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ScheduleTimetableStep } from "./ScheduleTimetableStep";

describe("ScheduleTimetableStep", () => {
  it("explains every incomplete field that disables review", () => {
    render(
      <ScheduleTimetableStep
        entries={[
          {
            id: "entry-1",
            name: "",
            startTime: "",
            duration: 0,
            capacity: 0,
            type: "BOOKABLE",
          },
        ]}
        setEntries={vi.fn()}
        onBack={vi.fn()}
        onCancel={vi.fn()}
        onNext={vi.fn()}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Activity 1: enter an activity name.",
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Activity 1: choose a start time.",
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Activity 1: enter a duration greater than zero.",
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Activity 1: enter a capacity greater than zero.",
    );
    expect(
      screen.getByRole("button", { name: "Next: Review schedule" }),
    ).toBeDisabled();
  });

  it("enables review when the activity is complete", () => {
    render(
      <ScheduleTimetableStep
        entries={[
          {
            id: "entry-1",
            name: "Public Skate",
            startTime: "10:00",
            duration: 120,
            capacity: 100,
            type: "BOOKABLE",
          },
        ]}
        setEntries={vi.fn()}
        onBack={vi.fn()}
        onCancel={vi.fn()}
        onNext={vi.fn()}
      />,
    );

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Next: Review schedule" }),
    ).toBeEnabled();
  });
});
