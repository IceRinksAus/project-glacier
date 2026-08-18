import {
  Body,
  Controller,
  Get,
  Param,
  Post,
} from '@nestjs/common';

import { CreateBookingDto } from '../booking/dto/create-booking.dto';

import { PublicBookingService } from './public-booking.service';
import { PublicPaymentService } from './public-payment.service';

interface EvaluatePublicRulesParticipant {
  firstName: string;
  lastName?: string;
  age: number;
  ticketTypeId: string;
}

interface EvaluatePublicRulesBody {
  sessionId: string;
  flexibleBooking?: boolean;
  participants: EvaluatePublicRulesParticipant[];
}

interface CreatePublicPaymentBody {
  publicAccessToken: string;
}

@Controller('public')
export class PublicBookingController {
  constructor(
    private readonly publicBookingService: PublicBookingService,
    private readonly publicPaymentService: PublicPaymentService,
  ) {}

  @Get('events/:eventId')
  findEvent(
    @Param('eventId') eventId: string,
  ) {
    return this.publicBookingService.findEvent(
      eventId,
    );
  }

  @Get('events/:eventId/sessions')
  findSessions(
    @Param('eventId') eventId: string,
  ) {
    return this.publicBookingService.findSessions(
      eventId,
    );
  }

  @Get('events/:eventId/ticket-types')
  findTicketTypes(
    @Param('eventId') eventId: string,
  ) {
    return this.publicBookingService.findTicketTypes(
      eventId,
    );
  }

  @Post('events/:eventId/evaluate-rules')
  evaluateRules(
    @Param('eventId') eventId: string,
    @Body() data: EvaluatePublicRulesBody,
  ) {
    return this.publicBookingService.evaluateRules(
      eventId,
      data,
    );
  }

  @Get('sessions/:sessionId/products')
  findSessionProducts(
    @Param('sessionId') sessionId: string,
  ) {
    return this.publicBookingService.findSessionProducts(
      sessionId,
    );
  }

  @Post('customers')
  createCustomer(
    @Body()
    data: {
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
    },
  ) {
    return this.publicBookingService.createCustomer(
      data,
    );
  }

  @Post('bookings')
  createBooking(
    @Body() data: CreateBookingDto,
  ) {
    return this.publicBookingService.createBooking(
      data,
    );
  }

  @Post('bookings/:bookingId/payments')
  createPayment(
    @Param('bookingId') bookingId: string,
    @Body() data: CreatePublicPaymentBody,
  ) {
    return this.publicPaymentService.createPayment(
      bookingId,
      data.publicAccessToken,
    );
  }
}