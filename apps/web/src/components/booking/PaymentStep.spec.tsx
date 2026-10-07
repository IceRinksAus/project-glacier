import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.hoisted(() => {
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test_fictional";
});

import { publicBookingService } from "@/services/public-booking.service";

import { PaymentStep } from "./PaymentStep";

vi.mock("@stripe/stripe-js", () => ({
  loadStripe: vi.fn(() => Promise.resolve({})),
}));
vi.mock("@stripe/react-stripe-js", async () => {
  const { useEffect } = await vi.importActual<typeof import("react")>("react");
  return {
    Elements: ({ children }: { children: React.ReactNode }) => children,
    PaymentElement: ({
      onLoadError,
      onReady,
    }: {
      onLoadError?: (event: { error: { message: string } }) => void;
      onReady?: () => void;
    }) => {
      useEffect(() => onReady?.(), []);
      return (
        <div>
          Stripe fields
          <button
            type="button"
            onClick={() =>
              onLoadError?.({ error: { message: "Secure frame unavailable" } })
            }
          >
            Simulate Stripe frame failure
          </button>
        </div>
      );
    },
    useElements: () => ({}),
    useStripe: () => ({}),
  };
});
vi.mock("@/services/public-booking.service", () => ({
  publicBookingService: {
    getCheckoutDocuments: vi.fn(),
    createPayment: vi.fn(),
  },
}));

describe("PaymentStep checkout evidence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(publicBookingService.getCheckoutDocuments).mockResolvedValue({
      terms: {
        id: "terms-1",
        version: 2,
        title: "Ticketing Terms",
        content: "Test terms",
      },
      privacy: {
        id: "privacy-1",
        version: 3,
        title: "Privacy Notice",
        content: "Test privacy notice",
      },
      marketing: {
        id: "marketing-1",
        version: 1,
        title: "Marketing",
        content: "Optional marketing",
      },
      marketingSenderName: "Fictional Organiser",
    });
    vi.mocked(publicBookingService.createPayment).mockResolvedValue({
      clientSecret: "pi_test_secret_fictional",
    } as never);
  });

  it("keeps payment disabled until terms are accepted and marketing remains optional", async () => {
    const user = userEvent.setup();
    render(
      <PaymentStep
        reservation={
          {
            booking: {
              id: "booking-1",
              publicAccessToken: "a".repeat(64),
              total: 25,
            },
          } as never
        }
        onPaymentSubmitted={vi.fn()}
      />,
    );

    expect(await screen.findByText(/Ticketing Terms.*version 2/)).toBeVisible();
    const button = screen.getByRole("button", { name: "Continue to payment" });
    expect(button).toBeDisabled();
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes[1]).not.toBeChecked();
    await user.click(checkboxes[0]);
    expect(button).toBeEnabled();
    expect(checkboxes[1]).not.toBeChecked();
  });

  it("fails safely and offers an in-place retry when Stripe fields cannot load", async () => {
    const user = userEvent.setup();
    render(
      <PaymentStep
        reservation={
          {
            booking: {
              id: "booking-1",
              publicAccessToken: "a".repeat(64),
              total: 25,
            },
          } as never
        }
        onPaymentSubmitted={vi.fn()}
      />,
    );

    await user.click((await screen.findAllByRole("checkbox"))[0]);
    await user.click(
      screen.getByRole("button", { name: "Continue to payment" }),
    );

    await user.click(
      await screen.findByRole("button", {
        name: "Simulate Stripe frame failure",
      }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Secure frame unavailable",
    );
    expect(
      screen.getByRole("button", { name: "Loading secure payment..." }),
    ).toBeDisabled();

    await user.click(
      screen.getByRole("button", { name: "Retry secure payment fields" }),
    );
    expect(await screen.findByText("Stripe fields")).toBeVisible();
  });
});
