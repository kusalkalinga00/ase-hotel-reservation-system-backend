import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReservationDto {
  @ApiProperty({
    example: 'STANDARD',
    description: 'Room type (STANDARD, DELUXE, SUITE, RESIDENTIAL_SUITE)',
  })
  roomType: string;

  @ApiProperty({
    example: '2025-06-01T14:00:00.000Z',
    description: 'Check-in date (ISO 8601 string)',
  })
  checkInDate: Date;

  @ApiProperty({
    example: '2025-06-05T12:00:00.000Z',
    description: 'Check-out date (ISO 8601 string)',
  })
  checkOutDate: Date;

  @ApiProperty({ example: 2, description: 'Number of occupants' })
  occupants: number;

  @ApiPropertyOptional({
    example: '4111111111111111',
    description: 'Credit card number (optional)',
  })
  creditCard?: string;

  @ApiPropertyOptional({
    example: '12/27',
    description: 'Credit card expiry (optional, MM/YY or MM/YYYY)',
  })
  creditCardExpiry?: string;

  @ApiPropertyOptional({
    example: '123',
    description: 'Credit card CVV (optional)',
  })
  creditCardCVV?: string;
}

export class CheckInDto {
  @ApiProperty({
    example: 'customer@example.com',
    description: 'Customer email for clerk check-in',
  })
  email: string; // Clerk will pass customer email instead of customerId

  @ApiPropertyOptional({
    example: 'STANDARD',
    description: 'Room type (STANDARD, DELUXE, SUITE, RESIDENTIAL_SUITE)',
  })
  roomType?: string;

  @ApiPropertyOptional({
    example: '2025-06-01T14:00:00.000Z',
    description: 'Check-in date (ISO 8601 string)',
  })
  checkInDate?: Date;

  @ApiPropertyOptional({
    example: '2025-06-05T12:00:00.000Z',
    description: 'Check-out date (ISO 8601 string)',
  })
  checkOutDate?: Date;

  @ApiPropertyOptional({ example: 2, description: 'Number of occupants' })
  occupants?: number;

  @ApiPropertyOptional({
    example: '4111111111111111',
    description: 'Credit card number (optional)',
  })
  creditCard?: string;

  @ApiPropertyOptional({
    example: '12/27',
    description: 'Credit card expiry (optional, MM/YY or MM/YYYY)',
  })
  creditCardExpiry?: string;

  @ApiPropertyOptional({
    example: '123',
    description: 'Credit card CVV (optional)',
  })
  creditCardCVV?: string;
}
