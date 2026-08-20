import { Module } from '@nestjs/common';

import { TicketModule } from '../ticket/ticket.module';

import { PaymentService } from './payment.service';
import { StripePaymentProvider } from './stripe-payment.provider';
import { StripeWebhookController } from './stripe-webhook.controller';
import { StripeWebhookService } from './stripe-webhook.service';

@Module({
  imports: [TicketModule],
  controllers: [StripeWebhookController],
  providers: [
    PaymentService,
    StripePaymentProvider,
    StripeWebhookService,
    {
      provide: 'PAYMENT_PROVIDER',
      useExisting: StripePaymentProvider,
    },
  ],
  exports: [PaymentService],
})
export class PaymentModule {}
