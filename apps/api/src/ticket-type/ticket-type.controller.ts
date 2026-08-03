import { Body, Controller, Get, Post } from '@nestjs/common';
import { TicketTypeService } from './ticket-type.service';

@Controller('ticket-type')
export class TicketTypeController {
  constructor(
    private readonly ticketTypeService: TicketTypeService,
  ) {}

  @Get()
  findAll() {
    return this.ticketTypeService.findAll();
  }

  @Post()
  create(
    @Body()
    data: {
      name: string;
      description?: string;
      price: number;
      capacity: number;
      active?: boolean;
      saleStart?: Date;
      saleEnd?: Date;
      eventId: string;
    },
  ) {
    return this.ticketTypeService.create(data);
  }
}