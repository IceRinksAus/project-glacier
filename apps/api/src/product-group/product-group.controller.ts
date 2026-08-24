import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles/roles.guard';
import { CreateProductGroupDto } from './dto/create-product-group.dto';
import { ListProductGroupsQueryDto } from './dto/list-product-groups-query.dto';
import { ReorderProductGroupsDto } from './dto/reorder-product-groups.dto';
import { ReorderProductsDto } from './dto/reorder-products.dto';
import { UpdateProductGroupDto } from './dto/update-product-group.dto';
import { ProductGroupService } from './product-group.service';

interface AuthenticatedUser {
  organizationId: string;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('product-group')
export class ProductGroupController {
  constructor(private readonly productGroupService: ProductGroupService) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListProductGroupsQueryDto,
  ) {
    return this.productGroupService.findAll(user.organizationId, query.eventId);
  }

  @Roles('OWNER')
  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() data: CreateProductGroupDto,
  ) {
    return this.productGroupService.create(user.organizationId, data);
  }

  @Roles('OWNER')
  @Patch('order')
  reorderGroups(
    @CurrentUser() user: AuthenticatedUser,
    @Body() data: ReorderProductGroupsDto,
  ) {
    return this.productGroupService.reorderGroups(user.organizationId, data);
  }

  @Roles('OWNER')
  @Patch('product-order')
  reorderProducts(
    @CurrentUser() user: AuthenticatedUser,
    @Body() data: ReorderProductsDto,
  ) {
    return this.productGroupService.reorderProducts(user.organizationId, data);
  }

  @Roles('OWNER')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() data: UpdateProductGroupDto,
  ) {
    return this.productGroupService.update(user.organizationId, id, data);
  }

  @Roles('OWNER')
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.productGroupService.remove(user.organizationId, id);
  }
}
