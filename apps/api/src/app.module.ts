import { ScheduleModule } from '@nestjs/schedule';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OrganizationModule } from './organization/organization.module';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { EventModule } from './event/event.module';
import { TicketTypeModule } from './ticket-type/ticket-type.module';
import { CustomerModule } from './customer/customer.module';
import { BookingModule } from './booking/booking.module';
import { SessionModule } from './session/session.module';
import { CategoryModule } from './category/category.module';
import { ProductModule } from './product/product.module';
import { ProductVariantModule } from './product-variant/product-variant.module';
import { SessionProductModule } from './session-product/session-product.module';
import { RuleModule } from './rule/rule.module';
import { PaymentModule } from './payment/payment.module';
import { TicketModule } from './ticket/ticket.module';
import { AuthModule } from './auth/auth.module';

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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}