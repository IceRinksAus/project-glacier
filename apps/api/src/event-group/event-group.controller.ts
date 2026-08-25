import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles/roles.guard';
import { OPERATOR_ROLES } from '../auth/roles/organization-role';
import { CreateEventGroupDto } from './dto/create-event-group.dto';
import { UpdateEventGroupDto } from './dto/update-event-group.dto';
import { UpdateEventGroupEventsDto } from './dto/update-event-group-events.dto';
import { EventGroupService } from './event-group.service';

interface AuthenticatedUser {
  organizationId: string;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...OPERATOR_ROLES)
@Controller('event-group')
export class EventGroupController {
  constructor(private readonly eventGroupService: EventGroupService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.eventGroupService.findAll(user.organizationId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.eventGroupService.findOne(user.organizationId, id);
  }

  @Roles('OWNER')
  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() data: CreateEventGroupDto,
  ) {
    return this.eventGroupService.create(user.organizationId, data);
  }

  @Roles('OWNER')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() data: UpdateEventGroupDto,
  ) {
    return this.eventGroupService.update(user.organizationId, id, data);
  }

  @Roles('OWNER')
  @Put(':id/events')
  replaceEvents(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() data: UpdateEventGroupEventsDto,
  ) {
    return this.eventGroupService.replaceEvents(user.organizationId, id, data);
  }
}
