import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import LoginPage, { getPostLoginDestination } from "./page";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/lib/auth", () => ({ setAuthSession: vi.fn() }));

describe("LoginPage privileged enrolment", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: "MFA_ENROLLMENT_REQUIRED",
        challengeToken: "c".repeat(43),
        setup: { secret: "ABC234", qrCodeDataUrl: "data:image/png;base64,setup" },
      }),
    }));
  });

  it("explains replacement authority and explicitly requests a setup restart", async () => {
    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "valid-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText(/Restarting setup invalidates/)).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Restart authenticator setup" }));

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    expect(JSON.parse(vi.mocked(fetch).mock.calls[1][1]!.body as string)).toMatchObject({
      restartMfaEnrollment: true,
    });
  });

  it("removes harmless whitespace before submitting a six-digit code", async () => {
    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "valid-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    await screen.findByText(/Restarting setup invalidates/);

    fireEvent.change(screen.getByLabelText("Security code"), {
      target: { value: "123 456" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Finish setup" }));

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    expect(JSON.parse(vi.mocked(fetch).mock.calls[1][1]!.body as string)).toMatchObject({
      code: "123456",
    });
  });
});

describe("getPostLoginDestination", () => {
  it("takes organiser roles to the dashboard", () => {
    expect(getPostLoginDestination("OWNER")).toBe("/");
    expect(getPostLoginDestination("MANAGER")).toBe("/");
    expect(getPostLoginDestination("STAFF")).toBe("/");
  });

  it("keeps scanner accounts in the dedicated scanner experience", () => {
    expect(getPostLoginDestination("SCANNER")).toBe("/staff/scanner");
  });
});
