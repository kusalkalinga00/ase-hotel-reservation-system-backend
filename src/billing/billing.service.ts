import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class BillingService {
  constructor(private readonly db: DatabaseService) {}

  async create(dto: { reservationId: string; amount: number; paymentMethod: string }) {
    // Check if reservation exists
    const reservation = await this.db.reservation.findUnique({ where: { id: dto.reservationId } });
    if (!reservation) throw new NotFoundException('Reservation not found');
    // Check if billing already exists for this reservation
    const existing = await this.db.billingRecord.findUnique({ where: { reservationId: dto.reservationId } });
    if (existing) throw new BadRequestException('Billing already exists for this reservation');
    // Create billing record
    return this.db.billingRecord.create({
      data: {
        reservationId: dto.reservationId,
        amount: dto.amount,
        paymentMethod: dto.paymentMethod as any, // Cast to enum
      },
    });
  }

  async getById(id: string) {
    const billing = await this.db.billingRecord.findUnique({
      where: { id },
      include: { reservation: true },
    });
    if (!billing) throw new NotFoundException('Billing record not found');
    return billing;
  }

  async getAll() {
    return this.db.billingRecord.findMany({ include: { reservation: true } });
  }

  async getByReservationId(reservationId: string) {
    const billing = await this.db.billingRecord.findUnique({
      where: { reservationId },
      include: { reservation: true },
    });
    if (!billing) throw new NotFoundException('Billing record not found for this reservation');
    return billing;
  }
}
