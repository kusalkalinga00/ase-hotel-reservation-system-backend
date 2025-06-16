import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateRoomDto {
  @ApiPropertyOptional({ example: '101', description: 'Room number (unique)' })
  number?: string;

  @ApiPropertyOptional({
    example: 'room-category-uuid',
    description: 'Room Category ID (UUID)',
  })
  roomCategoryId?: string;

  @ApiPropertyOptional({
    example: 'AVAILABLE',
    description: 'Room status (AVAILABLE, OCCUPIED, MAINTENANCE, RESERVED)',
  })
  status?: string;
}
