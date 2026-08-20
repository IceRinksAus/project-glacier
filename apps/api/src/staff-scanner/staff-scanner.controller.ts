import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth/jwt-auth.guard';
import { SCANNER_ROLES } from '../auth/roles/organization-role';
import { RolesGuard } from '../auth/roles/roles.guard';
import { ScannerTicketDto } from './dto/scanner-ticket.dto';
import { StaffScannerService } from './staff-scanner.service';

interface ScannerUser {
  userId: string;
  organizationId: string;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...SCANNER_ROLES)
@Controller('staff/scanner')
export class StaffScannerController {
  constructor(private readonly service: StaffScannerService) {}

  @Get('events')
  findEvents(@CurrentUser() user: ScannerUser) {
    return this.service.findActiveEvents(user.organizationId);
  }

  @Get('events/:eventId/context')
  getContext(
    @Param('eventId') eventId: string,
    @CurrentUser() user: ScannerUser,
  ) {
    return this.service.getEventContext(user.organizationId, eventId);
  }

  @Post('events/:eventId/validate')
  lookup(
    @Param('eventId') eventId: string,
    @Body() input: ScannerTicketDto,
    @CurrentUser() user: ScannerUser,
  ) {
    return this.service.lookup(user.organizationId, eventId, input);
  }

  @Post('events/:eventId/admit')
  admit(
    @Param('eventId') eventId: string,
    @Body() input: ScannerTicketDto,
    @CurrentUser() user: ScannerUser,
  ) {
    return this.service.admit(user.organizationId, user.userId, eventId, input);
  }
}
