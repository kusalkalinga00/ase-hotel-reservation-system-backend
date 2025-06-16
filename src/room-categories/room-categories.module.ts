import { Module } from '@nestjs/common';
import { RoomCategoriesService } from './room-categories.service';
import { RoomCategoriesController } from './room-categories.controller';
import { DatabaseService } from '../database/database.service';

@Module({
  controllers: [RoomCategoriesController],
  providers: [RoomCategoriesService, DatabaseService],
  exports: [RoomCategoriesService],
})
export class RoomCategoriesModule {}
