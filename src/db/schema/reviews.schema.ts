import { pgTable, uuid, integer, text, timestamp, unique } from 'drizzle-orm/pg-core';
import { users } from './users.schema.js';
import { products } from './products.schema.js';

export const reviews = pgTable(
  'reviews',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    rating: integer('rating').notNull(),
    comment: text('comment'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [unique('reviews_user_product_unique').on(table.userId, table.productId)],
);

export type Review = typeof reviews.$inferSelect;
