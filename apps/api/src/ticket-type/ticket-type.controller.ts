import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles/roles.guard';
import { CreateTicketTypeDto } from './dto/create-ticket-type.dto';
import { TicketTypeService } from './ticket-type.service';

interface AuthenticatedUser {
  organizationId: string;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ticket-type')
export class TicketTypeController {
  constructor(private readonly ticketTypeService: TicketTypeService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.ticketTypeService.findAll(user.organizationId);
  }

  @Roles('OWNER')
  @Post()
  create(
    @Body() data: CreateTicketTypeDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ticketTypeService.create(user.organizationId, data);
  }
}
