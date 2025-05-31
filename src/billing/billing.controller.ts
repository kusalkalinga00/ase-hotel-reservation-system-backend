import { Controller, Post, Get, Param, Body, Query } from '@nestjs/common';
import { BillingService } from './billing.service';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';

@ApiTags('Billing')
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post()
  @ApiOperation({ summary: 'Create a billing record for a reservation' })
  @ApiBody({ schema: {
    type: 'object',
    properties: {
      reservationId: { type: 'string', example: 'uuid' },
      amount: { type: 'number', example: 100 },
      paymentMethod: { type: 'string', enum: ['CASH', 'CREDIT_CARD', 'COMPANY'], example: 'CREDIT_CARD' },
    },
    required: ['reservationId', 'amount', 'paymentMethod'],
  }})
  @ApiResponse({ status: 201, description: 'Billing record created.' })
  create(@Body() dto: { reservationId: string; amount: number; paymentMethod: string }) {
    return this.billingService.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a billing record by id' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Billing record.' })
  getById(@Param('id') id: string) {
    return this.billingService.getById(id);
  }

  @Get()
  @ApiOperation({ summary: 'List all billing records' })
  @ApiQuery({ name: 'reservationId', required: false, description: 'Filter by reservationId' })
  @ApiResponse({ status: 200, description: 'List of billing records.' })
  getAll(@Query('reservationId') reservationId?: string) {
    if (reservationId) {
      return this.billingService.getByReservationId(reservationId);
    }
    return this.billingService.getAll();
  }
}
