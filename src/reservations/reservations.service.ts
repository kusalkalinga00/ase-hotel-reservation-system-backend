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
}
