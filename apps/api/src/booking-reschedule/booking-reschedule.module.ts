import { Module } from '@nestjs/common';

import { RuleModule } from '../rule/rule.module';

import { BookingRescheduleController } from './booking-reschedule.controller';
import { BookingRescheduleService } from './booking-reschedule.service';

@Module({
  imports: [RuleModule],
  controllers: [BookingRescheduleController],
  providers: [BookingRescheduleService],
  exports: [BookingRescheduleService],
})
export class BookingRescheduleModule {}
