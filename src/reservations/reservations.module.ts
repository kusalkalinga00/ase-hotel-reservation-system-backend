import { Module } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { ReservationsController } from './reservations.controller';
import { DatabaseModule } from '../database/database.module';
import { MailModule } from '../common/mail.module';
import { BillingModule } from '../billing/billing.module';
import { BillingService } from '../billing/billing.service';

@Module({
  imports: [DatabaseModule, MailModule, BillingModule],
  controllers: [ReservationsController],
  providers: [ReservationsService, BillingService],
})
export class ReservationsModule {}
