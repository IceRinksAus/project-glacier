import { Global, Module } from '@nestjs/common';
import { TicketCredentialService } from './ticket-credential.service';
import { TicketCredentialRotationService } from './ticket-credential-rotation.service';
import { TicketController } from './ticket.controller';
import { TicketService } from './ticket.service';
import { ProductCollectionPassController } from './product-collection-pass.controller';
import { ProductCollectionPassService } from './product-collection-pass.service';

@Global()
@Module({
  controllers: [TicketController, ProductCollectionPassController],
  providers: [
    TicketCredentialService,
    TicketCredentialRotationService,
    TicketService,
    ProductCollectionPassService,
  ],
  exports: [
    TicketCredentialService,
    TicketService,
    ProductCollectionPassService,
  ],
})
export class TicketModule {}
