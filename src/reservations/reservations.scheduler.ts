import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DatabaseService } from '../database/database.service';
import { ReservationsService } from './reservations.service';

@Injectable()
export class ReservationsScheduler {
  private readonly logger = new Logger(ReservationsScheduler.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly reservationsService: ReservationsService,
  ) {}

  // Runs every day at 7 PM 
  @Cron('0 19 * * *')
  async cancelReservationsMissingCreditCard() {
    this.logger.log(
      'Starting daily cancellation for missing credit card details',
    );
    const result =
      await this.reservationsService.cancelReservationsMissingCreditCard();
    if (result.cancelled === 0) {
      this.logger.log('No reservations to cancel today.');
    } else {
      this.logger.log(
        `Cancelled ${result.cancelled} reservation(s) missing credit card details.`,
      );
    }
  }
}
