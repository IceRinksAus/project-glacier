import {
  OmitType,
  PartialType,
} from '@nestjs/mapped-types';

import { CreateSessionProductDto } from './create-session-product.dto';

export class UpdateSessionProductDto extends PartialType(
  OmitType(
    CreateSessionProductDto,
    ['sessionId', 'productId'] as const,
  ),
) {}