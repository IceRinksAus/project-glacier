import { Module } from '@nestjs/common';

import { CheckoutConsentService } from './checkout-consent.service';

@Module({
  providers: [CheckoutConsentService],
  exports: [CheckoutConsentService],
})
export class CheckoutConsentModule {}
