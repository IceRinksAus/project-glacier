import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles/roles.guard';
import { EventService } from './event.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEntryPolicyDto } from './dto/update-entry-policy.dto';
import { EventBrandingDto } from './dto/event-branding.dto';
import { UploadBrandingAssetDto } from './dto/upload-branding-asset.dto';
import { FileAssetService } from '../file-asset/file-asset.service';
import type { BrandingImageUpload } from '../file-asset/file-asset.types';

interface AuthenticatedUser {
  userId: string;
  email: string;
  role: string;
  organizationId: string;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('event')
export class EventController {
  constructor(
    private readonly eventService: EventService,
    private readonly fileAssetService: FileAssetService,
  ) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.eventService.findAll(user.organizationId);
  }

  @Roles('OWNER', 'MEMBER')
  @Get(':id/readiness')
  getReadiness(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.eventService.getReadiness(id, user.organizationId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.eventService.findOne(id, user.organizationId);
  }

  @Roles('OWNER')
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() data: CreateEventDto) {
    return this.eventService.create(user.organizationId, data);
  }

  @Roles('OWNER')
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() data: { status: string },
  ) {
    return this.eventService.updateStatus(id, user.organizationId, data.status);
  }

  @Roles('OWNER')
  @Patch(':id/entry-policy')
  updateEntryPolicy(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() data: UpdateEntryPolicyDto,
  ) {
    return this.eventService.updateEntryPolicy(id, user.organizationId, data);
  }

  @Roles('OWNER')
  @Patch(':id/branding')
  updateBranding(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() data: EventBrandingDto,
  ) {
    return this.eventService.updateBranding(id, user.organizationId, data);
  }

  @Roles('OWNER')
  @Post(':id/branding/assets')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    }),
  )
  uploadBrandingAsset(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() data: UploadBrandingAssetDto,
    @UploadedFile() file: BrandingImageUpload,
  ) {
    return this.fileAssetService.createBrandingAsset({
      eventId: id,
      organizationId: user.organizationId,
      userId: user.userId,
      purpose: data.purpose,
      displayName: data.displayName,
      file,
    });
  }

  @Roles('OWNER')
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.eventService.remove(id, user.organizationId);
  }
}
