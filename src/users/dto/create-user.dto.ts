export class CreateUserDto {
  name: string;
  email: string;
  role: 'CUSTOMER' | 'MANAGER' | 'CLERK';
}


