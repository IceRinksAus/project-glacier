import {
  InternalServerErrorException,
} from '@nestjs/common';

import { StripePaymentProvider } from './stripe-payment.provider';

const mockCreatePaymentIntent =
  jest.fn();

const mockCancelPaymentIntent =
  jest.fn();

const mockCreateRefund =
  jest.fn();

jest.mock(
  'stripe',
  () => {
    return {
      __esModule: true,
      default:
        jest.fn().mockImplementation(
          () => ({
            paymentIntents: {
              create:
                mockCreatePaymentIntent,
              cancel:
                mockCancelPaymentIntent,
            },
            refunds: {
              create:
                mockCreateRefund,
            },
          }),
        ),
    };
  },
);

describe('StripePaymentProvider', () => {
  let originalSecretKey:
    | string
    | undefined;

  beforeAll(() => {
    originalSecretKey =
      process.env.STRIPE_SECRET_KEY;
  });

  beforeEach(() => {
    jest.clearAllMocks();

    process.env.STRIPE_SECRET_KEY =
      'sk_test_example';
  });

  afterAll(() => {
    if (
      originalSecretKey ===
      undefined
    ) {
      delete process.env
        .STRIPE_SECRET_KEY;

      return;
    }

    process.env.STRIPE_SECRET_KEY =
      originalSecretKey;
  });

  it('should be defined', () => {
    const provider =
      new StripePaymentProvider();

    expect(provider).toBeDefined();
  });

  it('should require a Stripe secret key', () => {
    delete process.env
      .STRIPE_SECRET_KEY;

    expect(
      () =>
        new StripePaymentProvider(),
    ).toThrow(
      'STRIPE_SECRET_KEY is not configured',
    );
  });

  it('should create a Stripe PaymentIntent using integer cents and Glacier idempotency', async () => {
    mockCreatePaymentIntent.mockResolvedValue({
      id: 'pi_test_1',
      status:
        'requires_payment_method',
      client_secret:
        'pi_test_1_secret_test',
    });

    const provider =
      new StripePaymentProvider();

    const result =
      await provider.createPayment({
        bookingId:
          'booking-1',
        amount: 24,
        currency: 'AUD',
        customerEmail:
          'jamie@example.com',
        idempotencyKey:
          'booking_booking-1_payment',
      });

    expect(
      mockCreatePaymentIntent,
    ).toHaveBeenCalledWith(
      {
        amount: 2400,
        currency: 'aud',
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'never',
        },
        receipt_email:
          'jamie@example.com',
        metadata: {
          glacierBookingId:
            'booking-1',
        },
      },
      {
        idempotencyKey:
          'booking_booking-1_payment',
      },
    );

    expect(result).toEqual({
      provider: 'STRIPE',
      paymentReference:
        'pi_test_1',
      status: 'PENDING',
      clientSecret:
        'pi_test_1_secret_test',
    });
  });

  it('should round payment amounts safely to integer cents', async () => {
    mockCreatePaymentIntent.mockResolvedValue({
      id: 'pi_test_2',
      status:
        'requires_payment_method',
      client_secret:
        'pi_test_2_secret_test',
    });

    const provider =
      new StripePaymentProvider();

    await provider.createPayment({
      bookingId:
        'booking-1',
      amount: 52.1,
      currency: 'AUD',
      idempotencyKey:
        'payment-key',
    });

    expect(
      mockCreatePaymentIntent,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 5210,
      }),
      expect.any(Object),
    );
  });

  it('should map succeeded Stripe PaymentIntent to SUCCEEDED', async () => {
    mockCreatePaymentIntent.mockResolvedValue({
      id: 'pi_success',
      status: 'succeeded',
      client_secret:
        'pi_success_secret_test',
    });

    const provider =
      new StripePaymentProvider();

    const result =
      await provider.createPayment({
        bookingId:
          'booking-1',
        amount: 24,
        currency: 'AUD',
        idempotencyKey:
          'payment-key',
      });

    expect(result.status).toBe(
      'SUCCEEDED',
    );
  });

  it('should map cancelled Stripe PaymentIntent to CANCELLED', async () => {
    mockCreatePaymentIntent.mockResolvedValue({
      id: 'pi_cancelled',
      status: 'canceled',
      client_secret:
        'pi_cancelled_secret_test',
    });

    const provider =
      new StripePaymentProvider();

    const result =
      await provider.createPayment({
        bookingId:
          'booking-1',
        amount: 24,
        currency: 'AUD',
        idempotencyKey:
          'payment-key',
      });

    expect(result.status).toBe(
      'CANCELLED',
    );
  });

  it('should reject a Stripe response without a client secret', async () => {
    mockCreatePaymentIntent.mockResolvedValue({
      id: 'pi_no_secret',
      status:
        'requires_payment_method',
      client_secret: null,
    });

    const provider =
      new StripePaymentProvider();

    await expect(
      provider.createPayment({
        bookingId:
          'booking-1',
        amount: 24,
        currency: 'AUD',
        idempotencyKey:
          'payment-key',
      }),
    ).rejects.toThrow(
      new InternalServerErrorException(
        'Stripe did not return a payment client secret',
      ),
    );
  });

  it('should cancel an unresolved Stripe PaymentIntent', async () => {
    mockCancelPaymentIntent.mockResolvedValue({
      id: 'pi_cancel_me',
      status: 'canceled',
    });

    const provider =
      new StripePaymentProvider();

    const result =
      await provider.cancelPayment({
        paymentReference:
          'pi_cancel_me',
        idempotencyKey:
          'cancel_payment-1',
      });

    expect(
      mockCancelPaymentIntent,
    ).toHaveBeenCalledWith(
      'pi_cancel_me',
      {
        cancellation_reason:
          'abandoned',
      },
      {
        idempotencyKey:
          'cancel_payment-1',
      },
    );

    expect(result).toEqual({
      provider: 'STRIPE',
      paymentReference:
        'pi_cancel_me',
      status: 'CANCELLED',
    });
  });

  it('should create a Stripe refund against a PaymentIntent', async () => {
    mockCreateRefund.mockResolvedValue({
      id: 're_test_1',
      status: 'succeeded',
    });

    const provider =
      new StripePaymentProvider();

    const result =
      await provider.refundPayment({
        paymentReference:
          'pi_success',
        amount: 24,
        currency: 'AUD',
        idempotencyKey:
          'refund_payment-1_late-success',
        reason:
          'Reservation expired before payment confirmation',
      });

    expect(
      mockCreateRefund,
    ).toHaveBeenCalledWith(
      {
        payment_intent:
          'pi_success',
        amount: 2400,
        metadata: {
          glacierReason:
            'Reservation expired before payment confirmation',
        },
      },
      {
        idempotencyKey:
          'refund_payment-1_late-success',
      },
    );

    expect(result).toEqual({
      provider: 'STRIPE',
      refundReference:
        're_test_1',
      paymentReference:
        'pi_success',
      status: 'SUCCEEDED',
    });
  });

  it('should map Stripe refund failures to FAILED', async () => {
    mockCreateRefund.mockResolvedValue({
      id: 're_failed',
      status: 'failed',
    });

    const provider =
      new StripePaymentProvider();

    const result =
      await provider.refundPayment({
        paymentReference:
          'pi_success',
        amount: 24,
        currency: 'AUD',
        idempotencyKey:
          'refund-key',
      });

    expect(result.status).toBe(
      'FAILED',
    );
  });
});