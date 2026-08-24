import { Module } from '@nestjs/common';

import { ProductGroupController } from './product-group.controller';
import { ProductGroupService } from './product-group.service';

@Module({
  controllers: [ProductGroupController],
  providers: [ProductGroupService],
})
export class ProductGroupModule {}
