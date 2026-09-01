import { describe, expect, it } from "vitest";

import { webSecurityHeaders } from "./security-headers";

describe("web security headers", () => {
  it("blocks framing and MIME sniffing while retaining scanner camera access", () => {
    expect(webSecurityHeaders).toContainEqual({
      key: "X-Frame-Options",
      value: "DENY",
    });
    expect(webSecurityHeaders).toContainEqual({
      key: "X-Content-Type-Options",
      value: "nosniff",
    });
    expect(webSecurityHeaders).toContainEqual({
      key: "Permissions-Policy",
      value: "camera=(self), microphone=(), geolocation=(), browsing-topics=()",
    });
  });
});
