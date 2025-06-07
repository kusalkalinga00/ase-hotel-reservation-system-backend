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
import { CheckInDto } from './dto/create-reservation.dto';
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
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';

@ApiTags('Reservations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  // CUSTOMER ENDPOINTS
  @Post()
  @Roles('CUSTOMER')
  @ApiOperation({ summary: 'Create a new reservation' })
  @ApiBody({ type: CreateReservationDto })
  @ApiResponse({ status: 201, description: 'Reservation created.' })
  create(@Request() req, @Body() dto: CreateReservationDto) {
    return this.reservationsService.create(dto, req.user.userId);
  }

  @Get('my')
  @Roles('CUSTOMER')
  @ApiOperation({ summary: 'List all reservations for the logged-in customer' })
  @ApiResponse({ status: 200, description: 'List of reservations.' })
  findMy(@Request() req) {
    return this.reservationsService.findMyReservations(req.user.userId);
  }

  @Patch(':id')
  @Roles('CUSTOMER', 'CLERK')
  @ApiOperation({ summary: 'Update a reservation' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateReservationDto })
  @ApiResponse({ status: 200, description: 'Reservation updated.' })
  update(
    @Param('id') id: string,
    @Request() req,
    @Body() dto: UpdateReservationDto,
  ) {
    return this.reservationsService.update(
      id,
      req.user.userId,
      req.user.role,
      dto,
    );
  }

  @Delete(':id')
  @Roles('CUSTOMER', 'CLERK')
  @ApiOperation({ summary: 'Cancel a reservation' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Reservation cancelled.' })
  remove(@Param('id') id: string, @Request() req) {
    return this.reservationsService.remove(id, req.user.userId, req.user.role);
  }

  // CLERK ENDPOINTS
  @Post('/checkin/email')
  @Roles('CLERK', 'MANAGER')
  @ApiOperation({
    summary:
      'Check in a customer with email (checks for pending reservation and checks in if found)',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'customer@example.com' },
      },
      required: ['email'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Customer checked in if pending reservation exists.',
  })
  async checkInWithEmail(@Body() body: { email: string }) {
    return this.reservationsService.checkInWithEmail(body.email);
  }

  @Post('/checkin/manual')
  @Roles('CLERK', 'MANAGER')
  @ApiOperation({
    summary:
      'Check in a customer without prior reservation (creates and checks in)',
  })
  @ApiBody({ type: CheckInDto })
  @ApiResponse({
    status: 200,
    description: 'Customer checked in with new reservation.',
  })
  async manualCheckIn(@Body() dto: CheckInDto) {
    return this.reservationsService.manualCheckIn(dto);
  }

  @Patch(':id/checkout')
  @Roles('CLERK', 'MANAGER')
  @ApiOperation({ summary: 'Check out a customer' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Customer checked out.' })
  checkout(@Param('id') id: string, @Request() req) {
    return this.reservationsService.checkout(
      id,
      req.user.userId,
      req.user.role,
    );
  }

  @Patch(':id/checkout-date')
  @Roles('CLERK', 'MANAGER')
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

  @Get()
  @Roles('CLERK', 'MANAGER')
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

  @Patch(':id/checkin')
  @Roles('CLERK', 'MANAGER')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    summary: 'Check in a customer by reservation id (clerk/manager only)',
  })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Customer checked in.' })
  async checkInById(@Param('id') id: string, @Request() req) {
    return this.reservationsService.checkInById(id, req.user);
  }

  @Post('travel-company-reservation')
  @Roles('TRAVEL_COMPANY')
  @ApiOperation({
    summary: 'Travel company reserves 3+ rooms (STANDARD, DELUXE, SUITE only)',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        roomType: { type: 'string', enum: ['STANDARD', 'DELUXE', 'SUITE'] },
        checkInDate: {
          type: 'string',
          format: 'date-time',
          example: '2025-06-15T14:00:00.000Z',
        },
        checkOutDate: {
          type: 'string',
          format: 'date-time',
          example: '2025-06-18T12:00:00.000Z',
        },
        occupants: { type: 'number', example: 2 },
        numberOfRooms: { type: 'number', minimum: 3, example: 3 },
      },
      required: [
        'roomType',
        'checkInDate',
        'checkOutDate',
        'occupants',
        'numberOfRooms',
      ],
    },
  })
  @ApiResponse({
    status: 201,
    description:
      'Travel company reservation(s) created. Awaiting clerk confirmation.',
  })
  async travelCompanyReservation(@Request() req, @Body() body: any) {
    return this.reservationsService.travelCompanyReservation(
      req.user.userId,
      body,
    );
  }

  @Get('travel-company')
  @Roles('CLERK', 'MANAGER')
  @ApiOperation({
    summary: 'List all travel company reservations (group bookings)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of travel company reservations.',
  })
  async getTravelCompanyReservations() {
    return this.reservationsService.getTravelCompanyReservations();
  }

  @Patch('travel-company/:id/confirm')
  @Roles('CLERK', 'MANAGER')
  @ApiOperation({
    summary:
      'Confirm a travel company reservation (assign rooms and set status to CONFIRMED)',
  })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({
    status: 200,
    description: 'Travel company reservation confirmed.',
  })
  async confirmTravelCompanyReservation(
    @Param('id') id: string,
    @Body() body: { roomIds: string[] }, // keep for compatibility, but not used
  ) {
    return this.reservationsService.confirmTravelCompanyReservation(id);
  }

  @Patch('travel-company/:id/cancel')
  @Roles('CLERK', 'MANAGER')
  @ApiOperation({ summary: 'Cancel a travel company reservation' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({
    status: 200,
    description: 'Travel company reservation cancelled.',
  })
  async cancelTravelCompanyReservation(@Param('id') id: string) {
    return this.reservationsService.cancelTravelCompanyReservation(id);
  }
}
