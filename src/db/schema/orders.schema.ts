import { pgTable, uuid, varchar, integer, timestamp, pgEnum, text } from 'drizzle-orm/pg-core';
import { users } from './users.schema.js';
import { products } from './products.schema.js';
import { addresses } from './addresses.schema.js';

export const orderStatusEnum = pgEnum('order_status', [
  'pending',
  'paid',
  'shipped',
  'delivered',
  'cancelled',
  'failed',
]);

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  totalCents: integer('total_cents').notNull(),
  status: orderStatusEnum('status').notNull().default('pending'),
  addressId: uuid('address_id').references(() => addresses.id, { onDelete: 'set null' }),
  shippingAddress: text('shipping_address'),
  paymentReference: varchar('payment_reference', { length: 60 }),
  cardLast4: varchar('card_last4', { length: 4 }),
  paidAt: timestamp('paid_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const orderItems = pgTable('order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'set null' }),
  productName: varchar('product_name', { length: 255 }).notNull(),
  imageUrl: varchar('image_url', { length: 500 }),
  unitPriceCents: integer('unit_price_cents').notNull(),
  quantity: integer('quantity').notNull(),
});

export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type OrderStatus = (typeof orderStatusEnum.enumValues)[number];
