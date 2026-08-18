import { Injectable } from '@nestjs/common';

import {
  CancelPaymentRequest,
  CancelPaymentResult,
  CreatePaymentRequest,
  CreatePaymentResult,
  PaymentProvider,
  RefundPaymentRequest,
  RefundPaymentResult,
} from './payment-provider.interface';

@Injectable()
export class MockPaymentProvider
  implements PaymentProvider
{
  async createPayment(
    request: CreatePaymentRequest,
  ): Promise<CreatePaymentResult> {
    return {
      provider: 'MOCK',
      paymentReference:
        `mock_${request.bookingId}_${Date.now()}`,
      status: 'SUCCEEDED',
    };
  }

  async cancelPayment(
    request: CancelPaymentRequest,
  ): Promise<CancelPaymentResult> {
    return {
      provider: 'MOCK',
      paymentReference:
        request.paymentReference,
      status: 'CANCELLED',
    };
  }

  async refundPayment(
    request: RefundPaymentRequest,
  ): Promise<RefundPaymentResult> {
    return {
      provider: 'MOCK',
      refundReference:
        `mock_refund_${Date.now()}`,
      paymentReference:
        request.paymentReference,
      status: 'SUCCEEDED',
    };
  }
}