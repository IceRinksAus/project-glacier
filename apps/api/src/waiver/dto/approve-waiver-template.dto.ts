import { IsString, MaxLength, MinLength } from 'class-validator';

export class ApproveWaiverTemplateDto {
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  approvalReference: string;
}
