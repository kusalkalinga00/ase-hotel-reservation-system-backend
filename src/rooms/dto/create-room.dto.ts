import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRoomDto {
  @ApiProperty({ example: '101', description: 'Room number (unique)' })
  number: string;

  @ApiProperty({
    example: 'STANDARD',
    description: 'Room type (STANDARD, DELUXE, SUITE, RESIDENTIAL_SUITE)',
  })
  type: string;

  @ApiProperty({ example: 100.0, description: 'Room rate' })
  rate: number;

  @ApiPropertyOptional({
    example: 'AVAILABLE',
    description: 'Room status (AVAILABLE, OCCUPIED, MAINTENANCE, RESERVED)',
  })
  status?: string;
}
