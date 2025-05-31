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

  @Get('my')
  @ApiOperation({ summary: 'List all reservations for the logged-in customer' })
  @ApiResponse({ status: 200, description: 'List of reservations.' })
  findMy(@Request() req) {
    return this.reservationsService.findMyReservations(req.user.userId);
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

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel a reservation' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Reservation cancelled.' })
  remove(@Param('id') id: string, @Request() req) {
    return this.reservationsService.remove(id, req.user.userId);
  }
}
