import { describe, expect, it } from "vitest";

import { buildWaiverReturnAction } from "./waiver-return";

describe("buildWaiverReturnAction", () => {
  it("returns a booking-linked customer to secure booking management", () => {
    expect(
      buildWaiverReturnAction("harbour-lights", {
        bookingId: "booking-1",
        publicAccessToken: "private token",
      }),
    ).toEqual({
      href: "/booking-access/booking-1#access=private%20token",
      label: "Return to your booking",
    });
  });

  it("returns a standalone QR signatory to the public Event website", () => {
    expect(buildWaiverReturnAction("harbour lights", null)).toEqual({
      href: "/event/harbour%20lights",
      label: "Return to the Event website",
    });
  });
});
