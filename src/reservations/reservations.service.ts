import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class ReservationsService {
  constructor(private readonly db: DatabaseService) {}

  async create(createDto: any, userId: string) {
    // Find an available room of the requested type
    const room = await this.db.room.findFirst({
      where: {
        type: createDto.roomType,
        status: 'AVAILABLE',
      },
    });
    if (!room) throw new NotFoundException('No available room of this type');
    // Create reservation
    return this.db.reservation.create({
      data: {
        customerId: userId,
        roomId: room.id,
        checkInDate: createDto.checkInDate,
        checkOutDate: createDto.checkOutDate,
        occupants: createDto.occupants,
        creditCard: createDto.creditCard,
      },
    });
  }

  async findMyReservations(userId: string) {
    return this.db.reservation.findMany({
      where: { customerId: userId },
      include: { room: true },
    });
  }

  async update(id: string, userId: string, updateDto: any) {
    const reservation = await this.db.reservation.findUnique({ where: { id } });
    if (!reservation) throw new NotFoundException('Reservation not found');
    if (reservation.customerId !== userId)
      throw new ForbiddenException('Not your reservation');
    return this.db.reservation.update({
      where: { id },
      data: updateDto,
    });
  }

  async remove(id: string, userId: string) {
    const reservation = await this.db.reservation.findUnique({ where: { id } });
    if (!reservation) throw new NotFoundException('Reservation not found');
    if (reservation.customerId !== userId)
      throw new ForbiddenException('Not your reservation');
    return this.db.reservation.delete({ where: { id } });
  }

  async checkIn(createDto: any, userId: string) {
    // If reservation exists for user and room and is PENDING, set status to CHECKED_IN
    const reservation = await this.db.reservation.findFirst({
      where: {
        customerId: userId,
        roomId: createDto.roomId,
        status: 'PENDING',
      },
    });
    if (reservation) {
      return this.db.reservation.update({
        where: { id: reservation.id },
        data: { status: 'CHECKED_IN' },
      });
    }
    // Otherwise, create a new reservation and set status to CHECKED_IN
    const room = await this.db.room.findFirst({
      where: {
        type: createDto.roomType,
        status: 'AVAILABLE',
      },
    });
    if (!room) throw new NotFoundException('No available room of this type');
    return this.db.reservation.create({
      data: {
        customerId: userId,
        roomId: room.id,
        checkInDate: createDto.checkInDate,
        checkOutDate: createDto.checkOutDate,
        occupants: createDto.occupants,
        creditCard: createDto.creditCard,
        status: 'CHECKED_IN',
      },
    });
  }

  async checkout(id: string, userId: string) {
    const reservation = await this.db.reservation.findUnique({ where: { id } });
    if (!reservation) throw new NotFoundException('Reservation not found');
    if (reservation.customerId !== userId)
      throw new ForbiddenException('Not your reservation');
    return this.db.reservation.update({
      where: { id },
      data: { status: 'CHECKED_OUT' },
    });
  }

  async updateCheckoutDate(id: string, userId: string, checkOutDate: Date) {
    const reservation = await this.db.reservation.findUnique({ where: { id } });
    if (!reservation) throw new NotFoundException('Reservation not found');
    if (reservation.customerId !== userId)
      throw new ForbiddenException('Not your reservation');
    return this.db.reservation.update({
      where: { id },
      data: { checkOutDate },
    });
  }

  async findAll(query: any) {
    const { status, roomType, customerId } = query;
    return this.db.reservation.findMany({
      where: {
        status: status || undefined,
        room: roomType ? { type: roomType } : undefined,
        customerId: customerId || undefined,
      },
      include: { room: true, customer: true },
    });
  }
}
