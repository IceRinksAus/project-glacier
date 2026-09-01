import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PlatformTopBar } from "./PlatformTopBar";

const authUser = vi.hoisted(() => ({
  name: "Festival Staff",
  role: "MANAGER",
}));
const mocks = vi.hoisted(() => ({
  endAuthSession: vi.fn(),
  replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace }),
}));

vi.mock("@/lib/auth", () => ({
  subscribeAuthSession: () => () => undefined,
  getAuthUserSnapshot: () => authUser,
  getServerAuthUserSnapshot: () => null,
  endAuthSession: mocks.endAuthSession,
}));

describe("PlatformTopBar", () => {
  it("shows the current authenticated user instead of a fixed Owner", () => {
    render(<PlatformTopBar />);

    expect(screen.getByText("Festival Staff")).toBeVisible();
    expect(screen.getByText("Manager")).toBeVisible();
    expect(screen.getByText("FS")).toBeVisible();
    expect(screen.queryByText("Jamie Stoller")).not.toBeInTheDocument();
  });

  it("revokes the server session before returning to login", async () => {
    mocks.endAuthSession.mockResolvedValue(true);
    render(<PlatformTopBar />);

    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    await waitFor(() => expect(mocks.endAuthSession).toHaveBeenCalledOnce());
    expect(mocks.replace).toHaveBeenCalledWith("/login");
  });
});
