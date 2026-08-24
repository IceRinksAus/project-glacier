import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles/roles.guard';
import { BookingService } from './booking.service';
import { SearchBookingsQueryDto } from './dto/search-bookings-query.dto';

interface AuthenticatedUser {
  userId: string;
  organizationId: string;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('booking')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.bookingService.findAll(user.organizationId);
  }

  @Get('search')
  search(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: SearchBookingsQueryDto,
  ) {
    return this.bookingService.search(
      user.organizationId,
      query,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.bookingService.findOne(user.organizationId, id);
  }

  @Roles('OWNER')
  @Get(':id/payment-investigation')
  findPaymentInvestigation(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.bookingService.findPaymentInvestigation(
      user.organizationId,
      id,
    );
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
