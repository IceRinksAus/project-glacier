import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles/roles.guard';
import { EventWaiverService } from './event-waiver.service';

interface AuthenticatedUser {
  userId: string;
  email: string;
  role: string;
  organizationId: string;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('event/:eventId/waiver')
export class EventWaiverController {
  constructor(private readonly eventWaiverService: EventWaiverService) {}

  @Get()
  findForEvent(
    @Param('eventId') eventId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.eventWaiverService.findForEvent(user.organizationId, eventId);
  }

  @Get('qr-code')
  generatePublicQrCode(
    @Param('eventId') eventId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.eventWaiverService.generatePublicQrCode(
      user.organizationId,
      eventId,
    );
  }

  @Get('submissions')
  listSubmissions(
    @Param('eventId') eventId: string,
    @Query('search') search: string | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.eventWaiverService.listSubmissions(
      user.organizationId,
      eventId,
      search,
    );
  }

  @Get('submissions/:submissionId')
  findSubmission(
    @Param('eventId') eventId: string,
    @Param('submissionId') submissionId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.eventWaiverService.findSubmission(
      user.organizationId,
      eventId,
      submissionId,
    );
  }

  @Roles('OWNER')
  @Post('drafts')
  createDraft(
    @Param('eventId') eventId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.eventWaiverService.createDraft(user.organizationId, eventId);
  }

  @Roles('OWNER')
  @Post('versions/:waiverVersionId/publish')
  publishDraft(
    @Param('eventId') eventId: string,
    @Param('waiverVersionId') waiverVersionId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.eventWaiverService.publishDraft(
      user.organizationId,
      eventId,
      waiverVersionId,
      user.userId,
    );
  }
}
