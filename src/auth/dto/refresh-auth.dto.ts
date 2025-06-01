import { ApiProperty } from '@nestjs/swagger';

export class RefreshAuthDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  refreshToken: string;
}
