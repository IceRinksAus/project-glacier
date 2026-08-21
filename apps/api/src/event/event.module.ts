import { Module } from '@nestjs/common';
import { EventController } from './event.controller';
import { EventService } from './event.service';
import { FileAssetModule } from '../file-asset/file-asset.module';

@Module({
  imports: [FileAssetModule],
  controllers: [EventController],
  providers: [EventService],
})
export class EventModule {}
