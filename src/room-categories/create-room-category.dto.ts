import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateRoomCategoryDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  idealFor?: string;

  @IsNumber()
  @IsOptional()
  capacity?: number;

  @IsString()
  @IsOptional()
  size?: string;

  @IsString()
  @IsOptional()
  bed?: string;

  @IsString()
  @IsOptional()
  view?: string;

  @IsString()
  @IsOptional()
  priceTier?: string;

  @IsNumber()
  price: number;
}
