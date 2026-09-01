import { ScheduleModule } from '@nestjs/schedule';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AccessControlModule } from './access-control/access-control.module';
import { AuthModule } from './auth/auth.module';
import { BookingModule } from './booking/booking.module';
import { BookingRescheduleModule } from './booking-reschedule/booking-reschedule.module';
import { BookingValidationModule } from './booking-validation/booking-validation.module';
import { CategoryModule } from './category/category.module';
import { CustomerModule } from './customer/customer.module';
import { EventModule } from './event/event.module';
import { EventGroupModule } from './event-group/event-group.module';
import { FlexibleTicketPolicyModule } from './flexible-ticket-policy/flexible-ticket-policy.module';
import { FlexibleTicketRequestModule } from './flexible-ticket-request/flexible-ticket-request.module';
import { HealthModule } from './health/health.module';
import { OperationalScheduleModule } from './operational-schedule/operational-schedule.module';
import { RequestFailureInterceptor } from './observability/request-failure.interceptor';
import { RequestObservabilityMiddleware } from './observability/request-observability.middleware';
import { OrganizationModule } from './organization/organization.module';
import { PaymentModule } from './payment/payment.module';
import { PosModule } from './pos/pos.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProductModule } from './product/product.module';
import { ProductGroupModule } from './product-group/product-group.module';
import { ProductVariantModule } from './product-variant/product-variant.module';
import { PublicBookingModule } from './public-booking/public-booking.module';
import { RuleModule } from './rule/rule.module';
import { ReportingModule } from './reporting/reporting.module';
import { SessionModule } from './session/session.module';
import { SessionProductModule } from './session-product/session-product.module';
import { StaffScannerModule } from './staff-scanner/staff-scanner.module';
import { TicketModule } from './ticket/ticket.module';
import { TicketAdjustmentModule } from './ticket-adjustment/ticket-adjustment.module';
import { TicketTypeModule } from './ticket-type/ticket-type.module';
import { UserModule } from './user/user.module';
import { WaiverModule } from './waiver/waiver.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AccessControlModule,
    OrganizationModule,
    PrismaModule,
    UserModule,
    EventModule,
    EventGroupModule,
    FlexibleTicketPolicyModule,
    FlexibleTicketRequestModule,
    HealthModule,
    TicketTypeModule,
    CustomerModule,
    BookingModule,
    BookingRescheduleModule,
    SessionModule,
    CategoryModule,
    ProductModule,
    ProductGroupModule,
    ProductVariantModule,
    SessionProductModule,
    StaffScannerModule,
    RuleModule,
    ReportingModule,
    PaymentModule,
    PosModule,
    TicketModule,
    TicketAdjustmentModule,
    AuthModule,
    BookingValidationModule,
    OperationalScheduleModule,
    PublicBookingModule,
    WaiverModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestFailureInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestObservabilityMiddleware).forRoutes('*');
  }
}
