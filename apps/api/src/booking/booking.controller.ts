import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedAccessContext } from '../access-control/access-control.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth/jwt-auth.guard';
import { MANAGEMENT_ROLES } from '../auth/roles/organization-role';
import { RolesGuard } from '../auth/roles/roles.guard';
import { BookingService } from './booking.service';
import { SearchBookingsQueryDto } from './dto/search-bookings-query.dto';

type AuthenticatedUser = AuthenticatedAccessContext;

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('booking')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.bookingService.findAll(user);
  }

  @Get('search')
  search(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: SearchBookingsQueryDto,
  ) {
    return this.bookingService.search(user, query);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.bookingService.findOne(user, id);
  }

  @Roles(...MANAGEMENT_ROLES)
  @Get(':id/payment-investigation')
  findPaymentInvestigation(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.bookingService.findPaymentInvestigation(user, id);
  }

  @Roles('OWNER')
  @Post(':id/payment-reconciliation')
  reconcilePayment(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.bookingService.reconcilePayment(
      user.organizationId,
      user.userId,
      id,
    );
  }
}
