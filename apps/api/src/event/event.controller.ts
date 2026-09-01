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
  StreamableFile,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles/roles.guard';
import type { AuthenticatedAccessContext } from '../access-control/access-control.service';
import { OPERATOR_ROLES } from '../auth/roles/organization-role';
import { EventService } from './event.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEntryPolicyDto } from './dto/update-entry-policy.dto';
import { EventBrandingDto } from './dto/event-branding.dto';
import { UploadBrandingAssetDto } from './dto/upload-branding-asset.dto';
import { FileAssetService } from '../file-asset/file-asset.service';
import type { BrandingImageUpload } from '../file-asset/file-asset.types';

interface AuthenticatedUser extends AuthenticatedAccessContext {
  userId: string;
  email: string;
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
    return this.eventService.findAll(user);
  }

  @Roles(...OPERATOR_ROLES)
  @Get(':id/readiness')
  getReadiness(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.eventService.getReadiness(id, user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.eventService.findOne(id, user);
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

  @Roles(...OPERATOR_ROLES)
  @Get(':id/branding/assets/:assetId')
  async getBrandingAsset(
    @Param('id') id: string,
    @Param('assetId') assetId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) response: Response,
  ) {
    const asset = await this.fileAssetService.getBrandingAsset(
      id,
      assetId,
      user.organizationId,
    );
    response.set({
      'Content-Type': asset.mimeType,
      'Content-Disposition': 'inline',
      'Cache-Control': 'private, max-age=300',
      ETag: `"${asset.checksum}"`,
      'X-Content-Type-Options': 'nosniff',
    });
    return new StreamableFile(asset.content);
  }

  @Roles('OWNER')
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.eventService.remove(id, user.organizationId);
  }
}
