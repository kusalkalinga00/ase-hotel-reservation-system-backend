import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import { ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RefreshAuthDto } from './dto/refresh-auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiBody({ type: RegisterAuthDto })
  @ApiResponse({
    status: 201,
    description:
      'User registered and logged in. Returns JWT tokens and user info.',
    schema: {
      type: 'object',
      properties: {
        token: { type: 'string', example: 'jwt_access_token' },
        refreshToken: { type: 'string', example: 'jwt_refresh_token' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'uuid' },
            email: { type: 'string', example: 'user@example.com' },
            name: { type: 'string', example: 'John Doe' },
            role: { type: 'string', example: 'CUSTOMER' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  })
  async register(@Body() registerAuthDto: RegisterAuthDto) {
    return this.authService.register(registerAuthDto);
  }

  @Post('login')
  async login(@Body() loginAuthDto: LoginAuthDto) {
    return this.authService.login(loginAuthDto);
  }

  @Post('refresh')
  @ApiBody({ type: RefreshAuthDto })
  async refresh(@Body() body: RefreshAuthDto) {
    return this.authService.refreshTokens(body.userId, body.refreshToken);
  }
}
