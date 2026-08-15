import { ScheduleModule } from '@nestjs/schedule';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { BookingModule } from './booking/booking.module';
import { BookingValidationModule } from './booking-validation/booking-validation.module';
import { CategoryModule } from './category/category.module';
import { CustomerModule } from './customer/customer.module';
import { EventModule } from './event/event.module';
import { OperationalScheduleModule } from './operational-schedule/operational-schedule.module';
import { OrganizationModule } from './organization/organization.module';
import { PaymentModule } from './payment/payment.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProductModule } from './product/product.module';
import { ProductVariantModule } from './product-variant/product-variant.module';
import { PublicBookingModule } from './public-booking/public-booking.module';
import { RuleModule } from './rule/rule.module';
import { SessionModule } from './session/session.module';
import { SessionProductModule } from './session-product/session-product.module';
import { TicketModule } from './ticket/ticket.module';
import { TicketTypeModule } from './ticket-type/ticket-type.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    OrganizationModule,
    PrismaModule,
    UserModule,
    EventModule,
    TicketTypeModule,
    CustomerModule,
    BookingModule,
    SessionModule,
    CategoryModule,
    ProductModule,
    ProductVariantModule,
    SessionProductModule,
    RuleModule,
    PaymentModule,
    TicketModule,
    AuthModule,
    BookingValidationModule,
    OperationalScheduleModule,
    PublicBookingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}