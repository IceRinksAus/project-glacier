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
import {
  AccessControlService,
  AuthenticatedAccessContext,
} from '../access-control/access-control.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles/roles.guard';
import { OPERATOR_ROLES } from '../auth/roles/organization-role';
import { MANAGEMENT_ROLES } from '../auth/roles/organization-role';
import { TicketCredentialRotationService } from './ticket-credential-rotation.service';
import { TicketService } from './ticket.service';

type AuthenticatedUser = AuthenticatedAccessContext;

@Controller('ticket')
export class TicketController {
  constructor(
    private readonly ticketService: TicketService,
    private readonly accessControl: AccessControlService,
    private readonly credentialRotation: TicketCredentialRotationService,
  ) {}

  @Get('token/:token')
  getTicketByToken(@Param('token') token: string) {
    return this.ticketService.getTicketByToken(token);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...MANAGEMENT_ROLES)
  @Post(':id/credential/rotate')
  rotateCredential(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.credentialRotation.rotate(id, user);
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
  async validateTicket(
    @Param('token') token: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.accessControl.assertTicketAccessByToken(token, user);
    return this.ticketService.validateTicket(user.organizationId, token);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...OPERATOR_ROLES)
  @Post('scan/:token')
  async checkInTicket(
    @Param('token') token: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.accessControl.assertTicketAccessByToken(token, user);
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
    await this.accessControl.assertTicketAccessById(id, user);
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
  async getTicketById(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.accessControl.assertTicketAccessById(id, user);
    return this.ticketService.getTicketById(user.organizationId, id);
  }
}
