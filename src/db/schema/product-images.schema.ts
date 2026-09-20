import { pgTable, uuid, varchar, integer, timestamp } from 'drizzle-orm/pg-core';
import { products } from './products.schema.js';

export const productImages = pgTable('product_images', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  url: varchar('url', { length: 500 }).notNull(),
  position: integer('position').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type ProductImage = typeof productImages.$inferSelect;
