import { pgTable, uuid, timestamp, unique } from 'drizzle-orm/pg-core';
import { users } from './users.schema.js';
import { products } from './products.schema.js';

export const wishlistItems = pgTable(
  'wishlist_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [unique('wishlist_user_product_unique').on(table.userId, table.productId)],
);

export type WishlistItem = typeof wishlistItems.$inferSelect;
