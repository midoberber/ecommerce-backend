import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @Min(0)
  priceCents!: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  stock?: number;

  @IsArray()
  @ArrayMaxSize(6)
  @IsString({ each: true })
  @IsOptional()
  images?: string[];
}
