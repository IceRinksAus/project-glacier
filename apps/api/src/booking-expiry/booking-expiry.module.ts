import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';

import { BookingExpiryService } from './booking-expiry.service';

@Module({
  imports: [PrismaModule],
  providers: [BookingExpiryService],
})
export class BookingExpiryModule {}