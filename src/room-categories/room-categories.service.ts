import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateRoomCategoryDto } from './create-room-category.dto';
import { UpdateRoomCategoryDto } from './update-room-category.dto';

@Injectable()
export class RoomCategoriesService {
  constructor(private readonly prisma: DatabaseService) {}

  create(data: CreateRoomCategoryDto) {
    return this.prisma.roomCategory.create({ data });
  }

  findAll() {
    return this.prisma.roomCategory.findMany({ include: { rooms: true } });
  }

  findOne(id: string) {
    return this.prisma.roomCategory.findUnique({
      where: { id },
      include: { rooms: true },
    });
  }

  update(id: string, data: UpdateRoomCategoryDto) {
    return this.prisma.roomCategory.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.roomCategory.delete({ where: { id } });
  }
}
