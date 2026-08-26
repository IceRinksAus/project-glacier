import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class QuoteFlexibleTicketSelectionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  ticketTypeId: string;

  @IsInt()
  @Min(1)
  @Max(50)
  quantity: number;
}

export class QuoteFlexibleTicketDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  sessionId: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => QuoteFlexibleTicketSelectionDto)
  tickets: QuoteFlexibleTicketSelectionDto[];
}
