import { describe, expect, it } from "vitest";

import { eventTabs } from "./EventTabs";

describe("EventTabs", () => {
  it("places Ticket Types before Products in the setup journey", () => {
    expect(eventTabs.indexOf("Ticket Types")).toBeLessThan(
      eventTabs.indexOf("Products"),
    );
  });
});
