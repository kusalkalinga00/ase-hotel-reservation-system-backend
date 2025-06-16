import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateReservationDto {
  @ApiPropertyOptional({
    example: '2025-06-02T14:00:00.000Z',
    description: 'New check-in date (ISO 8601 string)',
  })
  checkInDate?: Date;

  @ApiPropertyOptional({
    example: '2025-06-06T12:00:00.000Z',
    description: 'New check-out date (ISO 8601 string)',
  })
  checkOutDate?: Date;

  @ApiPropertyOptional({
    example: 3,
    description: 'Updated number of occupants',
  })
  occupants?: number;

  @ApiPropertyOptional({
    example: '4111111111111111',
    description: 'Updated credit card number (optional)',
  })
  creditCard?: string;

  @ApiPropertyOptional({
    example: '12/27',
    description: 'Updated credit card expiry (optional, MM/YY or MM/YYYY)',
  })
  creditCardExpiry?: string;

  @ApiPropertyOptional({
    example: '123',
    description: 'Updated credit card CVV (optional)',
  })
  creditCardCVV?: string;

  @ApiPropertyOptional({
    example: 'CONFIRMED',
    description: 'Reservation status (PENDING, CONFIRMED, etc.)',
  })
  status?: string;
}
