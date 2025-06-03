import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { RegisterAuthDto } from './dto/register-auth.dto';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { LoginAuthDto } from './dto/login-auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerAuthDto: RegisterAuthDto) {
    const { email, name, password, role } = registerAuthDto;
    const existingUser = await this.databaseService.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException('email is already registered');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.databaseService.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: role || 'CUSTOMER',
      },
    });
    // Remove password from response
    const { password: _, ...userData } = user;
    // Generate JWT tokens (same as login)
    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    const refreshToken = this.jwtService.sign(
      { sub: user.id },
      { secret: 'your_refresh_secret', expiresIn: '7d' },
    );
    // Store hashed refresh token in DB
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.databaseService.user.update({
      where: { id: user.id },
      data: { refreshToken: hashedRefreshToken },
    });
    return {
      token,
      refreshToken,
      user: userData,
    };
  }

  async login(loginAuthDto: LoginAuthDto) {
    const { email, password } = loginAuthDto;
    const user = await this.databaseService.user.findUnique({
      where: { email },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid)
      throw new UnauthorizedException('Invalid credentials');

    const { password: _, ...userData } = user;
    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    const refreshToken = this.jwtService.sign(
      { sub: user.id },
      { secret: 'your_refresh_secret', expiresIn: '7d' },
    );

    // Store hashed refresh token in DB
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.databaseService.user.update({
      where: { id: user.id },
      data: { refreshToken: hashedRefreshToken },
    });

    return {
      token,
      refreshToken,
      user: userData,
    };
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.databaseService.user.findUnique({
      where: { id: userId },
    });
    if (!user || !user.refreshToken)
      throw new UnauthorizedException('Access Denied');

    const isRefreshTokenValid = await bcrypt.compare(
      refreshToken,
      user.refreshToken,
    );
    if (!isRefreshTokenValid) throw new UnauthorizedException('Access Denied');

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    const newRefreshToken = this.jwtService.sign(
      { sub: user.id },
      { secret: 'your_refresh_secret', expiresIn: '7d' },
    );
    const hashedRefreshToken = await bcrypt.hash(newRefreshToken, 10);
    await this.databaseService.user.update({
      where: { id: user.id },
      data: { refreshToken: hashedRefreshToken },
    });

    return {
      token,
      refreshToken: newRefreshToken,
    };
  }
}
