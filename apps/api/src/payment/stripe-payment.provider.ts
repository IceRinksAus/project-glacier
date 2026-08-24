import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import Stripe from 'stripe';

import type {
  CancelPaymentRequest,
  CancelPaymentResult,
  CreatePaymentRequest,
  CreatePaymentResult,
  PaymentProvider,
  ProviderPaymentStatus,
  ProviderRefundStatus,
  RefundPaymentRequest,
  RefundPaymentResult,
  RetrievePaymentRequest,
  RetrievePaymentResult,
} from './payment-provider.interface';

@Injectable()
export class StripePaymentProvider
  implements PaymentProvider
{
  private readonly stripe: Stripe;

  constructor() {
    const secretKey =
      process.env.STRIPE_SECRET_KEY;

    if (!secretKey) {
      throw new Error(
        'STRIPE_SECRET_KEY is not configured',
      );
    }

    this.stripe = new Stripe(
      secretKey,
    );
  }

  async createPayment(
    request: CreatePaymentRequest,
  ): Promise<CreatePaymentResult> {
    const amountInMinorUnits =
      Math.round(
        request.amount * 100,
      );

    const paymentIntent =
      await this.stripe.paymentIntents.create(
        {
          amount:
            amountInMinorUnits,
          currency:
            request.currency.toLowerCase(),

          automatic_payment_methods: {
            enabled: true,
            allow_redirects: 'never',
          },

          receipt_email:
            request.customerEmail,

          metadata: {
            glacierBookingId:
              request.bookingId,
          },
        },
        {
          idempotencyKey:
            request.idempotencyKey,
        },
      );

    if (
      !paymentIntent.client_secret
    ) {
      throw new InternalServerErrorException(
        'Stripe did not return a payment client secret',
      );
    }

    return {
      provider: 'STRIPE',
      paymentReference:
        paymentIntent.id,
      status:
        this.mapStripeStatus(
          paymentIntent.status,
        ),
      clientSecret:
        paymentIntent.client_secret,
    };
  }

  async cancelPayment(
    request: CancelPaymentRequest,
  ): Promise<CancelPaymentResult> {
    const paymentIntent =
      await this.stripe.paymentIntents.cancel(
        request.paymentReference,
        {
          cancellation_reason:
            'abandoned',
        },
        {
          idempotencyKey:
            request.idempotencyKey,
        },
      );

    return {
      provider: 'STRIPE',
      paymentReference:
        paymentIntent.id,
      status:
        this.mapStripeStatus(
          paymentIntent.status,
        ),
    };
  }

  async retrievePayment(
    request: RetrievePaymentRequest,
  ): Promise<RetrievePaymentResult> {
    const paymentIntent =
      await this.stripe.paymentIntents.retrieve(
        request.paymentReference,
      );

    return {
      provider: 'STRIPE',
      paymentReference:
        paymentIntent.id,
      status:
        paymentIntent.status ===
          'requires_payment_method' &&
        paymentIntent.last_payment_error
          ? 'FAILED'
          : this.mapStripeStatus(
              paymentIntent.status,
            ),
      failureCode:
        paymentIntent.last_payment_error
          ?.code ?? undefined,
      failureMessage:
        paymentIntent.last_payment_error
          ?.message ?? undefined,
    };
  }

  async refundPayment(
    request: RefundPaymentRequest,
  ): Promise<RefundPaymentResult> {
    const amountInMinorUnits =
      Math.round(
        request.amount * 100,
      );

    const refund =
      await this.stripe.refunds.create(
        {
          payment_intent:
            request.paymentReference,
          amount:
            amountInMinorUnits,

          metadata: {
            glacierReason:
              request.reason ??
              'Glacier refund',
          },
        },
        {
          idempotencyKey:
            request.idempotencyKey,
        },
      );

    return {
      provider: 'STRIPE',
      refundReference:
        refund.id,
      paymentReference:
        request.paymentReference,
      status:
        this.mapStripeRefundStatus(
          refund.status,
        ),
    };
  }

  private mapStripeStatus(
    status: Stripe.PaymentIntent.Status,
  ): ProviderPaymentStatus {
    switch (status) {
      case 'succeeded':
        return 'SUCCEEDED';

      case 'canceled':
        return 'CANCELLED';

      default:
        return 'PENDING';
    }
  }

  private mapStripeRefundStatus(
    status: string | null,
  ): ProviderRefundStatus {
    switch (status) {
      case 'succeeded':
        return 'SUCCEEDED';

      case 'failed':
        return 'FAILED';

      case 'canceled':
        return 'CANCELLED';

      default:
        return 'PENDING';
    }
  }
}
