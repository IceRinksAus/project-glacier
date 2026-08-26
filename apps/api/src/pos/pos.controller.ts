import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import type { AuthenticatedAccessContext } from '../access-control/access-control.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth/jwt-auth.guard';
import { OPERATOR_ROLES } from '../auth/roles/organization-role';
import { RolesGuard } from '../auth/roles/roles.guard';
import { EvaluatePublicRulesDto } from '../public-booking/dto/evaluate-public-rules.dto';

import { CreatePosCustomerDto } from './dto/create-pos-customer.dto';
import { CreatePosReservationDto } from './dto/create-pos-reservation.dto';
import { CompletePosPaymentDto } from './dto/complete-pos-payment.dto';
import { PosCatalogueQueryDto } from './dto/pos-catalogue-query.dto';
import { PosService } from './pos.service';
import { RetailSaleService } from './retail-sale.service';
import { CreateRetailSaleDto } from './dto/create-retail-sale.dto';
import { SearchRetailSalesQueryDto } from './dto/search-retail-sales-query.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...OPERATOR_ROLES)
@Controller('pos')
export class PosController {
  constructor(
    private readonly posService: PosService,
    private readonly retailSaleService: RetailSaleService,
  ) {}

  @Get('events/:eventId/merchandise')
  findMerchandiseCatalogue(
    @CurrentUser() user: AuthenticatedAccessContext,
    @Param('eventId') eventId: string,
  ) {
    return this.retailSaleService.findCatalogue(user, eventId);
  }

  @Get('events/:eventId/retail-sales')
  searchRetailSales(
    @CurrentUser() user: AuthenticatedAccessContext,
    @Param('eventId') eventId: string,
    @Query() query: SearchRetailSalesQueryDto,
  ) {
    return this.retailSaleService.search(user, eventId, query);
  }

  @Get('events/:eventId/retail-sales/:retailSaleId')
  findRetailSale(
    @CurrentUser() user: AuthenticatedAccessContext,
    @Param('eventId') eventId: string,
    @Param('retailSaleId') retailSaleId: string,
  ) {
    return this.retailSaleService.findOne(user, eventId, retailSaleId);
  }

  @Post('events/:eventId/retail-sales')
  createRetailSale(
    @CurrentUser() user: AuthenticatedAccessContext,
    @Param('eventId') eventId: string,
    @Body() data: CreateRetailSaleDto,
  ) {
    return this.retailSaleService.createReservation(user, eventId, data);
  }

  @Post('events/:eventId/retail-sales/:retailSaleId/complete')
  completeRetailSale(
    @CurrentUser() user: AuthenticatedAccessContext,
    @Param('eventId') eventId: string,
    @Param('retailSaleId') retailSaleId: string,
    @Body() data: CompletePosPaymentDto,
  ) {
    return this.retailSaleService.completePayment(
      user,
      eventId,
      retailSaleId,
      data,
    );
  }

  @Get('events/:eventId/catalogue')
  findCatalogue(
    @CurrentUser() user: AuthenticatedAccessContext,
    @Param('eventId') eventId: string,
    @Query() query: PosCatalogueQueryDto,
  ) {
    return this.posService.findCatalogue(user, eventId, query.sessionId);
  }

  @Post('events/:eventId/customers')
  createCustomer(
    @CurrentUser() user: AuthenticatedAccessContext,
    @Param('eventId') eventId: string,
    @Body() data: CreatePosCustomerDto,
  ) {
    return this.posService.createCustomer(user, eventId, data);
  }

  @Post('events/:eventId/evaluate-rules')
  evaluateRules(
    @CurrentUser() user: AuthenticatedAccessContext,
    @Param('eventId') eventId: string,
    @Body() data: EvaluatePublicRulesDto,
  ) {
    return this.posService.evaluateRules(user, eventId, data);
  }

  @Post('events/:eventId/reservations')
  createReservation(
    @CurrentUser() user: AuthenticatedAccessContext,
    @Param('eventId') eventId: string,
    @Body() data: CreatePosReservationDto,
  ) {
    return this.posService.createReservation(user, eventId, data);
  }

  @Post('events/:eventId/reservations/:bookingId/complete')
  completePayment(
    @CurrentUser() user: AuthenticatedAccessContext,
    @Param('eventId') eventId: string,
    @Param('bookingId') bookingId: string,
    @Body() data: CompletePosPaymentDto,
  ) {
    return this.posService.completePayment(user, eventId, bookingId, data);
  }
}
