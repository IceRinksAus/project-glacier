import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles/roles.guard';

import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { SessionService } from './session.service';

interface AuthenticatedUser {
  userId: string;
  email: string;
  role: string;
  organizationId: string;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('session')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Roles('OWNER')
  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createSessionDto: CreateSessionDto,
  ) {
    return this.sessionService.create(
      user.organizationId,
      createSessionDto,
    );
  }

 @Get()
findAll(
  @CurrentUser() user: AuthenticatedUser,
  @Query('eventId') eventId?: string,
) {
  return this.sessionService.findAll(
    user.organizationId,
    eventId,
  );
}

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.sessionService.findOne(
      id,
      user.organizationId,
    );
  }

  @Roles('OWNER')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() updateSessionDto: UpdateSessionDto,
  ) {
    return this.sessionService.update(
      id,
      user.organizationId,
      updateSessionDto,
    );
  }

@Roles('OWNER')
@Patch(':id/cancel')
cancel(
  @Param('id') id: string,
  @CurrentUser() user: AuthenticatedUser,
) {
  return this.sessionService.cancel(
    id,
    user.organizationId,
  );
}
  @Roles('OWNER')
  @Delete(':id')
  remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.sessionService.remove(
      id,
      user.organizationId,
    );
  }
}