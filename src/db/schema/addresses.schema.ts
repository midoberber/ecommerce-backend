import { pgTable, uuid, varchar, text, boolean, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users.schema.js';

export const addresses = pgTable('addresses', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  label: varchar('label', { length: 60 }).notNull(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 30 }).notNull(),
  city: varchar('city', { length: 120 }).notNull(),
  district: varchar('district', { length: 120 }),
  street: varchar('street', { length: 255 }).notNull(),
  details: text('details'),
  isDefault: boolean('is_default').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type Address = typeof addresses.$inferSelect;
export type NewAddress = typeof addresses.$inferInsert;

export function formatAddress(address: Address) {
  return [
    address.fullName,
    address.phone,
    address.city,
    address.district,
    address.street,
    address.details,
  ]
    .filter(Boolean)
    .join(' - ');
}
