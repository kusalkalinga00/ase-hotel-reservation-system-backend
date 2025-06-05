import { Module } from '@nestjs/common';
import { RoomCategoriesService } from './room-categories.service';
import { RoomCategoriesController } from './room-categories.controller';

@Module({
  controllers: [RoomCategoriesController],
  providers: [RoomCategoriesService],
})
export class RoomCategoriesModule {}
