import {
  BadRequestException,
  Controller,
  Headers,
  Post,
  Req,
} from '@nestjs/common';

import type {
  RawBodyRequest,
} from '@nestjs/common';

import type {
  Request,
} from 'express';

import { StripeWebhookService } from './stripe-webhook.service';

@Controller('payment/stripe')
export class StripeWebhookController {
  constructor(
    private readonly stripeWebhookService: StripeWebhookService,
  ) {}

  @Post('webhook')
  handleWebhook(
    @Req()
    request: RawBodyRequest<Request>,

    @Headers('stripe-signature')
    signature?: string,
  ) {
    if (!signature) {
      throw new BadRequestException(
        'Missing Stripe signature',
      );
    }

    if (!request.rawBody) {
      throw new BadRequestException(
        'Stripe webhook raw body is unavailable',
      );
    }

    return this.stripeWebhookService.handleWebhook(
      request.rawBody,
      signature,
    );
  }
}