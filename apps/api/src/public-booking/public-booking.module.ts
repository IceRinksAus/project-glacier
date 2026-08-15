import { Module } from '@nestjs/common';

import { BookingModule } from '../booking/booking.module';
import { RuleModule } from '../rule/rule.module';

import { PublicBookingController } from './public-booking.controller';
import { PublicBookingService } from './public-booking.service';

@Module({
  imports: [
    BookingModule,
    RuleModule,
  ],
  controllers: [
    PublicBookingController,
  ],
  providers: [
    PublicBookingService,
  ],
})
export class PublicBookingModule {}