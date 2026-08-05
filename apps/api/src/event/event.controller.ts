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
import { EventService } from './event.service';

interface AuthenticatedUser {
  userId: string;
  email: string;
  role: string;
  organizationId: string;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('event')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.eventService.findAll(user.organizationId);
  }

  @Roles('OWNER')
  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body()
    data: {
      name: string;
      slug: string;
      description?: string;
      startDate: string;
      endDate: string;
    },
  ) {
    return this.eventService.create(user.organizationId, data);
  }

@Roles('OWNER')
@Patch(':id/status')
updateStatus(
  @Param('id') id: string,
  @CurrentUser() user: AuthenticatedUser,
  @Body() data: { status: string },
) {
  return this.eventService.updateStatus(
    id,
    user.organizationId,
    data.status,
  );
}  

  @Roles('OWNER')
  @Delete(':id')
  remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.eventService.remove(id, user.organizationId);
  }
}