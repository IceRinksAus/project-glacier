import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';

import { PaymentService } from './payment.service';
import { StripeWebhookService } from './stripe-webhook.service';

const mockConstructEvent =
  jest.fn();

jest.mock(
  'stripe',
  () => {
    return {
      __esModule: true,
      default:
        jest.fn().mockImplementation(
          () => ({
            webhooks: {
              constructEvent:
                mockConstructEvent,
            },
          }),
        ),
    };
  },
);

describe('StripeWebhookService', () => {
  let service: StripeWebhookService;

  const paymentService = {
    completePaymentFromProviderEvent:
      jest.fn(),
  };

  const originalSecretKey =
    process.env.STRIPE_SECRET_KEY;

  const originalWebhookSecret =
    process.env
      .STRIPE_WEBHOOK_SECRET;

  beforeEach(() => {
    jest.clearAllMocks();

    process.env.STRIPE_SECRET_KEY =
      'sk_test_example';

    process.env.STRIPE_WEBHOOK_SECRET =
      'whsec_test_example';

    service =
      new StripeWebhookService(
        paymentService as unknown as PaymentService,
      );
  });

  afterAll(() => {
    if (
      originalSecretKey ===
      undefined
    ) {
      delete process.env
        .STRIPE_SECRET_KEY;
    } else {
      process.env.STRIPE_SECRET_KEY =
        originalSecretKey;
    }

    if (
      originalWebhookSecret ===
      undefined
    ) {
      delete process.env
        .STRIPE_WEBHOOK_SECRET;
    } else {
      process.env.STRIPE_WEBHOOK_SECRET =
        originalWebhookSecret;
    }
  });

  it('should reject an invalid Stripe signature', async () => {
    mockConstructEvent.mockImplementation(
      () => {
        throw new Error(
          'Invalid signature',
        );
      },
    );

    await expect(
      service.handleWebhook(
        Buffer.from('{}'),
        'bad-signature',
      ),
    ).rejects.toThrow(
      new BadRequestException(
        'Invalid Stripe webhook signature',
      ),
    );

    expect(
      paymentService
        .completePaymentFromProviderEvent,
    ).not.toHaveBeenCalled();
  });

  it('should require a webhook secret', async () => {
    delete process.env
      .STRIPE_WEBHOOK_SECRET;

    mockConstructEvent.mockReturnValue({
      id: 'evt_test',
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_test',
        },
      },
    });

    await expect(
      service.handleWebhook(
        Buffer.from('{}'),
        'signature',
      ),
    ).rejects.toThrow(
      new InternalServerErrorException(
        'STRIPE_WEBHOOK_SECRET is not configured',
      ),
    );
  });

  it('should handle payment_intent.succeeded', async () => {
    mockConstructEvent.mockReturnValue({
      id: 'evt_success',
      type:
        'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_success',
        },
      },
    });

    const result =
      await service.handleWebhook(
        Buffer.from('{}'),
        'signature',
      );

    expect(
      paymentService
        .completePaymentFromProviderEvent,
    ).toHaveBeenCalledWith({
      provider: 'STRIPE',
      paymentReference:
        'pi_success',
      status: 'SUCCEEDED',
    });

    expect(result).toEqual({
      received: true,
      eventId: 'evt_success',
      eventType:
        'payment_intent.succeeded',
    });
  });

  it('should handle payment_intent.payment_failed', async () => {
    mockConstructEvent.mockReturnValue({
      id: 'evt_failed',
      type:
        'payment_intent.payment_failed',
      data: {
        object: {
          id: 'pi_failed',
          last_payment_error: {
            code:
              'card_declined',
            message:
              'Your card was declined.',
          },
        },
      },
    });

    await service.handleWebhook(
      Buffer.from('{}'),
      'signature',
    );

    expect(
      paymentService
        .completePaymentFromProviderEvent,
    ).toHaveBeenCalledWith({
      provider: 'STRIPE',
      paymentReference:
        'pi_failed',
      status: 'FAILED',
      failureCode:
        'card_declined',
      failureMessage:
        'Your card was declined.',
    });
  });

  it('should handle payment_intent.canceled', async () => {
    mockConstructEvent.mockReturnValue({
      id: 'evt_cancelled',
      type:
        'payment_intent.canceled',
      data: {
        object: {
          id: 'pi_cancelled',
        },
      },
    });

    await service.handleWebhook(
      Buffer.from('{}'),
      'signature',
    );

    expect(
      paymentService
        .completePaymentFromProviderEvent,
    ).toHaveBeenCalledWith({
      provider: 'STRIPE',
      paymentReference:
        'pi_cancelled',
      status: 'CANCELLED',
    });
  });

  it('should handle payment_intent.processing as PENDING', async () => {
    mockConstructEvent.mockReturnValue({
      id: 'evt_processing',
      type:
        'payment_intent.processing',
      data: {
        object: {
          id: 'pi_processing',
        },
      },
    });

    await service.handleWebhook(
      Buffer.from('{}'),
      'signature',
    );

    expect(
      paymentService
        .completePaymentFromProviderEvent,
    ).toHaveBeenCalledWith({
      provider: 'STRIPE',
      paymentReference:
        'pi_processing',
      status: 'PENDING',
    });
  });

  it('should safely acknowledge unsupported Stripe events', async () => {
    mockConstructEvent.mockReturnValue({
      id: 'evt_other',
      type:
        'customer.created',
      data: {
        object: {
          id: 'cus_test',
        },
      },
    });

    const result =
      await service.handleWebhook(
        Buffer.from('{}'),
        'signature',
      );

    expect(
      paymentService
        .completePaymentFromProviderEvent,
    ).not.toHaveBeenCalled();

    expect(result).toEqual({
      received: true,
      eventId: 'evt_other',
      eventType:
        'customer.created',
    });
  });
});