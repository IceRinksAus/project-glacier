import { Module } from '@nestjs/common';
import { TicketModule } from '../ticket/ticket.module';
import { PaymentController } from './payment.controller';
import { MockPaymentProvider } from './mock-payment.provider';
import { PaymentService } from './payment.service';

@Module({
  imports: [TicketModule],
  controllers: [PaymentController],
  providers: [
    PaymentService,
    MockPaymentProvider,
    {
      provide: 'PAYMENT_PROVIDER',
      useExisting: MockPaymentProvider,
    },
  ],
})
export class PaymentModule {}