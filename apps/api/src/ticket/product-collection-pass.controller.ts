import { Controller, Get, Header, Param, StreamableFile } from '@nestjs/common';

import { ProductCollectionPassService } from './product-collection-pass.service';

@Controller('product-collection-pass')
export class ProductCollectionPassController {
  constructor(private readonly passes: ProductCollectionPassService) {}

  @Get('token/:token')
  getPublic(@Param('token') token: string) {
    return this.passes.getPublic(token);
  }

  @Get('token/:token/qr')
  @Header('Content-Type', 'image/png')
  @Header('Cache-Control', 'private, no-store')
  async getPublicQr(@Param('token') token: string) {
    return new StreamableFile(await this.passes.generatePublicQrCode(token));
  }
}
