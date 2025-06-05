import { Controller } from '@nestjs/common';
import { RoomCategoriesService } from './room-categories.service';

@Controller('room-categories')
export class RoomCategoriesController {
  constructor(private readonly roomCategoriesService: RoomCategoriesService) {}
}
