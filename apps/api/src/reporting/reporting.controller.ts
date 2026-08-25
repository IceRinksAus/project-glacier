import {
  Controller,
  Get,
  Param,
  Query,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles/roles.guard';
import { OPERATOR_ROLES } from '../auth/roles/organization-role';
import { EventReportQueryDto } from './dto/event-report-query.dto';
import { ReportingService } from './reporting.service';

interface AuthenticatedUser {
  organizationId: string;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...OPERATOR_ROLES)
@Controller('reporting')
export class ReportingController {
  constructor(private readonly reportingService: ReportingService) {}

  @Get('organization')
  getOrganizationSummary(@CurrentUser() user: AuthenticatedUser) {
    return this.reportingService.getOrganizationSummary(user.organizationId);
  }

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

  @Get('events/:eventId/ticket-types')
  getTicketTypeSales(
    @Param('eventId') eventId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: EventReportQueryDto,
  ) {
    return this.reportingService.getTicketTypeSales(
      user.organizationId,
      eventId,
      query,
    );
  }

  @Get('events/:eventId/sessions')
  getSessionSales(
    @Param('eventId') eventId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: EventReportQueryDto,
  ) {
    return this.reportingService.getSessionSales(
      user.organizationId,
      eventId,
      query,
    );
  }

  @Get('events/:eventId/products')
  getProductSales(
    @Param('eventId') eventId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: EventReportQueryDto,
  ) {
    return this.reportingService.getProductSales(
      user.organizationId,
      eventId,
      query,
    );
  }

  @Get('events/:eventId/dates')
  getDateSales(
    @Param('eventId') eventId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: EventReportQueryDto,
  ) {
    return this.reportingService.getDateSales(
      user.organizationId,
      eventId,
      query,
    );
  }

  @Get('events/:eventId/sales-pace')
  getSalesPace(
    @Param('eventId') eventId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: EventReportQueryDto,
  ) {
    return this.reportingService.getSalesPace(
      user.organizationId,
      eventId,
      query,
    );
  }

  @Get('event-groups/:groupId/comparison')
  getEventGroupComparison(
    @Param('groupId') groupId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.reportingService.getEventGroupComparison(
      user.organizationId,
      groupId,
    );
  }

  @Get('events/:eventId/exports/:reportType')
  async exportEventReport(
    @Param('eventId') eventId: string,
    @Param('reportType') reportType: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: EventReportQueryDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const file = await this.reportingService.getEventCsv(
      user.organizationId,
      eventId,
      reportType,
      query,
    );
    response.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${file.filename}"`,
      'Cache-Control': 'private, no-store',
    });
    return new StreamableFile(file.content);
  }

  @Get('event-groups/:groupId/exports/comparison.csv')
  async exportEventGroupComparison(
    @Param('groupId') groupId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) response: Response,
  ) {
    const file = await this.reportingService.getEventGroupComparisonCsv(
      user.organizationId,
      groupId,
    );
    response.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${file.filename}"`,
      'Cache-Control': 'private, no-store',
    });
    return new StreamableFile(file.content);
  }
}
