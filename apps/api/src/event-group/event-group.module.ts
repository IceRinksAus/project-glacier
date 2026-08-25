import { Module } from '@nestjs/common';

import { EventGroupController } from './event-group.controller';
import { EventGroupService } from './event-group.service';

@Module({
  controllers: [EventGroupController],
  providers: [EventGroupService],
  exports: [EventGroupService],
})
export class EventGroupModule {}
