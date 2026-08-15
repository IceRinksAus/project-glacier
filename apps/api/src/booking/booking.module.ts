import { Module } from '@nestjs/common';

import { BookingValidationModule } from '../booking-validation/booking-validation.module';
import { RuleModule } from '../rule/rule.module';

import { BookingReservationService } from './booking-reservation.service';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';

@Module({
  imports: [
    RuleModule,
    BookingValidationModule,
  ],
  controllers: [BookingController],
  providers: [
    BookingService,
    BookingReservationService,
  ],
  exports: [
    BookingService,
  ],
})
export class BookingModule {}