import { Module } from '@nestjs/common';

import { BookingRescheduleModule } from '../booking-reschedule/booking-reschedule.module';
import { TicketAdjustmentModule } from '../ticket-adjustment/ticket-adjustment.module';

import { FlexibleTicketRequestController } from './flexible-ticket-request.controller';
import { FlexibleTicketRequestOperatorController } from './flexible-ticket-request-operator.controller';
import { FlexibleTicketRequestService } from './flexible-ticket-request.service';

@Module({
  imports: [BookingRescheduleModule, TicketAdjustmentModule],
  controllers: [
    FlexibleTicketRequestController,
    FlexibleTicketRequestOperatorController,
  ],
  providers: [FlexibleTicketRequestService],
  exports: [FlexibleTicketRequestService],
})
export class FlexibleTicketRequestModule {}
