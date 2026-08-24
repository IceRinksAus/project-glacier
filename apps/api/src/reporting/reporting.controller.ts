import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles/roles.guard';
import { EventReportQueryDto } from './dto/event-report-query.dto';
import { ReportingService } from './reporting.service';

interface AuthenticatedUser {
  organizationId: string;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER', 'MEMBER')
@Controller('reporting')
export class ReportingController {
  constructor(private readonly reportingService: ReportingService) {}

  @Get('events/:eventId')
  getEventReport(
    @Param('eventId') eventId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: EventReportQueryDto,
  ) {
    return this.reportingService.getEventReport(
      user.organizationId,
      eventId,
      query,
    );
  }
}
