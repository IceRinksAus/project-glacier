import { Global, Module } from '@nestjs/common';
import { TicketCredentialService } from './ticket-credential.service';
import { TicketCredentialRotationService } from './ticket-credential-rotation.service';
import { TicketController } from './ticket.controller';
import { TicketService } from './ticket.service';

@Global()
@Module({
  controllers: [TicketController],
  providers: [
    TicketCredentialService,
    TicketCredentialRotationService,
    TicketService,
  ],
  exports: [TicketCredentialService, TicketService],
})
export class TicketModule {}
