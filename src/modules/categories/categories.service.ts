import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../../db/drizzle.module.js';
import { categories, type Category } from '../../db/schema/index.js';
import type { CreateCategoryDto } from './dto/create-category.dto.js';

@Injectable()
export class CategoriesService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  findAll(): Promise<Category[]> {
    return this.db.select().from(categories).orderBy(asc(categories.name));
  }

  async create(dto: CreateCategoryDto): Promise<Category> {
    const [existing] = await this.db
      .select()
      .from(categories)
      .where(eq(categories.name, dto.name));

    if (existing) {
      throw new ConflictException('Category already exists');
    }

    const [category] = await this.db.insert(categories).values(dto).returning();
    return category;
  }
}
