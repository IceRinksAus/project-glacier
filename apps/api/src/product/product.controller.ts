import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles/roles.guard';

import { CreateProductDto } from './dto/create-product.dto';
import { ListProductsQueryDto } from './dto/list-products-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateProductStatusDto } from './dto/update-product-status.dto';
import { ProductService } from './product.service';
import { FileAssetService } from '../file-asset/file-asset.service';
import type { BrandingImageUpload } from '../file-asset/file-asset.types';
import { UploadCatalogueImageDto } from '../file-asset/dto/upload-catalogue-image.dto';

interface AuthenticatedUser {
  userId: string;
  email: string;
  role: string;
  organizationId: string;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('product')
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly fileAssetService: FileAssetService,
  ) {}

  @Roles('OWNER')
  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createProductDto: CreateProductDto,
  ) {
    return this.productService.create(user.organizationId, createProductDto);
  }

  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListProductsQueryDto,
  ) {
    return this.productService.findAll(user.organizationId, query.eventId);
  }

  @Roles('OWNER')
  @Post(':id/image')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    }),
  )
  uploadImage(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() data: UploadCatalogueImageDto,
    @UploadedFile() file: BrandingImageUpload,
  ) {
    return this.fileAssetService.createCatalogueAsset({
      target: 'PRODUCT',
      targetId: id,
      organizationId: user.organizationId,
      userId: user.userId,
      displayName: data.displayName,
      file,
    });
  }

  @Get(':id/image/:assetId')
  async getImage(
    @Param('id') id: string,
    @Param('assetId') assetId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) response: Response,
  ) {
    const asset = await this.fileAssetService.getCatalogueAsset(
      'PRODUCT',
      id,
      assetId,
      user.organizationId,
    );
    response.set({
      'Content-Type': asset.mimeType,
      'Content-Disposition': 'inline',
      'Cache-Control': 'private, max-age=300',
      ETag: `"${asset.checksum}"`,
      'X-Content-Type-Options': 'nosniff',
    });
    return new StreamableFile(asset.content);
  }

  @Roles('OWNER')
  @Delete(':id/image')
  removeImage(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.fileAssetService.removeCatalogueAsset(
      'PRODUCT',
      id,
      user.organizationId,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.productService.findOne(id, user.organizationId);
  }

  @Roles('OWNER')
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() data: UpdateProductStatusDto,
  ) {
    return this.productService.updateStatus(
      id,
      user.organizationId,
      data.status,
    );
  }

  @Roles('OWNER')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productService.update(
      id,
      user.organizationId,
      updateProductDto,
    );
  }

  @Roles('OWNER')
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.productService.remove(id, user.organizationId);
  }
}
