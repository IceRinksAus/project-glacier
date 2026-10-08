import { Module } from '@nestjs/common';
import { EventController } from './event.controller';
import { EventService } from './event.service';
import { FileAssetModule } from '../file-asset/file-asset.module';
import { EventSiteContentService } from './event-site-content.service';

@Module({
  imports: [FileAssetModule],
  controllers: [EventController],
  providers: [EventService, EventSiteContentService],
})
export class EventModule {}
