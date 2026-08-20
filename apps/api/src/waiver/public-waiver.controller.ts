import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';

import { CreateWaiverSubmissionDto } from './dto/create-waiver-submission.dto';
import { PublicWaiverService } from './public-waiver.service';

@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
)
@Controller('public/waivers')
export class PublicWaiverController {
  constructor(private readonly publicWaiverService: PublicWaiverService) {}

  @Get('verifications/:verificationToken')
  verify(@Param('verificationToken') verificationToken: string) {
    return this.publicWaiverService.verify(verificationToken);
  }

  @Get(':publicSlug')
  findPublishedWaiver(@Param('publicSlug') publicSlug: string) {
    return this.publicWaiverService.findPublishedWaiver(publicSlug);
  }

  @Post(':publicSlug/submissions')
  submit(
    @Param('publicSlug') publicSlug: string,
    @Body() data: CreateWaiverSubmissionDto,
  ) {
    return this.publicWaiverService.submit(publicSlug, data);
  }
}
