import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { EventSetupGuide } from "./EventSetupGuide";

describe("EventSetupGuide", () => {
  it("moves through the approved setup order without publishing anything", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(
      <EventSetupGuide activeTab="Products" onNavigate={onNavigate} />,
    );

    expect(screen.getByText(/Step 3 of 7: Products & Rules/)).toBeVisible();
    await user.click(
      screen.getByRole("button", { name: /Continue setup/ }),
    );
    expect(onNavigate).toHaveBeenCalledWith("Waiver");

    await user.click(screen.getByRole("button", { name: /^Back/ }));
    expect(onNavigate).toHaveBeenCalledWith("Ticket Types");
  });
});
