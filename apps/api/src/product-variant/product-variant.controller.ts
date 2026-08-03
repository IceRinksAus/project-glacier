import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles/roles.guard';

import { CreateProductVariantDto } from './dto/create-product-variant.dto';
import { UpdateProductVariantDto } from './dto/update-product-variant.dto';
import { ProductVariantService } from './product-variant.service';

interface AuthenticatedUser {
  userId: string;
  email: string;
  role: string;
  organizationId: string;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('product-variant')
export class ProductVariantController {
  constructor(
    private readonly productVariantService: ProductVariantService,
  ) {}

  @Roles('OWNER')
  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createProductVariantDto: CreateProductVariantDto,
  ) {
    return this.productVariantService.create(
      user.organizationId,
      createProductVariantDto,
    );
  }

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.productVariantService.findAll(
      user.organizationId,
    );
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.productVariantService.findOne(
      id,
      user.organizationId,
    );
  }

  @Roles('OWNER')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() updateProductVariantDto: UpdateProductVariantDto,
  ) {
    return this.productVariantService.update(
      id,
      user.organizationId,
      updateProductVariantDto,
    );
  }

  @Roles('OWNER')
  @Delete(':id')
  remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.productVariantService.remove(
      id,
      user.organizationId,
    );
  }
}