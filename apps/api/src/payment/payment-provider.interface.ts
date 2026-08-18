export type ProviderPaymentStatus =
  | 'PENDING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'CANCELLED';

export type ProviderRefundStatus =
  | 'PENDING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'CANCELLED';

export interface CreatePaymentRequest {
  bookingId: string;
  amount: number;
  currency: string;
  customerEmail?: string;
  idempotencyKey: string;
}

export interface CreatePaymentResult {
  provider: string;
  paymentReference: string;
  status: ProviderPaymentStatus;
  clientSecret?: string;
}

export interface CancelPaymentRequest {
  paymentReference: string;
  idempotencyKey: string;
}

export interface CancelPaymentResult {
  provider: string;
  paymentReference: string;
  status: ProviderPaymentStatus;
}

export interface RefundPaymentRequest {
  paymentReference: string;
  amount: number;
  currency: string;
  idempotencyKey: string;
  reason?: string;
}

export interface RefundPaymentResult {
  provider: string;
  refundReference: string;
  paymentReference: string;
  status: ProviderRefundStatus;
}

export interface CompleteProviderPaymentEvent {
  provider: string;
  paymentReference: string;
  status: ProviderPaymentStatus;
  failureCode?: string;
  failureMessage?: string;
}

export interface PaymentProvider {
  createPayment(
    request: CreatePaymentRequest,
  ): Promise<CreatePaymentResult>;

  cancelPayment(
    request: CancelPaymentRequest,
  ): Promise<CancelPaymentResult>;

  refundPayment(
    request: RefundPaymentRequest,
  ): Promise<RefundPaymentResult>;
}