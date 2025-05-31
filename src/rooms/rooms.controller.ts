import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  UseGuards,
} from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('Rooms')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new room' })
  @ApiBody({ type: CreateRoomDto })
  @ApiResponse({ status: 201, description: 'Room created.' })
  create(@Body() dto: CreateRoomDto) {
    return this.roomsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all rooms' })
  @ApiResponse({ status: 200, description: 'List of rooms.' })
  findAll() {
    return this.roomsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a room by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Room found.' })
  @ApiResponse({ status: 404, description: 'Room not found.' })
  findOne(@Param('id') id: string) {
    return this.roomsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a room' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateRoomDto })
  @ApiResponse({ status: 200, description: 'Room updated.' })
  @ApiResponse({ status: 404, description: 'Room not found.' })
  update(@Param('id') id: string, @Body() dto: UpdateRoomDto) {
    return this.roomsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a room' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Room deleted.' })
  @ApiResponse({ status: 404, description: 'Room not found.' })
  remove(@Param('id') id: string) {
    return this.roomsService.remove(id);
  }
}
