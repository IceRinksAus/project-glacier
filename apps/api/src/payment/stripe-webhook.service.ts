import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import Stripe from 'stripe';

import { PaymentService } from './payment.service';

@Injectable()
export class StripeWebhookService {
  private readonly stripe: Stripe;

  constructor(
    private readonly paymentService: PaymentService,
  ) {
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

  async handleWebhook(
    rawBody: Buffer,
    signature: string,
  ) {
    const webhookSecret =
      process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      throw new InternalServerErrorException(
        'STRIPE_WEBHOOK_SECRET is not configured',
      );
    }

    let event: Stripe.Event;

    try {
      event =
        this.stripe.webhooks.constructEvent(
          rawBody,
          signature,
          webhookSecret,
        );
    } catch {
      throw new BadRequestException(
        'Invalid Stripe webhook signature',
      );
    }

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent =
          event.data
            .object as Stripe.PaymentIntent;

        await this.paymentService
          .completePaymentFromProviderEvent({
            provider: 'STRIPE',
            paymentReference:
              paymentIntent.id,
            status: 'SUCCEEDED',
          });

        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent =
          event.data
            .object as Stripe.PaymentIntent;

        await this.paymentService
          .completePaymentFromProviderEvent({
            provider: 'STRIPE',
            paymentReference:
              paymentIntent.id,
            status: 'FAILED',
            failureCode:
              paymentIntent
                .last_payment_error
                ?.code ?? undefined,
            failureMessage:
              paymentIntent
                .last_payment_error
                ?.message ?? undefined,
          });

        break;
      }

      case 'payment_intent.canceled': {
        const paymentIntent =
          event.data
            .object as Stripe.PaymentIntent;

        await this.paymentService
          .completePaymentFromProviderEvent({
            provider: 'STRIPE',
            paymentReference:
              paymentIntent.id,
            status: 'CANCELLED',
          });

        break;
      }

      case 'payment_intent.processing': {
        const paymentIntent =
          event.data
            .object as Stripe.PaymentIntent;

        await this.paymentService
          .completePaymentFromProviderEvent({
            provider: 'STRIPE',
            paymentReference:
              paymentIntent.id,
            status: 'PENDING',
          });

        break;
      }

      default:
        /*
         * Stripe sends many event types.
         *
         * Unknown/unneeded events are acknowledged but
         * intentionally ignored.
         */
        break;
    }

    return {
      received: true,
      eventId: event.id,
      eventType: event.type,
    };
  }
}