import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class ReportsService {
  constructor(private readonly db: DatabaseService) {}

  async getOccupancy(date?: string) {
    return {
      message: 'Occupancy report',
      date: date || new Date().toISOString().slice(0, 10),
    };
  }

  async getRevenue(startDate?: string, endDate?: string) {
    // Parse dates or use defaults
    const start =
      startDate !== undefined
        ? new Date(startDate)
        : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date();

    // Get all billing records in the date range, including reservation and room and roomCategory
    const billings = await this.db.billingRecord.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      include: {
        reservation: {
          include: {
            room: {
              include: {
                roomCategory: true,
              },
            },
            customer: true,
          },
        },
      },
    });

    // Calculate total revenue and breakdown by room category name
    let total = 0;
    let travelCompanyTotal = 0;
    const byRoomCategory: Record<string, number> = {};
    const travelCompanyByRoomCategory: Record<string, number> = {};

    for (const billing of billings) {
      total += billing.amount;
      const category =
        billing.reservation.room?.roomCategory?.name ?? 'Unknown';
      byRoomCategory[category] =
        (byRoomCategory[category] || 0) + billing.amount;

      // Check if this is a travel company billing
      if (billing.reservation?.customer?.role === 'TRAVEL_COMPANY') {
        travelCompanyTotal += billing.amount;
        travelCompanyByRoomCategory[category] =
          (travelCompanyByRoomCategory[category] || 0) + billing.amount;
      }
    }

    return {
      totalRevenue: total,
      regularCustomerRevenue: total - travelCompanyTotal,
      travelCompanyRevenue: travelCompanyTotal,
      byRoomCategory,
      travelCompanyByRoomCategory,
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
    };
  }

  async getNoShows(date?: string) {
    // TODO: Implement actual no-show logic
    return {
      message: 'No-show report',
      date: date || new Date().toISOString().slice(0, 10),
    };
  }

  async getManagerSummary(period?: string, date?: string) {
    // Determine date range
    let start: Date, end: Date;
    const now = date ? new Date(date) : new Date();
    if (period === 'monthly') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else {
      // default: daily
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      end = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        23,
        59,
        59,
        999,
      );
    }

    // Reservations (overlapping the period)
    const reservations = await this.db.reservation.findMany({
      where: {
        checkInDate: { lte: end },
        checkOutDate: { gte: start },
      },
      include: {
        customer: true,
      },
    });
    const totalReservations = reservations.length;
    const cancelledCount = reservations.filter(
      (r) => r.status === 'CANCELLED',
    ).length;
    const checkedInCount = reservations.filter(
      (r) => r.status === 'CHECKED_IN',
    ).length;
    const checkedOutCount = reservations.filter(
      (r) => r.status === 'CHECKED_OUT',
    ).length;

    // Travel company specific data
    const travelCompanyReservations = reservations.filter(
      (r) => r.customer?.role === 'TRAVEL_COMPANY',
    );
    const totalTravelCompanyReservations = travelCompanyReservations.length;
    const totalTravelCompanyRooms = travelCompanyReservations.reduce(
      (sum, r) => sum + (r.numberOfRooms || 1),
      0,
    );
    const travelCompanyStatuses = {
      PENDING: travelCompanyReservations.filter((r) => r.status === 'PENDING')
        .length,
      CONFIRMED: travelCompanyReservations.filter(
        (r) => r.status === 'CONFIRMED',
      ).length,
      CANCELLED: travelCompanyReservations.filter(
        (r) => r.status === 'CANCELLED',
      ).length,
      CHECKED_IN: travelCompanyReservations.filter(
        (r) => r.status === 'CHECKED_IN',
      ).length,
      CHECKED_OUT: travelCompanyReservations.filter(
        (r) => r.status === 'CHECKED_OUT',
      ).length,
    };

    // Room status counts
    const rooms = await this.db.room.findMany();
    const totalRooms = rooms.length;
    const roomStatusCounts = {
      AVAILABLE: 0,
      OCCUPIED: 0,
      MAINTENANCE: 0,
      RESERVED: 0,
    };
    for (const room of rooms) {
      if (room.status in roomStatusCounts) roomStatusCounts[room.status]++;
    }

    // Revenue (sum billing records in range)
    const billings = await this.db.billingRecord.findMany({
      where: {
        createdAt: { gte: start, lte: end },
      },
      include: {
        reservation: {
          include: {
            customer: true,
          },
        },
      },
    });
    const totalRevenue = billings.reduce((sum, b) => sum + b.amount, 0);

    // Separate travel company revenue
    const travelCompanyBillings = billings.filter(
      (b) => b.reservation?.customer?.role === 'TRAVEL_COMPANY',
    );
    const travelCompanyRevenue = travelCompanyBillings.reduce(
      (sum, b) => sum + b.amount,
      0,
    );
    const regularCustomerRevenue = totalRevenue - travelCompanyRevenue;

    // Calculate pending amount for confirmed travel company reservations without billing records
    let travelCompanyPendingAmount = 0;
    const confirmedTravelCompanyReservations = travelCompanyReservations.filter(
      (r) => r.status === 'CONFIRMED' && r.numberOfRooms && r.numberOfRooms > 0,
    );

    for (const reservation of confirmedTravelCompanyReservations) {
      // Check if billing record already exists
      const existingBilling = await this.db.billingRecord.findUnique({
        where: { reservationId: reservation.id },
      });

      if (!existingBilling) {
        // Calculate expected billing amount
        const roomCategory = await this.db.roomCategory.findFirst({
          where: { name: 'STANDARD' }, // Travel company reservations are typically STANDARD
        });

        if (roomCategory) {
          const nights = Math.ceil(
            (new Date(reservation.checkOutDate).getTime() -
              new Date(reservation.checkInDate).getTime()) /
              (1000 * 60 * 60 * 24),
          );
          const totalAmount =
            roomCategory.price * nights * reservation.numberOfRooms;
          const discountAmount = totalAmount * 0.1; // 10% discount
          const finalAmount = totalAmount - discountAmount;
          travelCompanyPendingAmount += finalAmount;
        }
      }
    }

    return {
      period: period || 'daily',
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
      totalReservations,
      cancelledCount,
      checkedInCount,
      checkedOutCount,
      totalRooms,
      roomStatusCounts,
      totalRevenue,
      regularCustomerRevenue,
      travelCompanyData: {
        totalReservations: totalTravelCompanyReservations,
        totalRooms: totalTravelCompanyRooms,
        revenue: travelCompanyRevenue,
        pendingAmount: travelCompanyPendingAmount,
        statusBreakdown: travelCompanyStatuses,
      },
    };
  }
}
