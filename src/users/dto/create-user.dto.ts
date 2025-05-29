import { IsEmail, IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsEnum(['CUSTOMER', 'MANAGER', 'CLERK'], {
    message: 'Valid role reuired.',
  })
  role: 'CUSTOMER' | 'MANAGER' | 'CLERK';
}
