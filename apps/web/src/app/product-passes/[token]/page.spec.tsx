import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getProductCollectionPass, productCollectionPassQrUrl } = vi.hoisted(
  () => ({
    getProductCollectionPass: vi.fn(),
    productCollectionPassQrUrl: vi.fn(
      () => "http://localhost:3000/product-pass-qr",
    ),
  }),
);

vi.mock("@/services/public-booking.service", () => ({
  publicBookingService: {
    getProductCollectionPass,
    productCollectionPassQrUrl,
  },
}));

import ProductCollectionPassPage from "./page";

describe("ProductCollectionPassPage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows a paid Product credential without presenting it as admission", async () => {
    getProductCollectionPass.mockResolvedValue({
      kind: "PRODUCT_COLLECTION_PASS",
      passNumber: "PRD-1-ABCDEF",
      status: "ACTIVE",
      productName: "Kanga",
      variantName: null,
      quantity: 1,
      issuedAt: "2027-07-01T00:00:00.000Z",
      collectedAt: null,
      bookingNumber: "PG-1",
      event: { name: "Test Event" },
      session: {
        name: "10am",
        startDate: "2027-07-01T00:00:00.000Z",
        endDate: "2027-07-01T02:00:00.000Z",
      },
      grantsAdmission: false,
    });

    await act(async () => {
      render(
        <ProductCollectionPassPage
          params={Promise.resolve({ token: "gp1-token" })}
        />,
      );
    });

    expect(await screen.findByRole("heading", { name: "Kanga × 1" })).toBeVisible();
    expect(screen.getByText(/does not grant rink entry/)).toBeVisible();
    expect(
      screen.getByRole("img", { name: "QR code for Kanga collection" }),
    ).toHaveAttribute("src", "http://localhost:3000/product-pass-qr");
  });

  it("hides the QR code after collection", async () => {
    getProductCollectionPass.mockResolvedValue({
      kind: "PRODUCT_COLLECTION_PASS",
      passNumber: "PRD-1-ABCDEF",
      status: "COLLECTED",
      productName: "Kanga",
      variantName: null,
      quantity: 1,
      issuedAt: "2027-07-01T00:00:00.000Z",
      collectedAt: "2027-07-01T00:10:00.000Z",
      bookingNumber: "PG-1",
      event: { name: "Test Event" },
      session: null,
      grantsAdmission: false,
    });

    await act(async () => {
      render(
        <ProductCollectionPassPage
          params={Promise.resolve({ token: "gp1-token" })}
        />,
      );
    });

    expect(await screen.findByText("COLLECTED")).toBeVisible();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});
