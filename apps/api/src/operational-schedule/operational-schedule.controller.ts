import {
  Body,
  Controller,
  Post,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles/roles.guard';

import type { CreateOperationalScheduleDto } from './dto/create-operational-schedule.dto';
import { OperationalScheduleService } from './operational-schedule.service';

interface AuthenticatedUser {
  userId: string;
  email: string;
  role: string;
  organizationId: string;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('operational-schedule')
export class OperationalScheduleController {
  constructor(
    private readonly operationalScheduleService: OperationalScheduleService,
  ) {}

  @Roles('OWNER')
  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() data: CreateOperationalScheduleDto,
  ) {
    return this.operationalScheduleService.createAndGenerate(
      user.organizationId,
      data,
    );
  }
}
