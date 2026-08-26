import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import type { AuthenticatedAccessContext } from '../access-control/access-control.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth/jwt-auth.guard';
import { MANAGEMENT_ROLES } from '../auth/roles/organization-role';
import { RolesGuard } from '../auth/roles/roles.guard';

import { CreateFlexibleTicketPolicyDto } from './dto/create-flexible-ticket-policy.dto';
import { UpdateFlexibleTicketEventModeDto } from './dto/update-flexible-ticket-event-mode.dto';
import { FlexibleTicketPolicyService } from './flexible-ticket-policy.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...MANAGEMENT_ROLES)
@Controller('flexible-ticket-policies')
export class FlexibleTicketPolicyController {
  constructor(private readonly service: FlexibleTicketPolicyService) {}

  @Roles('OWNER')
  @Get('organization')
  organization(@CurrentUser() user: AuthenticatedAccessContext) {
    return this.service.organizationContext(user);
  }

  @Roles('OWNER')
  @Post('organization/drafts')
  createOrganizationDraft(
    @CurrentUser() user: AuthenticatedAccessContext,
    @Body() input: CreateFlexibleTicketPolicyDto,
  ) {
    return this.service.createOrganizationDraft(user, input);
  }

  @Roles('OWNER')
  @Post('organization/policies/:policyId/publish')
  publishOrganizationPolicy(
    @CurrentUser() user: AuthenticatedAccessContext,
    @Param('policyId') policyId: string,
  ) {
    return this.service.publishOrganizationPolicy(user, policyId);
  }

  @Get('events/:eventId')
  event(
    @CurrentUser() user: AuthenticatedAccessContext,
    @Param('eventId') eventId: string,
  ) {
    return this.service.eventContext(user, eventId);
  }

  @Roles('OWNER')
  @Patch('events/:eventId/mode')
  updateEventMode(
    @CurrentUser() user: AuthenticatedAccessContext,
    @Param('eventId') eventId: string,
    @Body() input: UpdateFlexibleTicketEventModeDto,
  ) {
    return this.service.updateEventMode(user, eventId, input.mode);
  }

  @Roles('OWNER')
  @Post('events/:eventId/drafts')
  createEventDraft(
    @CurrentUser() user: AuthenticatedAccessContext,
    @Param('eventId') eventId: string,
    @Body() input: CreateFlexibleTicketPolicyDto,
  ) {
    return this.service.createEventDraft(user, eventId, input);
  }

  @Roles('OWNER')
  @Post('events/:eventId/policies/:policyId/publish')
  publishEventPolicy(
    @CurrentUser() user: AuthenticatedAccessContext,
    @Param('eventId') eventId: string,
    @Param('policyId') policyId: string,
  ) {
    return this.service.publishEventPolicy(user, eventId, policyId);
  }
}
