import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PlatformTopBar } from "./PlatformTopBar";

const authUser = vi.hoisted(() => ({
  name: "Festival Staff",
  role: "MANAGER",
}));

vi.mock("@/lib/auth", () => ({
  subscribeAuthSession: () => () => undefined,
  getAuthUserSnapshot: () => authUser,
  getServerAuthUserSnapshot: () => null,
}));

describe("PlatformTopBar", () => {
  it("shows the current authenticated user instead of a fixed Owner", () => {
    render(<PlatformTopBar />);

    expect(screen.getByText("Festival Staff")).toBeVisible();
    expect(screen.getByText("Manager")).toBeVisible();
    expect(screen.getByText("FS")).toBeVisible();
    expect(screen.queryByText("Jamie Stoller")).not.toBeInTheDocument();
  });
});
