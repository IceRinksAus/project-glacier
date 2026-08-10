import { Module } from '@nestjs/common';

import { OperationalScheduleController } from './operational-schedule.controller';
import { OperationalScheduleService } from './operational-schedule.service';

@Module({
  controllers: [OperationalScheduleController],
  providers: [OperationalScheduleService],
})
export class OperationalScheduleModule {}