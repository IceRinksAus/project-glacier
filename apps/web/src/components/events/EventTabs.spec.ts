import { describe, expect, it } from "vitest";

import { parseEventTab } from "./EventTabs";

describe("parseEventTab", () => {
  it.each(["Sessions", "Ticket Types", "Waiver", "Settings"] as const)(
    "accepts the %s workspace destination",
    (tab) => {
      expect(parseEventTab(tab)).toBe(tab);
    },
  );

  it.each([null, "", "Unknown", "sessions"])(
    "returns Overview for an unsupported destination",
    (tab) => {
      expect(parseEventTab(tab)).toBe("Overview");
    },
  );
});
