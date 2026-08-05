import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { BookingValidationService } from './booking-validation.service';

@Module({
  imports: [PrismaModule],
  providers: [BookingValidationService],
  exports: [BookingValidationService],
})
export class BookingValidationModule {}