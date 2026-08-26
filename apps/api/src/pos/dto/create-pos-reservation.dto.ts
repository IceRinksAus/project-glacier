import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

import { CreateBookingProductDto } from '../../booking/dto/create-booking-product.dto';
import { CreateParticipantDto } from '../../booking/dto/create-participant.dto';

export class CreatePosReservationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  customerId: string;

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
