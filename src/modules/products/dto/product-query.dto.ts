import { Type } from 'class-transformer';
import { IsIn, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export const PRODUCT_SORTS = ['newest', 'price_asc', 'price_desc', 'name'] as const;

export class ProductQueryDto {
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  search?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  minPrice?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  maxPrice?: number;

  @IsIn(PRODUCT_SORTS)
  @IsOptional()
  sort?: (typeof PRODUCT_SORTS)[number];
}
