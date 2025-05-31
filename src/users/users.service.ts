import { Injectable, ConflictException } from '@nestjs/common';
import { Prisma } from 'generated/prisma';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class UsersService {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(createUserDto: Prisma.UserCreateInput) {
    try {
      return await this.databaseService.user.create({
        data: createUserDto,
      });
    } catch (error) {
      if (
        error.code === 'P2002' &&
        error.meta &&
        error.meta.target &&
        error.meta.target.includes('email')
      ) {
        throw new ConflictException('email is already registered');
      }
      throw error;
    }
  }

  async findAll(role?: 'CUSTOMER' | 'CLERK' | 'MANAGER' | 'TRAVEL_COMPANY') {
    if (role)
      return this.databaseService.user.findMany({
        where: {
          role,
        },
      });

    return this.databaseService.user.findMany();
  }

  async findOne(id: string) {
    return this.databaseService.user.findUnique({
      where: {
        id,
      },
    });
  }

  async update(id: string, updateUserDto: Prisma.UserUpdateInput) {
    return this.databaseService.user.update({
      where: {
        id,
      },
      data: updateUserDto,
    });
  }

  async remove(id: string) {
    return this.databaseService.user.delete({
      where: {
        id,
      },
    });
  }
}
