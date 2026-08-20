import {
  ArrayMinSize,
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

import { CreateParticipantDto } from './create-participant.dto';
import { CreateBookingProductDto } from './create-booking-product.dto';

export class CreateBookingDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  customerId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  eventId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  sessionId: string;

  @IsOptional()
  @IsBoolean()
  flexibleBooking?: boolean;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => CreateParticipantDto)
  participants: CreateParticipantDto[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => CreateBookingProductDto)
  products?: CreateBookingProductDto[];
}
