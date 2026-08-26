import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  Post,
  Res,
  StreamableFile,
} from '@nestjs/common';
import type { Response } from 'express';

import { CreateBookingDto } from '../booking/dto/create-booking.dto';

import { CreatePublicCustomerDto } from './dto/create-public-customer.dto';
import { CreatePublicPaymentDto } from './dto/create-public-payment.dto';
import { EvaluatePublicRulesDto } from './dto/evaluate-public-rules.dto';
import { QuoteFlexibleTicketDto } from './dto/quote-flexible-ticket.dto';
import { PublicBookingService } from './public-booking.service';
import { PublicPaymentService } from './public-payment.service';
import { FileAssetService } from '../file-asset/file-asset.service';

@Controller('public')
export class PublicBookingController {
  constructor(
    private readonly publicBookingService: PublicBookingService,
    private readonly publicPaymentService: PublicPaymentService,
    private readonly fileAssetService: FileAssetService,
  ) {}

  @Get('events/:eventId')
  findEvent(@Param('eventId') eventId: string) {
    return this.publicBookingService.findEvent(eventId);
  }

  @Get('event-sites/:eventSlug')
  findEventBySlug(@Param('eventSlug') eventSlug: string) {
    return this.publicBookingService.findEventBySlug(eventSlug);
  }

  @Get('event-sites/:eventSlug/assets/:assetId')
  async getPublicBrandingAsset(
    @Param('eventSlug') eventSlug: string,
    @Param('assetId') assetId: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const asset = await this.fileAssetService.getPublicBrandingAsset(
      eventSlug,
      assetId,
    );
    response.set({
      'Content-Type': asset.mimeType,
      'Cache-Control': 'public, max-age=300',
      ETag: `"${asset.checksum}"`,
      'X-Content-Type-Options': 'nosniff',
    });
    return new StreamableFile(asset.content);
  }

  @Get('events/:eventId/sessions')
  findSessions(@Param('eventId') eventId: string) {
    return this.publicBookingService.findSessions(eventId);
  }

  @Get('events/:eventId/ticket-types')
  findTicketTypes(@Param('eventId') eventId: string) {
    return this.publicBookingService.findTicketTypes(eventId);
  }

  @Post('events/:eventId/flexible-ticket-quote')
  quoteFlexibleTicket(
    @Param('eventId') eventId: string,
    @Body() data: QuoteFlexibleTicketDto,
  ) {
    return this.publicBookingService.quoteFlexibleTicket(eventId, data);
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

  @Post('bookings/:bookingId/status')
  @Header('Cache-Control', 'no-store')
  getBookingStatus(
    @Param('bookingId') bookingId: string,
    @Body() data: CreatePublicPaymentDto,
  ) {
    return this.publicPaymentService.getBookingStatus(
      bookingId,
      data.publicAccessToken,
    );
  }
}
