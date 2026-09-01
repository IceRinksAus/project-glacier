import { afterEach, describe, expect, it, vi } from "vitest";

import { endAuthSession, getAccessToken, setAuthSession } from "./auth";

describe("authentication session lifecycle", () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("revokes the server session before clearing local authentication", async () => {
    setAuthSession("session-token", { id: "user-1" });
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 201 }));

    await expect(endAuthSession()).resolves.toBe(true);

    expect(fetchMock).toHaveBeenCalledWith(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/logout`,
      {
        method: "POST",
        headers: { Authorization: "Bearer session-token" },
      },
    );
    expect(getAccessToken()).toBeNull();
  });

  it("still clears the local token when server revocation cannot be reached", async () => {
    setAuthSession("session-token", { id: "user-1" });
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));

    await expect(endAuthSession()).resolves.toBe(false);
    expect(getAccessToken()).toBeNull();
  });
});
