import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../../db/drizzle.module.js';
import { products, wishlistItems } from '../../db/schema/index.js';
import { ProductsService } from '../products/products.service.js';

@Injectable()
export class WishlistService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly productsService: ProductsService,
  ) {}

  async findAll(userId: string) {
    const rows = await this.db
      .select({ product: products })
      .from(wishlistItems)
      .innerJoin(products, eq(wishlistItems.productId, products.id))
      .where(eq(wishlistItems.userId, userId))
      .orderBy(desc(wishlistItems.createdAt));

    return this.productsService.attachExtras(rows.map((row) => row.product));
  }

  async findIds(userId: string) {
    const rows = await this.db
      .select({ productId: wishlistItems.productId })
      .from(wishlistItems)
      .where(eq(wishlistItems.userId, userId));

    return rows.map((row) => row.productId);
  }

  async add(userId: string, productId: string) {
    const [product] = await this.db.select().from(products).where(eq(products.id, productId));
    if (!product) {
      throw new NotFoundException('المنتج غير موجود');
    }

    await this.db
      .insert(wishlistItems)
      .values({ userId, productId })
      .onConflictDoNothing();

    return { productId, inWishlist: true };
  }

  async remove(userId: string, productId: string) {
    await this.db
      .delete(wishlistItems)
      .where(and(eq(wishlistItems.userId, userId), eq(wishlistItems.productId, productId)));

    return { productId, inWishlist: false };
  }
}
