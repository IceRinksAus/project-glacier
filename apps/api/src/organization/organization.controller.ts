import {
  Body,
  Controller,
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
import { OPERATOR_ROLES } from '../auth/roles/organization-role';
import { AddOrganizationUserDto } from './dto/add-organization-user.dto';
import { UpdateTeamAccessDto } from './dto/update-team-access.dto';
import { OrganizationService } from './organization.service';

interface AuthenticatedUser {
  userId: string;
  organizationId: string;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('organization')
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Roles(...OPERATOR_ROLES)
  @Get()
  findCurrent(@CurrentUser() user: AuthenticatedUser) {
    return this.organizationService.findCurrent(user.organizationId);
  }

  @Roles('OWNER')
  @Get('team')
  listTeam(@CurrentUser() user: AuthenticatedUser) {
    return this.organizationService.listTeam(user.organizationId);
  }

  @Roles('OWNER')
  @Patch('team/:userId/access')
  updateTeamAccess(
    @Param('userId') targetUserId: string,
    @Body() body: UpdateTeamAccessDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.organizationService.updateTeamAccess(
      user.organizationId,
      user.userId,
      targetUserId,
      body,
    );
  }

  @Roles('OWNER')
  @Post(':id/users')
  addUser(
    @Param('id') id: string,
    @Body() body: AddOrganizationUserDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.organizationService.addUser(
      user.organizationId,
      id,
      user.userId,
      body,
    );
  }
}
