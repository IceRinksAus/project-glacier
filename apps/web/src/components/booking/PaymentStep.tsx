"use client";

import {
  FormEvent,
  useState,
} from "react";

import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import {
  loadStripe,
} from "@stripe/stripe-js";

import {
  PublicBookingResponse,
  publicBookingService,
} from "@/services/public-booking.service";

const stripePublishableKey =
  process.env
    .NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

const stripePromise =
  stripePublishableKey
    ? loadStripe(
        stripePublishableKey,
      )
    : null;

interface PaymentStepProps {
  reservation: PublicBookingResponse;
  onPaymentSubmitted: () => void;
}

interface StripePaymentFormProps {
  reservation: PublicBookingResponse;
  onPaymentSubmitted: () => void;
}

function StripePaymentForm({
  reservation,
  onPaymentSubmitted,
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    paymentError,
    setPaymentError,
  ] = useState<string | null>(
    null,
  );

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      !stripe ||
      !elements
    ) {
      return;
    }

    setPaymentError(null);
    setIsSubmitting(true);

    try {
      const {
        error,
        paymentIntent,
      } =
        await stripe.confirmPayment({
          elements,

          confirmParams: {
            return_url:
              window.location.href,
          },

          redirect:
            "if_required",
        });

      if (error) {
        setPaymentError(
          error.message ??
            "Payment could not be completed.",
        );

        return;
      }

      /*
       * The browser does NOT mark the Booking PAID.
       *
       * Stripe webhook processing is the authoritative
       * completion path in Glacier.
       */
      if (
        paymentIntent &&
        (
          paymentIntent.status ===
            "processing" ||
          paymentIntent.status ===
            "succeeded"
        )
      ) {
        onPaymentSubmitted();

        return;
      }

      setPaymentError(
        "Payment is awaiting further processing.",
      );
    } catch (error) {
      setPaymentError(
        error instanceof Error
          ? error.message
          : "Unable to process payment.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6"
    >
      <PaymentElement />

      {paymentError ? (
        <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <p className="text-sm text-destructive">
            {paymentError}
          </p>
        </div>
      ) : null}

      <button
        type="submit"
        disabled={
          !stripe ||
          !elements ||
          isSubmitting
        }
        className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-foreground px-5 py-3 font-semibold text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {isSubmitting
          ? "Processing payment..."
          : `Pay ${new Intl.NumberFormat(
              "en-AU",
              {
                style:
                  "currency",
                currency:
                  "AUD",
              },
            ).format(
              reservation.booking
                .total,
            )}`}
      </button>

      <p className="mt-3 text-xs text-muted-foreground">
        Payment details are handled securely
        by Stripe.
      </p>
    </form>
  );
}

export function PaymentStep({
  reservation,
  onPaymentSubmitted,
}: PaymentStepProps) {
  const [
    clientSecret,
    setClientSecret,
  ] = useState<string | null>(
    null,
  );

  const [
    isStartingPayment,
    setIsStartingPayment,
  ] = useState(false);

  const [
    paymentError,
    setPaymentError,
  ] = useState<string | null>(
    null,
  );

  async function startPayment() {
    setPaymentError(null);
    setIsStartingPayment(true);

    try {
      const result =
        await publicBookingService.createPayment(
          reservation.booking.id,
          reservation.booking
            .publicAccessToken,
        );

      if (!result.clientSecret) {
        throw new Error(
          "Stripe payment session was not created.",
        );
      }

      setClientSecret(
        result.clientSecret,
      );
    } catch (error) {
      setPaymentError(
        error instanceof Error
          ? error.message
          : "Unable to start payment.",
      );
    } finally {
      setIsStartingPayment(false);
    }
  }

  if (!stripePromise) {
    return (
      <div className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
        <p className="font-medium">
          Payment unavailable
        </p>

        <p className="mt-2 text-sm text-destructive">
          Stripe has not been configured
          for this website.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-2xl border bg-background p-6">
      <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
        Payment
      </p>

      <h3 className="mt-2 text-xl font-semibold">
        Complete your booking
      </h3>

      <p className="mt-2 text-sm text-muted-foreground">
        Your reservation remains held while
        payment is completed.
      </p>

      <div className="mt-5 flex items-center justify-between rounded-xl border p-4">
        <span className="font-medium">
          Amount due
        </span>

        <span className="text-lg font-semibold">
          {new Intl.NumberFormat(
            "en-AU",
            {
              style: "currency",
              currency: "AUD",
            },
          ).format(
            reservation.booking.total,
          )}
        </span>
      </div>

      {paymentError ? (
        <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <p className="text-sm text-destructive">
            {paymentError}
          </p>
        </div>
      ) : null}

      {!clientSecret ? (
        <button
          type="button"
          disabled={isStartingPayment}
          onClick={startPayment}
          className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-foreground px-5 py-3 font-semibold text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {isStartingPayment
            ? "Preparing secure payment..."
            : "Continue to payment"}
        </button>
      ) : (
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
          }}
        >
          <StripePaymentForm
            reservation={reservation}
            onPaymentSubmitted={
              onPaymentSubmitted
            }
          />
        </Elements>
      )}
    </div>
  );
}