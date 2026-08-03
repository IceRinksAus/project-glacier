import { Module } from '@nestjs/common';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { RuleModule } from '../rule/rule.module';
import { BookingReservationService } from './booking-reservation.service';

@Module({
  imports: [RuleModule],
  controllers: [BookingController],
providers: [
  BookingService,
  BookingReservationService,
],
})
export class BookingModule {}