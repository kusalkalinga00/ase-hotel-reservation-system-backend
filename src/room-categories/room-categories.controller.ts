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
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('Room Categories')
@Controller('room-categories')
export class RoomCategoriesController {
  constructor(private readonly roomCategoriesService: RoomCategoriesService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MANAGER', 'CLERK')
  @ApiOperation({ summary: 'Create a new room category' })
  @ApiBody({
    type: CreateRoomCategoryDto,
    examples: {
      standard: {
        summary: 'Standard Room',
        value: {
          name: 'STANDARD',
          description: 'A comfortable room for solo travelers or couples.',
          amenities: ['WiFi', 'TV', 'Air Conditioning'],
          image: 'https://example.com/standard.jpg',
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
          description:
            'Spacious room with premium amenities and a garden view.',
          amenities: ['WiFi', 'TV', 'Air Conditioning', 'Mini Bar', 'Balcony'],
          image: 'https://example.com/deluxe.jpg',
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
  async create(@Body() createRoomCategoryDto: CreateRoomCategoryDto) {
    const data = await this.roomCategoriesService.create(createRoomCategoryDto);
    return { message: 'Room category created successfully', data };
  }

  @Get()
  @ApiOperation({
    summary: 'Get all room categories',
    description: 'Public endpoint. No authentication required.',
  })
  @ApiResponse({ status: 200, description: 'List of room categories.' })
  async findAll() {
    const data = await this.roomCategoriesService.findAll();
    return {
      success: true,
      message: 'Room categories fetched successfully',
      payload: data,
      meta: null,
    };
  }a

  @Get(':id')
  @ApiOperation({
    summary: 'Get a room category by ID',
    description: 'Public endpoint. No authentication required.',
  })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Room category found.' })
  async findOne(@Param('id') id: string) {
    const data = await this.roomCategoriesService.findOne(id);
    return {
      success: true,
      message: 'Room category fetched successfully',
      payload: data,
      meta: null,
    };
  }

  @ApiBearerAuth()
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MANAGER', 'CLERK')
  @ApiOperation({ summary: 'Update a room category' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({
    type: UpdateRoomCategoryDto,
    examples: {
      update: {
        summary: 'Update Deluxe Room',
        value: {
          description: 'Now includes a workspace and free breakfast.',
          amenities: [
            'WiFi',
            'TV',
            'Air Conditioning',
            'Mini Bar',
            'Balcony',
            'Workspace',
            'Free Breakfast',
          ],
          image: 'https://example.com/deluxe-updated.jpg',
          idealFor: 'Families, business travelers',
          capacity: 3,
          price: 200.0,
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Room category updated.' })
  async update(
    @Param('id') id: string,
    @Body() updateRoomCategoryDto: UpdateRoomCategoryDto,
  ) {
    const data = await this.roomCategoriesService.update(
      id,
      updateRoomCategoryDto,
    );
    return { message: 'Room category updated successfully', data };
  }

  @ApiBearerAuth()
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MANAGER', 'CLERK')
  @ApiOperation({ summary: 'Delete a room category' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Room category deleted.' })
  async remove(@Param('id') id: string) {
    const data = await this.roomCategoriesService.remove(id);
    return { message: 'Room category deleted successfully', data };
  }
}
