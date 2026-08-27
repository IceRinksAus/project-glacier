import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';

import type { AuthenticatedAccessContext } from '../access-control/access-control.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth/jwt-auth.guard';
import { MANAGEMENT_ROLES } from '../auth/roles/organization-role';
import { RolesGuard } from '../auth/roles/roles.guard';
import {
  ExecuteFlexibleTicketDecisionDto,
  PreviewFlexibleTicketDecisionDto,
} from './dto/operator-flexible-ticket-request.dto';
import { FlexibleTicketRequestService } from './flexible-ticket-request.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...MANAGEMENT_ROLES)
@Controller('booking/:bookingId/flexible-ticket-requests')
export class FlexibleTicketRequestOperatorController {
  constructor(private readonly service: FlexibleTicketRequestService) {}

  @Get()
  context(
    @CurrentUser() user: AuthenticatedAccessContext,
    @Param('bookingId') bookingId: string,
  ) {
    return this.service.operatorContext(user, bookingId);
  }

  @Post(':requestNumber/review')
  review(
    @CurrentUser() user: AuthenticatedAccessContext,
    @Param('bookingId') bookingId: string,
    @Param('requestNumber') requestNumber: string,
  ) {
    return this.service.markUnderReview(user, bookingId, requestNumber);
  }

  @Post(':requestNumber/decision-preview')
  previewDecision(
    @CurrentUser() user: AuthenticatedAccessContext,
    @Param('bookingId') bookingId: string,
    @Param('requestNumber') requestNumber: string,
    @Body() input: PreviewFlexibleTicketDecisionDto,
  ) {
    return this.service.previewDecision(user, bookingId, requestNumber, input);
  }

  @Post(':requestNumber/decision')
  decide(
    @CurrentUser() user: AuthenticatedAccessContext,
    @Param('bookingId') bookingId: string,
    @Param('requestNumber') requestNumber: string,
    @Body() input: ExecuteFlexibleTicketDecisionDto,
  ) {
    return this.service.executeDecision(user, bookingId, requestNumber, input);
  }
}
