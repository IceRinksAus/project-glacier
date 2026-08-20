import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { CreateBookingDto } from '../booking/dto/create-booking.dto';

import { CreatePublicCustomerDto } from './dto/create-public-customer.dto';
import { CreatePublicPaymentDto } from './dto/create-public-payment.dto';
import { EvaluatePublicRulesDto } from './dto/evaluate-public-rules.dto';
import { PublicBookingService } from './public-booking.service';
import { PublicPaymentService } from './public-payment.service';

@Controller('public')
export class PublicBookingController {
  constructor(
    private readonly publicBookingService: PublicBookingService,
    private readonly publicPaymentService: PublicPaymentService,
  ) {}

  @Get('events/:eventId')
  findEvent(@Param('eventId') eventId: string) {
    return this.publicBookingService.findEvent(eventId);
  }

  @Get('events/:eventId/sessions')
  findSessions(@Param('eventId') eventId: string) {
    return this.publicBookingService.findSessions(eventId);
  }

  @Get('events/:eventId/ticket-types')
  findTicketTypes(@Param('eventId') eventId: string) {
    return this.publicBookingService.findTicketTypes(eventId);
  }

  @Post('events/:eventId/evaluate-rules')
  evaluateRules(
    @Param('eventId') eventId: string,
    @Body() data: EvaluatePublicRulesDto,
  ) {
    return this.publicBookingService.evaluateRules(eventId, data);
  }

  @Get('sessions/:sessionId/products')
  findSessionProducts(@Param('sessionId') sessionId: string) {
    return this.publicBookingService.findSessionProducts(sessionId);
  }

  @Post('customers')
  createCustomer(@Body() data: CreatePublicCustomerDto) {
    return this.publicBookingService.createCustomer(data);
  }

  @Post('bookings')
  createBooking(@Body() data: CreateBookingDto) {
    return this.publicBookingService.createBooking(data);
  }

  @Post('bookings/:bookingId/payments')
  createPayment(
    @Param('bookingId') bookingId: string,
    @Body() data: CreatePublicPaymentDto,
  ) {
    return this.publicPaymentService.createPayment(
      bookingId,
      data.publicAccessToken,
    );
  }
}
