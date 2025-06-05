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

    // Get all billing records in the date range, including reservation and room
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
            room: { include: { roomCategory: true } },
          },
        },
      },
    });

    // Calculate total revenue and breakdown by room type
    let total = 0;
    const byRoomType: Record<string, number> = {};
    for (const billing of billings) {
      total += billing.amount;
      const type = billing.reservation.room?.roomCategory?.name ?? 'Unknown';
      byRoomType[type] = (byRoomType[type] || 0) + billing.amount;
    }

    return {
      totalRevenue: total,
      byRoomType,
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
}
