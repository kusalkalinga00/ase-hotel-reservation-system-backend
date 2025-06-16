import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRoomDto {
  @ApiProperty({ example: '101', description: 'Room number (unique)' })
  number: string;

  @ApiProperty({
    example: 'room-category-uuid',
    description: 'Room Category ID (UUID)',
  })
  roomCategoryId: string;

  @ApiPropertyOptional({
    example: 'AVAILABLE',
    description: 'Room status (AVAILABLE, OCCUPIED, MAINTENANCE, RESERVED)',
  })
  status?: string;
}
