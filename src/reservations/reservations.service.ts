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

  async update(id: string, userId: string, userRole: string, updateDto: any) {
    const reservation = await this.db.reservation.findUnique({ where: { id } });
    if (!reservation) throw new NotFoundException('Reservation not found');
    if (userRole === 'CUSTOMER' && reservation.customerId !== userId)
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

  async remove(id: string, userId: string, userRole?: string) {
    const reservation = await this.db.reservation.findUnique({ where: { id } });
    if (!reservation) throw new NotFoundException('Reservation not found');
    // Only restrict customers to their own reservations
    if (userRole === 'CUSTOMER' && reservation.customerId !== userId) {
      throw new ForbiddenException('Not your reservation');
    }
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
        data: { status: 'CHECKED_IN', checkInDate: new Date() },
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
        checkInDate: new Date(),
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
    const reservations = await this.db.reservation.findMany({
      where: {
        status: status || undefined,
        room: roomCategoryId ? { roomCategoryId } : undefined,
        customerId: customerId || undefined,
      },
      include: {
        room: {
          include: {
            roomCategory: {
              select: { price: true },
            },
          },
        },
        customer: true,
      },
    });
    // Map to add roomRate at top level and remove roomCategory object
    return reservations.map((r) => ({
      ...r,
      room: r.room
        ? {
            ...r.room,
            roomRate: r.room.roomCategory?.price,
            roomCategory: undefined,
          }
        : null,
    }));
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
          data: { status: 'CHECKED_IN', checkInDate: new Date() },
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
        checkInDate: new Date(),
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
        data: { status: 'CHECKED_IN', checkInDate: new Date() },
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
        checkInDate: new Date(),
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
        'Reservation is already checked in or cancelled',
      );
    }
    // Set reservation status to CHECKED_IN
    const updatedReservation = await this.db.reservation.update({
      where: { id },
      data: { status: 'CHECKED_IN', checkInDate: new Date() },
    });
    // Set room status to OCCUPIED
    await this.db.room.update({
      where: { id: reservation.roomId },
      data: { status: 'OCCUPIED' },
    });
    return updatedReservation;
  }

  async travelCompanyReservation(userId: string, body: any) {
    const allowedTypes = ['STANDARD', 'DELUXE', 'SUITE'];
    if (!allowedTypes.includes(body.roomType)) {
      throw new BadRequestException('Only STANDARD, DELUXE, SUITE are allowed');
    }
    if (!body.numberOfRooms || body.numberOfRooms < 3) {
      throw new BadRequestException('Must reserve at least 3 rooms');
    }
    // Find the room category id for the requested type
    const roomCategory = await this.db.roomCategory.findUnique({
      where: { name: body.roomType },
    });
    if (!roomCategory) throw new BadRequestException('Invalid room type');
    // Create a single group reservation
    const reservation = await this.db.reservation.create({
      data: {
        customerId: userId,
        roomId: null, // Will be assigned by clerk on confirmation
        checkInDate: body.checkInDate,
        checkOutDate: body.checkOutDate,
        occupants: body.occupants,
        numberOfRooms: body.numberOfRooms,
        status: 'PENDING',
      },
    });
    return {
      message: 'Reservation created. Awaiting clerk confirmation.',
      reservation,
    };
  }

  async getTravelCompanyReservations() {
    // Only reservations with numberOfRooms set (group bookings)
    return this.db.reservation.findMany({
      where: {
        numberOfRooms: { not: null },
      },
      include: { customer: true, room: true },
    });
  }

  async confirmTravelCompanyReservation(id: string) {
    // Find the reservation
    const reservation = await this.db.reservation.findUnique({ where: { id } });
    if (!reservation) throw new NotFoundException('Reservation not found');
    if (!reservation.numberOfRooms || reservation.numberOfRooms < 1)
      throw new BadRequestException('Not a group reservation');
    // Find the room type from the reservation (via roomCategoryId or roomType logic)
    // For this example, assume all rooms must be of the same type as originally requested
    // We'll use the first available roomCategoryId from the RoomCategory table
    // (You may want to store roomType/roomCategoryId in the reservation for more robust logic)
    // Find available rooms of any type if roomId is null
    const roomType = await this.db.roomCategory.findFirst({
      where: {
        // This assumes you store the type in reservation, e.g. reservation.roomType or similar
        // If not, you may need to extend your model to store roomType/roomCategoryId
        // For now, fallback to STANDARD
        name: 'STANDARD',
      },
    });
    if (!roomType) throw new BadRequestException('Room type not found');
    // Find enough available rooms of this type
    const availableRooms = await this.db.room.findMany({
      where: {
        roomCategoryId: roomType.id,
        status: 'AVAILABLE',
      },
      take: reservation.numberOfRooms,
    });
    if (availableRooms.length < reservation.numberOfRooms) {
      throw new BadRequestException(
        'Not enough available rooms to confirm this reservation',
      );
    }
    // Assign the first room to reservation.roomId, set all rooms to RESERVED
    for (const room of availableRooms) {
      await this.db.room.update({
        where: { id: room.id },
        data: { status: 'RESERVED' },
      });
    }
    await this.db.reservation.update({
      where: { id },
      data: {
        roomId: availableRooms[0].id,
        status: 'CONFIRMED',
      },
    });
    return {
      message:
        'Travel company reservation confirmed and rooms assigned automatically.',
      assignedRoomIds: availableRooms.map((r) => r.id),
    };
  }

  async cancelTravelCompanyReservation(id: string) {
    const reservation = await this.db.reservation.findUnique({ where: { id } });
    if (!reservation) throw new NotFoundException('Reservation not found');
    // If group reservation and was confirmed, set all reserved rooms back to AVAILABLE
    if (
      reservation.status === 'CONFIRMED' &&
      reservation.numberOfRooms &&
      reservation.numberOfRooms > 1
    ) {
      // Find the room type/category from the reservation
      // (Assume you store roomType or roomCategoryId in reservation, or infer from roomId)
      let roomCategoryId = null;
      if (reservation.roomId) {
        const room = await this.db.room.findUnique({
          where: { id: reservation.roomId },
        });
        roomCategoryId = room?.roomCategoryId;
      }
      if (roomCategoryId) {
        // Find all rooms of this category that are RESERVED
        const reservedRooms = await this.db.room.findMany({
          where: {
            roomCategoryId,
            status: 'RESERVED',
          },
          take: reservation.numberOfRooms,
        });
        for (const room of reservedRooms) {
          await this.db.room.update({
            where: { id: room.id },
            data: { status: 'AVAILABLE' },
          });
        }
      }
    } else if (reservation.roomId) {
      // For single-room reservation, just set that room to AVAILABLE
      await this.db.room.update({
        where: { id: reservation.roomId },
        data: { status: 'AVAILABLE' },
      });
    }
    await this.db.reservation.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
    return { message: 'Travel company reservation cancelled.' };
  }
}
