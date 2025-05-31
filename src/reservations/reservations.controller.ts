import {
  Body,
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('Reservations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new reservation' })
  @ApiBody({ type: CreateReservationDto })
  @ApiResponse({ status: 201, description: 'Reservation created.' })
  create(@Request() req, @Body() dto: CreateReservationDto) {
    return this.reservationsService.create(dto, req.user.userId);
  }

  @Post('/checkin')
  @ApiOperation({
    summary: 'Check in a customer (with or without prior reservation)',
  })
  @ApiBody({ type: CreateReservationDto })
  @ApiResponse({ status: 200, description: 'Customer checked in.' })
  checkIn(@Request() req, @Body() dto: CreateReservationDto) {
    return this.reservationsService.checkIn(dto, req.user.userId);
  }

  @Get('my')
  @ApiOperation({ summary: 'List all reservations for the logged-in customer' })
  @ApiResponse({ status: 200, description: 'List of reservations.' })
  findMy(@Request() req) {
    return this.reservationsService.findMyReservations(req.user.userId);
  }

  @Get()
  @ApiOperation({
    summary: 'List/search all reservations (for desk management)',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by reservation status',
  })
  @ApiQuery({
    name: 'roomType',
    required: false,
    description: 'Filter by room type',
  })
  @ApiQuery({
    name: 'customerId',
    required: false,
    description: 'Filter by customer id',
  })
  @ApiResponse({ status: 200, description: 'List of all reservations.' })
  findAll(@Query() query) {
    return this.reservationsService.findAll(query);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a reservation' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateReservationDto })
  @ApiResponse({ status: 200, description: 'Reservation updated.' })
  update(
    @Param('id') id: string,
    @Request() req,
    @Body() dto: UpdateReservationDto,
  ) {
    return this.reservationsService.update(id, req.user.userId, dto);
  }

  @Patch(':id/checkout')
  @ApiOperation({ summary: 'Check out a customer' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Customer checked out.' })
  checkout(@Param('id') id: string, @Request() req) {
    return this.reservationsService.checkout(id, req.user.userId);
  }

  @Patch(':id/checkout-date')
  @ApiOperation({ summary: 'Change the checkout date for a reservation' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        checkOutDate: {
          type: 'string',
          format: 'date-time',
          example: '2025-06-10T12:00:00.000Z',
        },
      },
      required: ['checkOutDate'],
    },
  })
  @ApiResponse({ status: 200, description: 'Checkout date updated.' })
  updateCheckoutDate(
    @Param('id') id: string,
    @Request() req,
    @Body() body: { checkOutDate: Date },
  ) {
    return this.reservationsService.updateCheckoutDate(
      id,
      req.user.userId,
      body.checkOutDate,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel a reservation' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Reservation cancelled.' })
  remove(@Param('id') id: string, @Request() req) {
    return this.reservationsService.remove(id, req.user.userId);
  }
}
