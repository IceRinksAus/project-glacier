import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { OrganizationService } from './organization.service';

@Controller('organization')
export class OrganizationController {
  constructor(
    private readonly organizationService: OrganizationService,
  ) {}

  @Get()
  findAll() {
    return this.organizationService.findAll();
  }

  @Post()
  create(@Body() data: { name: string; slug: string }) {
    return this.organizationService.create(data);
  }

  @Post(':id/users')
  addUser(
    @Param('id') id: string,
    @Body()
    body: {
      userId: string;
      role: string;
    },
  ) {
    return this.organizationService.addUser(id, body);
  }
}