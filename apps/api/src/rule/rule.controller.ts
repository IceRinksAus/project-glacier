import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles/roles.guard';
import { RuleService } from './rule.service';
import { CreateRuleDto } from './dto/create-rule.dto';
import { UpdateRuleDto } from './dto/update-rule.dto';

interface AuthenticatedUser {
  organizationId: string;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('rule')
export class RuleController {
  constructor(private readonly ruleService: RuleService) {}

  @Roles('OWNER')
  @Post()
  create(
    @Body() createRuleDto: CreateRuleDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ruleService.create(user.organizationId, createRuleDto);
  }

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.ruleService.findAll(user.organizationId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.ruleService.findOne(user.organizationId, id);
  }

  @Roles('OWNER')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateRuleDto: UpdateRuleDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ruleService.update(user.organizationId, id, updateRuleDto);
  }

  @Roles('OWNER')
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.ruleService.remove(user.organizationId, id);
  }
}
