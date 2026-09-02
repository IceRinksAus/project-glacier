import { Global, Module } from '@nestjs/common';
import { TicketCredentialService } from './ticket-credential.service';
import { TicketController } from './ticket.controller';
import { TicketService } from './ticket.service';

@Global()
@Module({
  controllers: [TicketController],
  providers: [TicketCredentialService, TicketService],
  exports: [TicketCredentialService, TicketService],
})
export class TicketModule {}
