import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';

import type { AuthenticatedAccessContext } from '../access-control/access-control.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth/jwt-auth.guard';
import { MANAGEMENT_ROLES } from '../auth/roles/organization-role';
import { RolesGuard } from '../auth/roles/roles.guard';

import { BookingRescheduleService } from './booking-reschedule.service';
import { ExecuteBookingRescheduleDto } from './dto/execute-booking-reschedule.dto';
import { PreviewBookingRescheduleDto } from './dto/preview-booking-reschedule.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...MANAGEMENT_ROLES)
@Controller('booking/:bookingId/reschedules')
export class BookingRescheduleController {
  constructor(private readonly service: BookingRescheduleService) {}

  @Get()
  context(
    @CurrentUser() user: AuthenticatedAccessContext,
    @Param('bookingId') bookingId: string,
  ) {
    return this.service.context(user, bookingId);
  }

  @Post('preview')
  preview(
    @CurrentUser() user: AuthenticatedAccessContext,
    @Param('bookingId') bookingId: string,
    @Body() input: PreviewBookingRescheduleDto,
  ) {
    return this.service.preview(user, bookingId, input);
  }

  @Post()
  execute(
    @CurrentUser() user: AuthenticatedAccessContext,
    @Param('bookingId') bookingId: string,
    @Body() input: ExecuteBookingRescheduleDto,
  ) {
    return this.service.execute(user, bookingId, input);
  }
}
