import { IsInt, IsNotEmpty, IsString, MaxLength, Min } from 'class-validator';

export class CreateBookingProductDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}
