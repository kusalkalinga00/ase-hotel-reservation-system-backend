import { ApiProperty } from '@nestjs/swagger';

export class RegisterAuthDto {
  @ApiProperty()
  email: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  password: string;
}
