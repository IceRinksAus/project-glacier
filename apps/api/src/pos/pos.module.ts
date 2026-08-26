import { Module } from '@nestjs/common';

import { BookingModule } from '../booking/booking.module';
import { RuleModule } from '../rule/rule.module';
import { TicketModule } from '../ticket/ticket.module';
import { InventoryModule } from '../inventory/inventory.module';

import { PosController } from './pos.controller';
import { PosService } from './pos.service';
import { RetailSaleService } from './retail-sale.service';

@Module({
  imports: [BookingModule, RuleModule, TicketModule, InventoryModule],
  controllers: [PosController],
  providers: [PosService, RetailSaleService],
})
export class PosModule {}
