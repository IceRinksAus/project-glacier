import { Module } from '@nestjs/common';

import { EventWaiverController } from './event-waiver.controller';
import { EventWaiverService } from './event-waiver.service';
import { PublicWaiverController } from './public-waiver.controller';
import { PublicWaiverService } from './public-waiver.service';
import { WaiverTemplateService } from './waiver-template.service';

@Module({
  controllers: [EventWaiverController, PublicWaiverController],
  providers: [EventWaiverService, PublicWaiverService, WaiverTemplateService],
  exports: [EventWaiverService, WaiverTemplateService],
})
export class WaiverModule {}
