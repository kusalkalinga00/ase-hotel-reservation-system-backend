import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Response } from 'express';
import * as PDFDocument from 'pdfkit';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('occupancy')
  @Roles('MANAGER')
  @ApiOperation({
    summary: 'View hotel occupancy for present/past/future dates',
  })
  @ApiQuery({
    name: 'date',
    required: false,
    description: 'Date to view occupancy (ISO 8601, defaults to today)',
    example: '2025-06-01',
  })
  @ApiResponse({ status: 200, description: 'Hotel occupancy report.' })
  getOccupancy(@Query('date') date?: string) {
    return this.reportsService.getOccupancy(date);
  }

  @Get('revenue')
  @Roles('MANAGER')
  @ApiOperation({ summary: 'View financial/room revenue information' })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Start date (ISO 8601)',
    example: '2025-06-01',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date (ISO 8601)',
    example: '2025-06-30',
  })
  @ApiResponse({ status: 200, description: 'Hotel revenue report.' })
  getRevenue(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getRevenue(startDate, endDate);
  }

  @Get('no-shows')
  @Roles('MANAGER')
  @ApiOperation({ summary: 'View no-show report' })
  @ApiQuery({
    name: 'date',
    required: false,
    description: 'Date to view no-shows (ISO 8601, defaults to today)',
    example: '2025-06-01',
  })
  @ApiResponse({ status: 200, description: 'No-show report.' })
  getNoShows(@Query('date') date?: string) {
    return this.reportsService.getNoShows(date);
  }

  @Get('manager-summary')
  @Roles('MANAGER')
  @ApiOperation({
    summary: 'Manager summary: daily/monthly stats, room status, and revenue',
  })
  @ApiQuery({
    name: 'period',
    required: false,
    description: 'Period: daily or monthly (default: daily)',
    example: 'daily',
  })
  @ApiQuery({
    name: 'date',
    required: false,
    description:
      'Date (ISO 8601, default: today for daily, first of month for monthly)',
    example: '2025-06-08',
  })
  @ApiResponse({ status: 200, description: 'Manager summary report.' })
  async getManagerSummary(
    @Query('period') period?: string,
    @Query('date') date?: string,
  ) {
    return this.reportsService.getManagerSummary(period, date);
  }

  @Get('manager-summary/pdf')
  @Roles('MANAGER')
  @ApiOperation({ summary: 'Download manager summary report as PDF' })
  @ApiQuery({
    name: 'period',
    required: false,
    description: 'Period: daily or monthly (default: daily)',
    example: 'daily',
  })
  @ApiQuery({
    name: 'date',
    required: false,
    description:
      'Date (ISO 8601, default: today for daily, first of month for monthly)',
    example: '2025-06-08',
  })
  @ApiResponse({ status: 200, description: 'PDF file.' })
  async downloadManagerSummaryPdf(
    @Res() res: Response,
    @Query('period') period?: string,
    @Query('date') date?: string,
  ) {
    const data = await this.reportsService.getManagerSummary(period, date);
    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="manager-summary.pdf"',
    );
    doc.pipe(res);
    doc.fontSize(18).text('Manager Summary Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Period: ${data.period}`);
    doc.text(`Start Date: ${data.startDate}`);
    doc.text(`End Date: ${data.endDate}`);
    doc.moveDown();
    doc.text(`Total Reservations: ${data.totalReservations}`);
    doc.text(`Cancelled Count: ${data.cancelledCount}`);
    doc.text(`Checked In Count: ${data.checkedInCount}`);
    doc.text(`Checked Out Count: ${data.checkedOutCount}`);
    doc.moveDown();
    doc.text(`Total Rooms: ${data.totalRooms}`);
    doc.text('Room Status Counts:');
    for (const [status, count] of Object.entries(data.roomStatusCounts)) {
      doc.text(`  ${status}: ${count}`);
    }
    doc.moveDown();
    doc.text(`Revenue: $${data.revenue}`);
    doc.end();
  }
}
