import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles/roles.guard';
import { CreateTicketTypeDto } from './dto/create-ticket-type.dto';
import { ListTicketTypesQueryDto } from './dto/list-ticket-types-query.dto';
import { TicketTypeService } from './ticket-type.service';
import { FileAssetService } from '../file-asset/file-asset.service';
import type { BrandingImageUpload } from '../file-asset/file-asset.types';
import { UploadCatalogueImageDto } from '../file-asset/dto/upload-catalogue-image.dto';
import { UpdateTicketTypePresentationDto } from './dto/update-ticket-type-presentation.dto';
import { UpdateTicketTypeAgePolicyDto } from './dto/update-ticket-type-age-policy.dto';

interface AuthenticatedUser {
  organizationId: string;
  userId: string;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ticket-type')
export class TicketTypeController {
  constructor(
    private readonly ticketTypeService: TicketTypeService,
    private readonly fileAssetService: FileAssetService,
  ) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListTicketTypesQueryDto,
  ) {
    return this.ticketTypeService.findAll(user.organizationId, query.eventId);
  }

  @Roles('OWNER')
  @Post(':id/image')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    }),
  )
  uploadImage(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() data: UploadCatalogueImageDto,
    @UploadedFile() file: BrandingImageUpload,
  ) {
    return this.fileAssetService.createCatalogueAsset({
      target: 'TICKET_TYPE',
      targetId: id,
      organizationId: user.organizationId,
      userId: user.userId,
      displayName: data.displayName,
      file,
    });
  }

  @Get(':id/image/:assetId')
  async getImage(
    @Param('id') id: string,
    @Param('assetId') assetId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) response: Response,
  ) {
    const asset = await this.fileAssetService.getCatalogueAsset(
      'TICKET_TYPE',
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
  @Delete(':id/image')
  removeImage(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.fileAssetService.removeCatalogueAsset(
      'TICKET_TYPE',
      id,
      user.organizationId,
    );
  }

  @Roles('OWNER')
  @Post()
  create(
    @Body() data: CreateTicketTypeDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ticketTypeService.create(user.organizationId, data);
  }

  @Roles('OWNER')
  @Patch(':id/presentation')
  updatePresentation(
    @Param('id') id: string,
    @Body() data: UpdateTicketTypePresentationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ticketTypeService.updatePresentation(
      user.organizationId,
      id,
      data,
    );
  }

  @Roles('OWNER')
  @Patch(':id/age-policy')
  updateAgePolicy(
    @Param('id') id: string,
    @Body() data: UpdateTicketTypeAgePolicyDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ticketTypeService.updateAgePolicy(
      user.organizationId,
      id,
      data,
    );
  }
}
