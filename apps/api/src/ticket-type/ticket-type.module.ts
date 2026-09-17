import { Module } from '@nestjs/common';
import { TicketTypeController } from './ticket-type.controller';
import { TicketTypeService } from './ticket-type.service';
import { PrismaModule } from '../prisma/prisma.module';
import { FileAssetModule } from '../file-asset/file-asset.module';

@Module({
  imports: [PrismaModule, FileAssetModule],
  controllers: [TicketTypeController],
  providers: [TicketTypeService],
})
export class TicketTypeModule {}
