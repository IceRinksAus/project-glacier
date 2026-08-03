import { Module } from '@nestjs/common';
import { TicketTypeController } from './ticket-type.controller';
import { TicketTypeService } from './ticket-type.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TicketTypeController],
  providers: [TicketTypeService],
})
export class TicketTypeModule {}