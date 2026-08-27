import { Body, Controller, Param, Post } from '@nestjs/common';

import {
  CreatePublicFlexibleTicketRequestDto,
  PublicFlexibleTicketAccessDto,
} from './dto/public-flexible-ticket-request.dto';
import { FlexibleTicketRequestService } from './flexible-ticket-request.service';

@Controller('public/bookings/:bookingId/flexible-ticket-requests')
export class FlexibleTicketRequestController {
  constructor(private readonly service: FlexibleTicketRequestService) {}

  @Post('context')
  context(
    @Param('bookingId') bookingId: string,
    @Body() input: PublicFlexibleTicketAccessDto,
  ) {
    return this.service.publicContext(bookingId, input.publicAccessToken);
  }

  @Post()
  create(
    @Param('bookingId') bookingId: string,
    @Body() input: CreatePublicFlexibleTicketRequestDto,
  ) {
    return this.service.createPublicRequest(bookingId, input);
  }

  @Post(':requestNumber/withdraw')
  withdraw(
    @Param('bookingId') bookingId: string,
    @Param('requestNumber') requestNumber: string,
    @Body() input: PublicFlexibleTicketAccessDto,
  ) {
    return this.service.withdrawPublicRequest(
      bookingId,
      requestNumber,
      input.publicAccessToken,
    );
  }
}
