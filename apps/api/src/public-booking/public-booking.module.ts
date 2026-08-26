import { Module } from '@nestjs/common';

import { BookingModule } from '../booking/booking.module';
import { PaymentModule } from '../payment/payment.module';
import { RuleModule } from '../rule/rule.module';
import { FileAssetModule } from '../file-asset/file-asset.module';
import { FlexibleTicketPolicyModule } from '../flexible-ticket-policy/flexible-ticket-policy.module';

import { PublicBookingController } from './public-booking.controller';
import { PublicBookingService } from './public-booking.service';
import { PublicPaymentService } from './public-payment.service';

@Module({
  imports: [
    BookingModule,
    PaymentModule,
    RuleModule,
    FileAssetModule,
    FlexibleTicketPolicyModule,
  ],
  controllers: [PublicBookingController],
  providers: [PublicBookingService, PublicPaymentService],
})
export class PublicBookingModule {}
