import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CompletePosPaymentDto {
  @IsIn(['CASH', 'STANDALONE_EFTPOS'])
  method: 'CASH' | 'STANDALONE_EFTPOS';

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1_000_000)
  amount: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  idempotencyKey: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  standaloneReference?: string;
}
