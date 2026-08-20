import { OmitType, PartialType } from '@nestjs/mapped-types';

import { CreateRuleDto } from './create-rule.dto';

export class UpdateRuleDto extends PartialType(
  OmitType(CreateRuleDto, ['eventId'] as const),
) {}
