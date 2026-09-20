import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import {
  ScheduleTimetableStep,
  TimetableEntry,
} from "./ScheduleTimetableStep";

describe("ScheduleTimetableStep", () => {
  it("allows the default capacity to be cleared and replaced without a leading zero", async () => {
    const user = userEvent.setup();
    const Wrapper = () => {
      const [entries, setEntries] = useState<TimetableEntry[]>([
        {
          id: "entry-1",
          name: "Public Skate",
          startTime: "10:00",
          duration: 60,
          capacity: 200,
          type: "BOOKABLE",
        },
      ]);
      return (
        <ScheduleTimetableStep
          entries={entries}
          setEntries={setEntries}
          onBack={vi.fn()}
          onCancel={vi.fn()}
          onNext={vi.fn()}
        />
      );
    };
    render(<Wrapper />);

    const capacity = screen.getByRole("spinbutton", { name: "Capacity" });
    await user.clear(capacity);
    expect(capacity).toHaveValue(null);
    await user.type(capacity, "100");
    expect(capacity).toHaveValue(100);
  });

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
