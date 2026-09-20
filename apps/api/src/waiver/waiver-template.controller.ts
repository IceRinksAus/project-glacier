import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles/roles.guard';
import { ApproveWaiverTemplateDto } from './dto/approve-waiver-template.dto';
import { CreateWaiverTemplateDto } from './dto/create-waiver-template.dto';
import { WaiverTemplateService } from './waiver-template.service';

interface AuthenticatedUser {
  userId: string;
  organizationId: string;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
)
@Controller('waiver-templates')
export class WaiverTemplateController {
  constructor(private readonly service: WaiverTemplateService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.service.list(user.organizationId);
  }

  @Roles('OWNER')
  @Post()
  create(
    @Body() data: CreateWaiverTemplateDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.createDraft(user.organizationId, data);
  }

  @Roles('OWNER')
  @Post(':templateId/approve')
  approve(
    @Param('templateId') templateId: string,
    @Body() data: ApproveWaiverTemplateDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.approve(
      user.organizationId,
      templateId,
      user.userId,
      data.approvalReference,
    );
  }

  @Roles('OWNER')
  @Post(':templateId/retire')
  retire(
    @Param('templateId') templateId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.retire(user.organizationId, templateId);
  }
}
