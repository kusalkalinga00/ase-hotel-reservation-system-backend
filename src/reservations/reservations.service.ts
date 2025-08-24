import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { MailService } from '../common/mail.service';
import { BillingService } from '../billing/billing.service';

@Injectable()
export class ReservationsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly mailService: MailService,
    private readonly billingService: BillingService,
  ) {}

  async create(createDto: any, userId: string) {
    let roomCategoryId = createDto.roomCategoryId;
    if (!roomCategoryId && createDto.roomType) {
      const category = await this.db.roomCategory.findUnique({
        where: { name: createDto.roomType },
      });
      if (!category) {
        throw new BadRequestException('Invalid room type');
      }
      roomCategoryId = category.id;
    }
    if (!roomCategoryId) {
      throw new BadRequestException('Room category is required');
    }

    const allRooms = await this.db.room.findMany({ where: { roomCategoryId } });

    for (const r of allRooms) {
      const reservations = await this.db.reservation.findMany({
        where: {
          roomId: r.id,
          status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'] },
          checkInDate: { lte: createDto.checkOutDate },
          checkOutDate: { gte: createDto.checkInDate },
        },
      });
    }

    const room = await this.db.room.findFirst({
      where: {
        roomCategoryId: roomCategoryId,
        reservations: {
          none: {
            OR: [
              {
                checkInDate: { lte: createDto.checkOutDate },
                checkOutDate: { gte: createDto.checkInDate },
                status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'] },
              },
            ],
          },
        },
      },
    });

    if (!room)
      throw new ConflictException(
        'No available room of this category for the selected dates',
      );

    const reservation = await this.db.reservation.create({
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
    // Send confirmation email
    const user = await this.db.user.findUnique({ where: { id: userId } });
    if (user?.email) {
      // Format dates to human readable
      const checkIn = new Date(createDto.checkInDate).toLocaleString('en-US', {
        dateStyle: 'long',
        timeStyle: 'short',
      });
      const checkOut = new Date(createDto.checkOutDate).toLocaleString(
        'en-US',
        { dateStyle: 'long', timeStyle: 'short' },
      );
      await this.mailService.sendMail(
        user.email,
        'Reservation Confirmed',
        `Your reservation from ${checkIn} to ${checkOut} is confirmed.`,
      );
    }
    return reservation;
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
    // Only allow delete if status is CHECKED_OUT
    if (reservation.status !== 'CHECKED_OUT') {
      throw new BadRequestException(
        'Reservation can only be deleted after CHECKED_OUT',
      );
    }
    // Hard delete: actually remove from DB
    return this.db.reservation.delete({ where: { id } });
  }

  async checkIn(createDto: any, customerId: string) {
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
      const user = await this.db.user.findUnique({ where: { id: customerId } });
      if (user?.email) {
        await this.mailService.sendMail(
          user.email,
          'Check-In Successful',
          `You have successfully checked in on ${new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })}.`,
        );
      }
      return this.db.reservation.update({
        where: { id: reservation.id },
        data: { status: 'CHECKED_IN', checkInDate: new Date() },
      });
    }

    const room = await this.db.room.findFirst({
      where: {
        roomCategoryId: createDto.roomCategoryId,
        status: 'AVAILABLE',
      },
    });
    if (!room)
      throw new ConflictException('No available room of this category');

    await this.db.room.update({
      where: { id: room.id },
      data: { status: 'OCCUPIED' },
    });
    const newReservation = await this.db.reservation.create({
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
    const user = await this.db.user.findUnique({ where: { id: customerId } });
    if (user?.email) {
      await this.mailService.sendMail(
        user.email,
        'Check-In Successful',
        `You have successfully checked in on ${new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })}.`,
      );
    }
    return newReservation;
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
    // Send checkout email
    const user = await this.db.user.findUnique({
      where: { id: reservation.customerId },
    });
    if (user?.email) {
      await this.mailService.sendMail(
        user.email,
        'Check-Out Successful',
        `You have successfully checked out on ${new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })}.`,
      );
      // Send billing summary
      const billing = await this.db.billingRecord.findUnique({
        where: { reservationId: id },
      });
      if (billing) {
        await this.mailService.sendMail(
          user.email,
          'Your Billing Summary',
          `Thank you for staying with us.\n\nReservation ID: ${id}\nAmount: $${billing.amount}\nPayment Method: ${billing.paymentMethod}\nDate: ${billing.createdAt.toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })}`,
        );
      }
    }
    return updatedReservation;
  }

  async updateCheckoutDate(
    id: string,
    userId: string,
    checkOutDate: Date,
    userRole?: string,
  ) {
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
    // Basic sanity checks
    if (!(checkOutDate instanceof Date) || isNaN(checkOutDate.getTime())) {
      throw new BadRequestException('Invalid checkOutDate');
    }
    if (new Date(checkOutDate) <= new Date(reservation.checkInDate)) {
      throw new BadRequestException(
        'checkOutDate must be after the checkInDate',
      );
    }
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
        await this.mailService.sendMail(
          user.email,
          'Check-In Successful',
          `You have successfully checked in on ${new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })}.`,
        );
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
      throw new ConflictException('No available room of this category');
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
      await this.mailService.sendMail(
        user.email,
        'Check-In Successful',
        `You have successfully checked in on ${new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })}.`,
      );
      return updatedReservation;
    } else {
      return { message: 'No pending reservation found for this customer.' };
    }
  }

  async manualCheckIn(dto: any) {
    let user = await this.db.user.findUnique({ where: { email: dto.email } });

    if (!user) {
      user = await this.db.user.create({
        data: {
          email: dto.email,
          password: '',
          role: 'CUSTOMER',
          name: dto.name || dto.email.split('@')[0],
        },
      });
    }

    let roomCategoryId = dto.roomCategoryId;
    if (!roomCategoryId && dto.roomType) {
      const category = await this.db.roomCategory.findUnique({
        where: { name: dto.roomType },
      });
      if (!category) {
        throw new BadRequestException('Invalid room type');
      }
      roomCategoryId = category.id;
    }

    if (!roomCategoryId || dto.checkOutDate == null || dto.occupants == null) {
      throw new BadRequestException(
        'Missing required fields: roomCategoryId, checkOutDate, occupants',
      );
    }

    const room = await this.db.room.findFirst({
      where: {
        roomCategoryId: roomCategoryId,
        reservations: {
          none: {
            OR: [
              {
                checkInDate: { lte: dto.checkOutDate },
                checkOutDate: { gte: new Date() },
                status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'] },
              },
            ],
          },
        },
      },
    });

    if (!room)
      throw new ConflictException(
        'No available room of this category for the selected dates',
      );

    await this.db.room.update({
      where: { id: room.id },
      data: { status: 'OCCUPIED' },
    });

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
    // Send check-in email
    const dbUser = await this.db.user.findUnique({
      where: { id: reservation.customerId },
    });
    if (dbUser?.email) {
      await this.mailService.sendMail(
        dbUser.email,
        'Check-In Successful',
        `You have successfully checked in on ${new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })}.`,
      );
    }
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

    // Send email to travel company user
    const user = await this.db.user.findUnique({ where: { id: userId } });
    if (user?.email) {
      const checkIn = new Date(body.checkInDate).toLocaleString('en-US', {
        dateStyle: 'long',
        timeStyle: 'short',
      });
      const checkOut = new Date(body.checkOutDate).toLocaleString('en-US', {
        dateStyle: 'long',
        timeStyle: 'short',
      });
      await this.mailService.sendMail(
        user.email,
        'Travel Company Reservation Submitted',
        `Your group reservation has been submitted and is awaiting approval from Saltbay.\n\nReservation Details:\nReservation ID: ${reservation.id}\nRoom Type: ${body.roomType}\nNumber of Rooms: ${body.numberOfRooms}\nCheck-In: ${checkIn}\nCheck-Out: ${checkOut}\nOccupants per Room: ${body.occupants}\n\nYou will receive a confirmation once approved by Saltbay.`,
      );
    }

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
    const roomType = await this.db.roomCategory.findFirst({
      where: {
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
    for (const room of availableRooms) {
      await this.db.room.update({
        where: { id: room.id },
        data: { status: 'RESERVED' },
      });
    }
    const updatedReservation = await this.db.reservation.update({
      where: { id },
      data: {
        roomId: availableRooms[0].id,
        status: 'CONFIRMED',
      },
      include: { customer: true },
    });

    // Calculate bill and send confirmation email
    const pricePerNight = roomType.price;
    const nights = Math.ceil(
      (new Date(reservation.checkOutDate).getTime() -
        new Date(reservation.checkInDate).getTime()) /
        (1000 * 60 * 60 * 24),
    );
    const totalAmount = pricePerNight * nights * reservation.numberOfRooms;
    const discountAmount = totalAmount * 0.1; // 10% discount
    const finalAmount = totalAmount - discountAmount;

    // Create billing record for travel company reservation
    await this.billingService.create({
      reservationId: id,
      amount: finalAmount,
      paymentMethod: 'Travel Company Account', // Appropriate payment method for travel companies
    });

    // Send confirmation email to travel company
    if (updatedReservation.customer?.email) {
      const checkIn = new Date(reservation.checkInDate).toLocaleString(
        'en-US',
        {
          dateStyle: 'long',
          timeStyle: 'short',
        },
      );
      const checkOut = new Date(reservation.checkOutDate).toLocaleString(
        'en-US',
        {
          dateStyle: 'long',
          timeStyle: 'short',
        },
      );

      await this.mailService.sendMail(
        updatedReservation.customer.email,
        'Travel Company Reservation Confirmed by Saltbay',
        `Your group reservation has been CONFIRMED by Saltbay!\n\nReservation Details:\nReservation ID: ${id}\nRoom Type: ${roomType.name}\nNumber of Rooms: ${reservation.numberOfRooms}\nCheck-In: ${checkIn}\nCheck-Out: ${checkOut}\nOccupants per Room: ${reservation.occupants}\nNights: ${nights}\n\nBilling Details:\nPrice per Room per Night: $${pricePerNight}\nSubtotal: $${totalAmount.toFixed(2)}\nDiscount (10%): -$${discountAmount.toFixed(2)}\nFinal Amount: $${finalAmount.toFixed(2)}\n\nAssigned Room Numbers: ${availableRooms.map((r) => r.number).join(', ')}\n\nThank you for choosing Saltbay!`,
      );
    }

    return {
      message:
        'Travel company reservation confirmed and rooms assigned automatically.',
      assignedRoomIds: availableRooms.map((r) => r.id),
      billing: {
        pricePerNight,
        nights,
        subtotal: totalAmount,
        discount: discountAmount,
        finalAmount,
      },
    };
  }

  async cancelTravelCompanyReservation(id: string) {
    const reservation = await this.db.reservation.findUnique({
      where: { id },
      include: { customer: true },
    });
    if (!reservation) throw new NotFoundException('Reservation not found');

    if (
      reservation.status === 'CONFIRMED' &&
      reservation.numberOfRooms &&
      reservation.numberOfRooms > 1
    ) {
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

    // Send cancellation email to travel company
    if (reservation.customer?.email) {
      const checkIn = new Date(reservation.checkInDate).toLocaleString(
        'en-US',
        {
          dateStyle: 'long',
          timeStyle: 'short',
        },
      );
      const checkOut = new Date(reservation.checkOutDate).toLocaleString(
        'en-US',
        {
          dateStyle: 'long',
          timeStyle: 'short',
        },
      );

      await this.mailService.sendMail(
        reservation.customer.email,
        'Travel Company Reservation Cancelled',
        `Your group reservation has been CANCELLED.\n\nReservation Details:\nReservation ID: ${id}\nNumber of Rooms: ${reservation.numberOfRooms}\nCheck-In: ${checkIn}\nCheck-Out: ${checkOut}\nOccupants per Room: ${reservation.occupants}\n\nIf you have any questions or need to make a new reservation, please contact Saltbay.\n\nThank you for your understanding.`,
      );
    }

    return { message: 'Travel company reservation cancelled.' };
  }
}
