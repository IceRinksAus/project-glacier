import { Module } from '@nestjs/common';
import { SessionProductService } from './session-product.service';
import { SessionProductController } from './session-product.controller';

@Module({
  controllers: [SessionProductController],
  providers: [SessionProductService],
})
export class SessionProductModule {}
