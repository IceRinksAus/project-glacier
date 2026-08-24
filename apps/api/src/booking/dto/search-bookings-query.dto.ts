import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

const BOOKING_STATUSES = [
  'PENDING',
  'RESERVED',
  'CONFIRMED',
  'CANCELLED',
  'EXPIRED',
] as const;

const PAYMENT_STATUSES = [
  'UNPAID',
  'PENDING',
  'PAID',
  'FAILED',
  'REFUNDED',
] as const;

const SORT_FIELDS = [
  'createdAt',
  'sessionStart',
  'customerName',
  'total',
] as const;

export class SearchBookingsQueryDto {
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string'
      ? value.trim()
      : value,
  )
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  eventId?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  sessionId?: string;

  @IsOptional()
  @IsIn(BOOKING_STATUSES)
  bookingStatus?: (typeof BOOKING_STATUSES)[number];

  @IsOptional()
  @IsIn(PAYMENT_STATUSES)
  paymentStatus?: (typeof PAYMENT_STATUSES)[number];

  @IsOptional()
  @IsIn(SORT_FIELDS)
  sortBy: (typeof SORT_FIELDS)[number] =
    'createdAt';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortDirection: 'asc' | 'desc' =
    'desc';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 25;
}
