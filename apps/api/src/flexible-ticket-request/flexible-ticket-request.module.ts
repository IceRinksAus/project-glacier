import { Module } from '@nestjs/common';

import { FlexibleTicketRequestController } from './flexible-ticket-request.controller';
import { FlexibleTicketRequestService } from './flexible-ticket-request.service';

@Module({
  controllers: [FlexibleTicketRequestController],
  providers: [FlexibleTicketRequestService],
  exports: [FlexibleTicketRequestService],
})
export class FlexibleTicketRequestModule {}
