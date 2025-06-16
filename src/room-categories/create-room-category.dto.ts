import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  ArrayNotEmpty,
} from 'class-validator';

export class CreateRoomCategoryDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  amenities: string[];

  @IsString()
  @IsOptional()
  image?: string;

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
