export interface CreatePaymentRequest {
  bookingId: string;
  amount: number;
  currency: string;
  customerEmail?: string;
}

export interface CreatePaymentResult {
  provider: string;
  paymentReference: string;
  status: 'PENDING' | 'SUCCEEDED' | 'FAILED';
  clientSecret?: string;
}

export interface PaymentProvider {
  createPayment(
    request: CreatePaymentRequest,
  ): Promise<CreatePaymentResult>;
}