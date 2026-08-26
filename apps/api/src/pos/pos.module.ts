import { Module } from '@nestjs/common';

import { BookingModule } from '../booking/booking.module';
import { RuleModule } from '../rule/rule.module';
import { TicketModule } from '../ticket/ticket.module';

import { PosController } from './pos.controller';
import { PosService } from './pos.service';

@Module({
  imports: [BookingModule, RuleModule, TicketModule],
  controllers: [PosController],
  providers: [PosService],
})
export class PosModule {}
