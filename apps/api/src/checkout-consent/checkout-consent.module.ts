import { Module } from '@nestjs/common';

import { CheckoutConsentService } from './checkout-consent.service';
import { CheckoutConsentController } from './checkout-consent.controller';

@Module({
  controllers: [CheckoutConsentController],
  providers: [CheckoutConsentService],
  exports: [CheckoutConsentService],
})
export class CheckoutConsentModule {}
