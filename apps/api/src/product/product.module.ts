import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { FileAssetModule } from '../file-asset/file-asset.module';

@Module({
  imports: [FileAssetModule],
  controllers: [ProductController],
  providers: [ProductService],
})
export class ProductModule {}
