import { CheckoutDocumentType } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateCheckoutDocumentDto {
  @IsEnum(CheckoutDocumentType)
  type!: CheckoutDocumentType;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsOptional()
  @IsBoolean()
  testOnly?: boolean;
}
