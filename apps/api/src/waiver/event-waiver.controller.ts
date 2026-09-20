import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import {
  AccessControlService,
  AuthenticatedAccessContext,
} from '../access-control/access-control.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles/roles.guard';
import { EventWaiverService } from './event-waiver.service';
import { MatchWaiverSubmissionDto } from './dto/match-waiver-submission.dto';

interface AuthenticatedUser extends AuthenticatedAccessContext {
  email: string;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('event/:eventId/waiver')
export class EventWaiverController {
  constructor(
    private readonly eventWaiverService: EventWaiverService,
    private readonly accessControl: AccessControlService,
  ) {}

  @Roles('OWNER', 'MANAGER')
  @Get()
  async findForEvent(
    @Param('eventId') eventId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.accessControl.assertEventAccess(eventId, user);
    return this.eventWaiverService.findForEvent(user.organizationId, eventId);
  }

  @Roles('OWNER', 'MANAGER')
  @Get('qr-code')
  async generatePublicQrCode(
    @Param('eventId') eventId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.accessControl.assertEventAccess(eventId, user);
    return this.eventWaiverService.generatePublicQrCode(
      user.organizationId,
      eventId,
    );
  }

  @Roles('OWNER', 'MANAGER')
  @Get('submissions')
  async listSubmissions(
    @Param('eventId') eventId: string,
    @Query('search') search: string | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.accessControl.assertEventAccess(eventId, user);
    return this.eventWaiverService.listSubmissions(
      user.organizationId,
      eventId,
      search,
    );
  }

  @Roles('OWNER', 'MANAGER')
  @Get('association-bookings/:bookingNumber')
  async associationBooking(
    @Param('eventId') eventId: string,
    @Param('bookingNumber') bookingNumber: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.accessControl.assertEventAccess(eventId, user);
    return this.eventWaiverService.findAssociationBooking(
      user.organizationId,
      eventId,
      bookingNumber,
    );
  }

  @Roles('OWNER', 'MANAGER')
  @Get('submissions/:submissionId')
  async findSubmission(
    @Param('eventId') eventId: string,
    @Param('submissionId') submissionId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.accessControl.assertEventAccess(eventId, user);
    return this.eventWaiverService.findSubmission(
      user.organizationId,
      eventId,
      submissionId,
    );
  }

  @Roles('OWNER', 'MANAGER')
  @Post('submissions/:submissionId/association')
  async matchSubmission(
    @Param('eventId') eventId: string,
    @Param('submissionId') submissionId: string,
    @Body() data: MatchWaiverSubmissionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.accessControl.assertEventAccess(eventId, user);
    return this.eventWaiverService.matchSubmission(
      user.organizationId,
      eventId,
      submissionId,
      user.userId,
      data,
    );
  }

  @Roles('OWNER')
  @Post('drafts')
  async createDraft(
    @Param('eventId') eventId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.accessControl.assertEventAccess(eventId, user);
    return this.eventWaiverService.createDraft(user.organizationId, eventId);
  }

  @Roles('OWNER')
  @Post('versions/:waiverVersionId/publish')
  async publishDraft(
    @Param('eventId') eventId: string,
    @Param('waiverVersionId') waiverVersionId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.accessControl.assertEventAccess(eventId, user);
    return this.eventWaiverService.publishDraft(
      user.organizationId,
      eventId,
      waiverVersionId,
      user.userId,
    );
  }
}
