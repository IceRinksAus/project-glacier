import {
  Controller,
  Get,
  Header,
  Param,
  Post,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles/roles.guard';
import { OPERATOR_ROLES } from '../auth/roles/organization-role';
import { TicketService } from './ticket.service';

interface AuthenticatedUser {
  organizationId: string;
}

@Controller('ticket')
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  @Get('token/:token')
  getTicketByToken(@Param('token') token: string) {
    return this.ticketService.getTicketByToken(token);
  }

  @Get('token/:token/qr')
  @Header('Content-Type', 'image/png')
  @Header('Cache-Control', 'private, no-store')
  async getPublicTicketQrCode(@Param('token') token: string) {
    const qrCode = await this.ticketService.generatePublicQrCode(token);
    return new StreamableFile(qrCode);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...OPERATOR_ROLES)
  @Get('validate/:token')
  validateTicket(
    @Param('token') token: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ticketService.validateTicket(user.organizationId, token);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...OPERATOR_ROLES)
  @Post('scan/:token')
  checkInTicket(
    @Param('token') token: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ticketService.checkInTicket(user.organizationId, token);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...OPERATOR_ROLES)
  @Get(':id/qr')
  @Header('Content-Type', 'image/png')
  async getTicketQrCode(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Res() response: Response,
  ) {
    const qrCode = await this.ticketService.generateQrCode(
      user.organizationId,
      id,
    );

    response.setHeader(
      'Content-Disposition',
      `inline; filename="ticket-${id}.png"`,
    );

    response.send(qrCode);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...OPERATOR_ROLES)
  @Get(':id')
  getTicketById(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ticketService.getTicketById(user.organizationId, id);
  }
}
