import {
  ArrayMinSize,
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  Max,
  ArrayUnique,
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

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  flexibleTicketPolicyId?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(49, { each: true })
  flexibleTicketParticipantIndexes?: number[];

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
