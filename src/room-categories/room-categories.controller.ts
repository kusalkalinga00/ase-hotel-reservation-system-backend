import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { RoomCategoriesService } from './room-categories.service';
import { CreateRoomCategoryDto } from './create-room-category.dto';
import { UpdateRoomCategoryDto } from './update-room-category.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('Room Categories')
@ApiBearerAuth()
@Controller('room-categories')
export class RoomCategoriesController {
  constructor(private readonly roomCategoriesService: RoomCategoriesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MANAGER')
  @ApiOperation({ summary: 'Create a new room category' })
  @ApiBody({
    type: CreateRoomCategoryDto,
    examples: {
      standard: {
        summary: 'Standard Room',
        value: {
          name: 'STANDARD',
          idealFor: 'Solo travelers, couples',
          capacity: 2,
          size: '20sqm',
          bed: 'Queen',
          view: 'City View',
          priceTier: 'Budget',
          price: 100.0,
        },
      },
      deluxe: {
        summary: 'Deluxe Room',
        value: {
          name: 'DELUXE',
          idealFor: 'Couples, business travelers',
          capacity: 2,
          size: '30sqm',
          bed: 'King',
          view: 'Garden View',
          priceTier: 'Mid-Range',
          price: 180.0,
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Room category created.' })
  create(@Body() createRoomCategoryDto: CreateRoomCategoryDto) {
    return this.roomCategoriesService.create(createRoomCategoryDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all room categories' })
  @ApiResponse({ status: 200, description: 'List of room categories.' })
  findAll() {
    return this.roomCategoriesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a room category by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Room category found.' })
  findOne(@Param('id') id: string) {
    return this.roomCategoriesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MANAGER')
  @ApiOperation({ summary: 'Update a room category' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({
    type: UpdateRoomCategoryDto,
    examples: {
      update: {
        summary: 'Update Deluxe Room',
        value: {
          idealFor: 'Families, business travelers',
          capacity: 3,
          price: 200.0,
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Room category updated.' })
  update(
    @Param('id') id: string,
    @Body() updateRoomCategoryDto: UpdateRoomCategoryDto,
  ) {
    return this.roomCategoriesService.update(id, updateRoomCategoryDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MANAGER')
  @ApiOperation({ summary: 'Delete a room category' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Room category deleted.' })
  remove(@Param('id') id: string) {
    return this.roomCategoriesService.remove(id);
  }
}
