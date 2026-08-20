import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ScannerCamera } from "./ScannerCamera";

const { decodeFromConstraints } = vi.hoisted(() => ({
  decodeFromConstraints: vi.fn(),
}));

vi.mock("@zxing/browser", () => ({
  BrowserQRCodeReader: class {
    decodeFromConstraints = decodeFromConstraints;
  },
}));

describe("ScannerCamera", () => {
  it("shows a manual-entry fallback when camera access is denied", async () => {
    decodeFromConstraints.mockRejectedValueOnce(new Error("Permission denied"));

    render(<ScannerCamera active onDetected={vi.fn()} />);

    expect(
      await screen.findByText(
        "Camera access is unavailable. Allow camera permission or use manual entry.",
      ),
    ).toBeVisible();
  });

  it("stops camera controls when scanning is paused", async () => {
    const stop = vi.fn();
    decodeFromConstraints.mockResolvedValueOnce({ stop });
    const { rerender } = render(<ScannerCamera active onDetected={vi.fn()} />);
    await waitFor(() => expect(decodeFromConstraints).toHaveBeenCalled());

    rerender(<ScannerCamera active={false} onDetected={vi.fn()} />);

    await waitFor(() => expect(stop).toHaveBeenCalled());
  });
});
