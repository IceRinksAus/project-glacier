import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles/roles.guard';
import { AddOrganizationUserDto } from './dto/add-organization-user.dto';
import { OrganizationService } from './organization.service';

interface AuthenticatedUser {
  organizationId: string;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('organization')
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Get()
  findCurrent(@CurrentUser() user: AuthenticatedUser) {
    return this.organizationService.findCurrent(user.organizationId);
  }

  @Roles('OWNER')
  @Post(':id/users')
  addUser(
    @Param('id') id: string,
    @Body() body: AddOrganizationUserDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.organizationService.addUser(user.organizationId, id, body);
  }
}
