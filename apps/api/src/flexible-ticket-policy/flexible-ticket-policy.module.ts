import { Module } from '@nestjs/common';

import { FlexibleTicketPolicyController } from './flexible-ticket-policy.controller';
import { FlexibleTicketPolicyService } from './flexible-ticket-policy.service';

@Module({
  controllers: [FlexibleTicketPolicyController],
  providers: [FlexibleTicketPolicyService],
  exports: [FlexibleTicketPolicyService],
})
export class FlexibleTicketPolicyModule {}
