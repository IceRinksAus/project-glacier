import { Module } from '@nestjs/common';

import { BookingModule } from '../booking/booking.module';
import { PaymentModule } from '../payment/payment.module';
import { RuleModule } from '../rule/rule.module';

import { PublicBookingController } from './public-booking.controller';
import { PublicBookingService } from './public-booking.service';
import { PublicPaymentService } from './public-payment.service';

@Module({
  imports: [
    BookingModule,
    PaymentModule,
    RuleModule,
  ],
  controllers: [
    PublicBookingController,
  ],
  providers: [
    PublicBookingService,
    PublicPaymentService,
  ],
})
export class PublicBookingModule {}