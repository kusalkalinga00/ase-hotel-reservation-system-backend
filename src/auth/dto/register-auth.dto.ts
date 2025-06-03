import { ApiProperty } from '@nestjs/swagger';

export class RegisterAuthDto {
  @ApiProperty()
  email: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  password: string;

  @ApiProperty({
    enum: ['CUSTOMER', 'CLERK', 'MANAGER', 'TRAVEL_COMPANY'],
    required: false,
    default: 'CUSTOMER',
  })
  role?: 'CUSTOMER' | 'CLERK' | 'MANAGER' | 'TRAVEL_COMPANY';
}
