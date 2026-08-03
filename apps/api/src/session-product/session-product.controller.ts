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

import { CreateSessionProductDto } from './dto/create-session-product.dto';
import { UpdateSessionProductDto } from './dto/update-session-product.dto';
import { SessionProductService } from './session-product.service';

interface AuthenticatedUser {
  userId: string;
  email: string;
  role: string;
  organizationId: string;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('session-product')
export class SessionProductController {
  constructor(
    private readonly sessionProductService: SessionProductService,
  ) {}

  @Roles('OWNER')
  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createSessionProductDto: CreateSessionProductDto,
  ) {
    return this.sessionProductService.create(
      user.organizationId,
      createSessionProductDto,
    );
  }

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.sessionProductService.findAll(
      user.organizationId,
    );
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.sessionProductService.findOne(
      id,
      user.organizationId,
    );
  }

  @Roles('OWNER')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() updateSessionProductDto: UpdateSessionProductDto,
  ) {
    return this.sessionProductService.update(
      id,
      user.organizationId,
      updateSessionProductDto,
    );
  }

  @Roles('OWNER')
  @Delete(':id')
  remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.sessionProductService.remove(
      id,
      user.organizationId,
    );
  }
}