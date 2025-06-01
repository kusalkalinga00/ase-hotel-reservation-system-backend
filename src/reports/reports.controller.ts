import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';

@ApiTags('Reports')
@UseGuards(RolesGuard)
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
}
