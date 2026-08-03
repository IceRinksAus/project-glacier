import {
  Controller,
  Get,
  Header,
  Param,
  Post,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { TicketService } from './ticket.service';

@Controller('ticket')
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  @Get('token/:token')
  getTicketByToken(@Param('token') token: string) {
    return this.ticketService.getTicketByToken(token);
  }
  @Get('validate/:token')
  validateTicket(@Param('token') token: string) {
    return this.ticketService.validateTicket(token);
  }
  @Post('scan/:token')
  checkInTicket(@Param('token') token: string) {
    return this.ticketService.checkInTicket(token);
  }

  @Get(':id/qr')
  @Header('Content-Type', 'image/png')
  async getTicketQrCode(
    @Param('id') id: string,
    @Res() response: Response,
  ) {
    const qrCode = await this.ticketService.generateQrCode(id);

    response.setHeader(
      'Content-Disposition',
      `inline; filename="ticket-${id}.png"`,
    );

    response.send(qrCode);
  }

  @Get(':id')
  getTicketById(@Param('id') id: string) {
    return this.ticketService.getTicketById(id);
  }
}