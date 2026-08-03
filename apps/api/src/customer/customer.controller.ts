import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CustomerService } from './customer.service';

@Controller('customer')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Get()
  findAll() {
    return this.customerService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.customerService.findOne(id);
  }

  @Post()
  create(
    @Body()
    data: {
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
    },
  ) {
    return this.customerService.create(data);
  }
}