import { Module } from '@nestjs/common';
import { CustomerController } from './customer.controller';
import { CustomerService } from './customer.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CheckoutConsentModule } from '../checkout-consent/checkout-consent.module';

@Module({
  imports: [PrismaModule, CheckoutConsentModule],
  controllers: [CustomerController],
  providers: [CustomerService],
})
export class CustomerModule {}
