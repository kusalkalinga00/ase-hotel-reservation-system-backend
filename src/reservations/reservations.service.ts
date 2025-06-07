import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class ReservationsService {
  constructor(private readonly db: DatabaseService) {}

  async create(createDto: any, userId: string) {
    // Find an available room of the requested category
    const room = await this.db.room.findFirst({
      where: {
        roomCategoryId: createDto.roomCategoryId,
        status: 'AVAILABLE',
      },
    });
    if (!room)
      throw new NotFoundException('No available room of this category');
    // Set room status to RESERVED
    await this.db.room.update({
      where: { id: room.id },
      data: { status: 'RESERVED' },
    });
    // Create reservation
    return this.db.reservation.create({
      data: {
        customerId: userId,
        roomId: room.id,
        checkInDate: createDto.checkInDate,
        checkOutDate: createDto.checkOutDate,
        occupants: createDto.occupants,
        creditCard: createDto.creditCard,
        creditCardExpiry: createDto.creditCardExpiry,
        creditCardCVV: createDto.creditCardCVV,
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
    // If status is being set to CANCELLED, set room to AVAILABLE
    if (updateDto.status === 'CANCELLED') {
      await this.db.room.update({
        where: { id: reservation.roomId },
        data: { status: 'AVAILABLE' },
      });
    }
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

  async checkIn(createDto: any, customerId: string) {
    // If reservation exists for customer and room and is PENDING, set status to CHECKED_IN
    const reservation = await this.db.reservation.findFirst({
      where: {
        customerId: customerId,
        roomId: createDto.roomId,
        status: 'PENDING',
      },
    });
    if (reservation) {
      // Set room status to OCCUPIED
      await this.db.room.update({
        where: { id: reservation.roomId },
        data: { status: 'OCCUPIED' },
      });
      return this.db.reservation.update({
        where: { id: reservation.id },
        data: { status: 'CHECKED_IN' },
      });
    }
    // Otherwise, create a new reservation and set status to CHECKED_IN
    const room = await this.db.room.findFirst({
      where: {
        roomCategoryId: createDto.roomCategoryId,
        status: 'AVAILABLE',
      },
    });
    if (!room)
      throw new NotFoundException('No available room of this category');
    // Set room status to OCCUPIED
    await this.db.room.update({
      where: { id: room.id },
      data: { status: 'OCCUPIED' },
    });
    return this.db.reservation.create({
      data: {
        customerId: customerId,
        roomId: room.id,
        checkInDate: createDto.checkInDate,
        checkOutDate: createDto.checkOutDate,
        occupants: createDto.occupants,
        creditCard: createDto.creditCard,
        creditCardExpiry: createDto.creditCardExpiry,
        creditCardCVV: createDto.creditCardCVV,
        status: 'CHECKED_IN',
      },
    });
  }

  async checkout(id: string, userId: string, userRole?: string) {
    const reservation = await this.db.reservation.findUnique({ where: { id } });
    if (!reservation) throw new NotFoundException('Reservation not found');
    // Allow if user is the customer, or if user is CLERK or MANAGER
    if (
      reservation.customerId !== userId &&
      userRole !== 'CLERK' &&
      userRole !== 'MANAGER'
    ) {
      throw new ForbiddenException('Not your reservation');
    }
    const updatedReservation = await this.db.reservation.update({
      where: { id },
      data: { status: 'CHECKED_OUT' },
    });
    // Set room status to AVAILABLE
    await this.db.room.update({
      where: { id: reservation.roomId },
      data: { status: 'AVAILABLE' },
    });
    return updatedReservation;
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
    const { status, roomCategoryId, customerId } = query;
    return this.db.reservation.findMany({
      where: {
        status: status || undefined,
        room: roomCategoryId ? { roomCategoryId } : undefined,
        customerId: customerId || undefined,
      },
      include: { room: true, customer: true },
    });
  }

  async checkInByEmail(createDto: any) {
    // Find the user by email
    const user = await this.db.user.findUnique({
      where: { email: createDto.email },
    });
    if (!user) throw new NotFoundException('Customer not found');

    // If roomId is provided, try to check in to a specific reservation
    if (createDto.roomId) {
      const reservation = await this.db.reservation.findFirst({
        where: {
          customerId: user.id,
          roomId: createDto.roomId,
          status: 'PENDING',
        },
      });
      if (reservation) {
        // Set room status to OCCUPIED
        await this.db.room.update({
          where: { id: reservation.roomId },
          data: { status: 'OCCUPIED' },
        });
        return this.db.reservation.update({
          where: { id: reservation.id },
          data: { status: 'CHECKED_IN' },
        });
      }
    }

    // If only email is provided, check for any pending reservation
    if (
      !createDto.roomCategoryId &&
      !createDto.checkInDate &&
      !createDto.checkOutDate &&
      !createDto.occupants
    ) {
      const pendingReservation = await this.db.reservation.findFirst({
        where: {
          customerId: user.id,
          status: 'PENDING',
        },
      });
      if (pendingReservation) {
        return {
          message:
            'Pending reservation found. Please provide roomId to check in, or provide full details to create a new reservation and check in.',
          reservation: pendingReservation,
        };
      } else {
        return {
          message:
            'No pending reservation found. Please provide roomCategoryId, checkInDate, checkOutDate, and occupants to create a new reservation and check in.',
        };
      }
    }

    // Otherwise, create a new reservation and set status to CHECKED_IN
    if (
      !createDto.roomCategoryId ||
      !createDto.checkInDate ||
      !createDto.checkOutDate ||
      !createDto.occupants
    ) {
      throw new BadRequestException(
        'Missing required fields to create a new reservation: roomCategoryId, checkInDate, checkOutDate, occupants',
      );
    }
    const room = await this.db.room.findFirst({
      where: {
        roomCategoryId: createDto.roomCategoryId,
        status: 'AVAILABLE',
      },
    });
    if (!room)
      throw new NotFoundException('No available room of this category');
    // Set room status to OCCUPIED
    await this.db.room.update({
      where: { id: room.id },
      data: { status: 'OCCUPIED' },
    });
    return this.db.reservation.create({
      data: {
        customerId: user.id,
        roomId: room.id,
        checkInDate: createDto.checkInDate,
        checkOutDate: createDto.checkOutDate,
        occupants: createDto.occupants,
        creditCard: createDto.creditCard,
        creditCardExpiry: createDto.creditCardExpiry,
        creditCardCVV: createDto.creditCardCVV,
        status: 'CHECKED_IN',
      },
    });
  }

  async checkInWithEmail(email: string) {
    // Find the user by email
    const user = await this.db.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundException('Customer not found');
    // Find a pending reservation for this user
    const pendingReservation = await this.db.reservation.findFirst({
      where: {
        customerId: user.id,
        status: 'PENDING',
      },
    });
    if (pendingReservation) {
      // Check in the reservation
      const updatedReservation = await this.db.reservation.update({
        where: { id: pendingReservation.id },
        data: { status: 'CHECKED_IN' },
      });
      // Set room status to OCCUPIED
      await this.db.room.update({
        where: { id: updatedReservation.roomId },
        data: { status: 'OCCUPIED' },
      });
      return updatedReservation;
    } else {
      return { message: 'No pending reservation found for this customer.' };
    }
  }

  async manualCheckIn(dto: any) {
    // Find or create the user by email
    let user = await this.db.user.findUnique({ where: { email: dto.email } });
    if (!user) {
      user = await this.db.user.create({
        data: {
          email: dto.email,
          password: '', // No password for front-desk created users
          role: 'CUSTOMER',
          name: dto.name || dto.email.split('@')[0],
        },
      });
    }
    // Validate required fields
    if (
      !dto.roomCategoryId ||
      !dto.checkInDate ||
      !dto.checkOutDate ||
      !dto.occupants
    ) {
      throw new BadRequestException(
        'Missing required fields: roomCategoryId, checkInDate, checkOutDate, occupants',
      );
    }
    // Find an available room
    const room = await this.db.room.findFirst({
      where: {
        roomCategoryId: dto.roomCategoryId,
        status: 'AVAILABLE',
      },
    });
    if (!room)
      throw new NotFoundException('No available room of this category');
    // Set room status to OCCUPIED
    await this.db.room.update({
      where: { id: room.id },
      data: { status: 'OCCUPIED' },
    });
    // Create and check in the reservation
    const reservation = await this.db.reservation.create({
      data: {
        customerId: user.id,
        roomId: room.id,
        checkInDate: dto.checkInDate,
        checkOutDate: dto.checkOutDate,
        occupants: dto.occupants,
        creditCard: dto.creditCard,
        creditCardExpiry: dto.creditCardExpiry,
        creditCardCVV: dto.creditCardCVV,
        status: 'CHECKED_IN',
      },
    });
    return reservation;
  }

  async checkInById(id: string, user: any) {
    const reservation = await this.db.reservation.findUnique({ where: { id } });
    if (!reservation) throw new NotFoundException('Reservation not found');
    if (reservation.status !== 'PENDING') {
      throw new BadRequestException(
        'Reservation is not pending and cannot be checked in',
      );
    }
    // Set reservation status to CHECKED_IN
    const updatedReservation = await this.db.reservation.update({
      where: { id },
      data: { status: 'CHECKED_IN' },
    });
    // Set room status to OCCUPIED
    await this.db.room.update({
      where: { id: reservation.roomId },
      data: { status: 'OCCUPIED' },
    });
    return updatedReservation;
  }
}
