import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedAccessContext } from '../access-control/access-control.service';
import { JwtAuthGuard } from '../auth/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles/roles.guard';
import { CustomerService } from './customer.service';
import { SearchCustomersQueryDto } from './dto/search-customers-query.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { MANAGEMENT_ROLES } from '../auth/roles/organization-role';

type AuthenticatedUser = AuthenticatedAccessContext;

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('customer')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.customerService.findAll(user);
  }

  @Get('search')
  search(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: SearchCustomersQueryDto,
  ) {
    return this.customerService.search(user, query);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.customerService.findOne(user, id);
  }

  @Roles(...MANAGEMENT_ROLES)
  @Post(':id/events/:eventId/marketing-withdrawal')
  withdrawMarketing(
    @Param('id') id: string,
    @Param('eventId') eventId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.customerService.withdrawMarketing(user, id, eventId);
  }
}
