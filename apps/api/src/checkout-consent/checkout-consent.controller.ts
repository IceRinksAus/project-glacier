import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';

import type { AuthenticatedAccessContext } from '../access-control/access-control.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth/jwt-auth.guard';
import { MANAGEMENT_ROLES } from '../auth/roles/organization-role';
import { RolesGuard } from '../auth/roles/roles.guard';

import { CheckoutConsentService } from './checkout-consent.service';
import { CreateCheckoutDocumentDto } from './dto/create-checkout-document.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...MANAGEMENT_ROLES)
@Controller('checkout-consent/events/:eventId')
export class CheckoutConsentController {
  constructor(private readonly service: CheckoutConsentService) {}

  @Get()
  context(
    @CurrentUser() access: AuthenticatedAccessContext,
    @Param('eventId') eventId: string,
  ) {
    return this.service.eventContext(access, eventId);
  }

  @Post('documents')
  createDraft(
    @CurrentUser() access: AuthenticatedAccessContext,
    @Param('eventId') eventId: string,
    @Body() input: CreateCheckoutDocumentDto,
  ) {
    return this.service.createDraft(access, eventId, input);
  }

  @Post('documents/:documentId/publish')
  publish(
    @CurrentUser() access: AuthenticatedAccessContext,
    @Param('eventId') eventId: string,
    @Param('documentId') documentId: string,
  ) {
    return this.service.publish(access, eventId, documentId);
  }
}
