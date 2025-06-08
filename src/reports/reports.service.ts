import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class ReportsService {
  constructor(private readonly db: DatabaseService) {}

  async getOccupancy(date?: string) {
    // TODO: Implement actual occupancy logic
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
          },
        },
      },
    });

    // Calculate total revenue and breakdown by room category name
    let total = 0;
    const byRoomCategory: Record<string, number> = {};
    for (const billing of billings) {
      total += billing.amount;
      const category =
        billing.reservation.room?.roomCategory?.name ?? 'Unknown';
      byRoomCategory[category] =
        (byRoomCategory[category] || 0) + billing.amount;
    }

    return {
      totalRevenue: total,
      byRoomCategory,
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
    });
    const revenue = billings.reduce((sum, b) => sum + b.amount, 0);

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
      revenue,
    };
  }
}
