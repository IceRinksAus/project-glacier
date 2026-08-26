import { Module } from '@nestjs/common';

import { AccessControlModule } from '../access-control/access-control.module';

import { TicketAdjustmentController } from './ticket-adjustment.controller';
import { TicketAdjustmentService } from './ticket-adjustment.service';

@Module({
  imports: [AccessControlModule],
  controllers: [TicketAdjustmentController],
  providers: [TicketAdjustmentService],
  exports: [TicketAdjustmentService],
})
export class TicketAdjustmentModule {}
