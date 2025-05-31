import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class RoomsService {
  constructor(private readonly db: DatabaseService) {}

  async create(createDto: any) {
    try {
      return await this.db.room.create({ data: createDto });
    } catch (error) {
      if (
        error.code === 'P2002' &&
        error.meta &&
        error.meta.target &&
        error.meta.target.includes('number')
      ) {
        throw new ConflictException('Room number is already in use');
      }
      throw error;
    }
  }

  async findAll() {
    return this.db.room.findMany();
  }

  async findOne(id: string) {
    const room = await this.db.room.findUnique({ where: { id } });
    if (!room) throw new NotFoundException('Room not found');
    return room;
  }

  async update(id: string, updateDto: any) {
    const room = await this.db.room.findUnique({ where: { id } });
    if (!room) throw new NotFoundException('Room not found');
    return this.db.room.update({ where: { id }, data: updateDto });
  }

  async remove(id: string) {
    const room = await this.db.room.findUnique({ where: { id } });
    if (!room) throw new NotFoundException('Room not found');
    return this.db.room.delete({ where: { id } });
  }
}
