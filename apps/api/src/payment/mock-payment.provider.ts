import { Injectable } from '@nestjs/common';
import {
  CreatePaymentRequest,
  CreatePaymentResult,
  PaymentProvider,
} from './payment-provider.interface';

@Injectable()
export class MockPaymentProvider implements PaymentProvider {
  async createPayment(
    request: CreatePaymentRequest,
  ): Promise<CreatePaymentResult> {
    return {
      provider: 'MOCK',
      paymentReference: `mock_${request.bookingId}_${Date.now()}`,
      status: 'SUCCEEDED',
    };
  }
}