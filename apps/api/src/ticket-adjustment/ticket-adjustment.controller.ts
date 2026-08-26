import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';

import type { AuthenticatedAccessContext } from '../access-control/access-control.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth/jwt-auth.guard';
import { MANAGEMENT_ROLES } from '../auth/roles/organization-role';
import { RolesGuard } from '../auth/roles/roles.guard';

import { PreviewTicketAdjustmentDto } from './dto/preview-ticket-adjustment.dto';
import { TicketAdjustmentService } from './ticket-adjustment.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...MANAGEMENT_ROLES)
@Controller('booking/:bookingId/ticket-adjustments')
export class TicketAdjustmentController {
  constructor(private readonly service: TicketAdjustmentService) {}

  @Post('preview')
  preview(
    @CurrentUser() user: AuthenticatedAccessContext,
    @Param('bookingId') bookingId: string,
    @Body() input: PreviewTicketAdjustmentDto,
  ) {
    return this.service.preview(user, bookingId, input);
  }
}
