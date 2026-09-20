import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, desc, eq, gte, ilike, inArray, lte, type SQL } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../../db/drizzle.module.js';
import { productImages, products, type Product } from '../../db/schema/index.js';
import type { CreateProductDto } from './dto/create-product.dto.js';
import type { UpdateProductDto } from './dto/update-product.dto.js';
import type { ProductQueryDto } from './dto/product-query.dto.js';

export interface ProductWithImages extends Product {
  images: string[];
}

@Injectable()
export class ProductsService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findAll(query: ProductQueryDto): Promise<ProductWithImages[]> {
    const filters: SQL[] = [];

    if (query.categoryId) {
      filters.push(eq(products.categoryId, query.categoryId));
    }
    if (query.search) {
      filters.push(ilike(products.name, `%${query.search}%`));
    }
    if (query.minPrice !== undefined) {
      filters.push(gte(products.priceCents, query.minPrice * 100));
    }
    if (query.maxPrice !== undefined) {
      filters.push(lte(products.priceCents, query.maxPrice * 100));
    }

    const orderBy = {
      newest: desc(products.createdAt),
      price_asc: asc(products.priceCents),
      price_desc: desc(products.priceCents),
      name: asc(products.name),
    }[query.sort ?? 'newest'];

    const rows = await this.db
      .select()
      .from(products)
      .where(filters.length ? and(...filters) : undefined)
      .orderBy(orderBy);

    return this.attachImages(rows);
  }

  async findById(id: string): Promise<ProductWithImages> {
    const [product] = await this.db.select().from(products).where(eq(products.id, id));
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const [withImages] = await this.attachImages([product]);
    return withImages;
  }

  async create(dto: CreateProductDto): Promise<ProductWithImages> {
    const { images = [], ...data } = dto;

    const [product] = await this.db.insert(products).values(data).returning();
    await this.replaceImages(product.id, images);

    return this.findById(product.id);
  }

  async update(id: string, dto: UpdateProductDto): Promise<ProductWithImages> {
    const { images, ...data } = dto;

    const [product] = await this.db
      .update(products)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (images) {
      await this.replaceImages(id, images);
    }

    return this.findById(id);
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.db
      .delete(products)
      .where(eq(products.id, id))
      .returning({ id: products.id });

    if (deleted.length === 0) {
      throw new NotFoundException('Product not found');
    }
  }

  private async replaceImages(productId: string, urls: string[]) {
    await this.db.delete(productImages).where(eq(productImages.productId, productId));

    if (urls.length === 0) return;

    await this.db
      .insert(productImages)
      .values(urls.map((url, index) => ({ productId, url, position: index })));
  }

  private async attachImages(rows: Product[]): Promise<ProductWithImages[]> {
    if (rows.length === 0) return [];

    const images = await this.db
      .select()
      .from(productImages)
      .where(
        inArray(
          productImages.productId,
          rows.map((row) => row.id),
        ),
      )
      .orderBy(asc(productImages.position));

    return rows.map((row) => ({
      ...row,
      images: images.filter((image) => image.productId === row.id).map((image) => image.url),
    }));
  }
}
