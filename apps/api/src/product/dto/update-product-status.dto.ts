import { IsIn } from 'class-validator';

export class UpdateProductStatusDto {
  @IsIn(['DRAFT', 'ACTIVE', 'INACTIVE'])
  status: 'DRAFT' | 'ACTIVE' | 'INACTIVE';
}
