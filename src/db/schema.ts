import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// Users table synced with Firebase Authentication
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  displayName: text('display_name'),
  photoUrl: text('photo_url'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Saved comparison sessions with algorithm weights
export const savedComparisons = pgTable('saved_comparisons', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  title: text('title').notNull(),
  phoneIds: text('phone_ids').notNull(), // JSON array string e.g. '["s25-ultra", "iphone-16-pro-max"]'
  weights: text('weights').notNull(), // JSON string e.g. '{"perf":30,"cam":30,"bat":20,"disp":10,"val":10}'
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// User bookmarked phones
export const userFavorites = pgTable('user_favorites', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  phoneId: text('phone_id').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Custom user algorithm presets
export const customWeightPresets = pgTable('custom_weight_presets', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  name: text('name').notNull(),
  performanceWeight: integer('performance_weight').notNull().default(25),
  cameraWeight: integer('camera_weight').notNull().default(25),
  batteryWeight: integer('battery_weight').notNull().default(25),
  displayWeight: integer('display_weight').notNull().default(15),
  valueWeight: integer('value_weight').notNull().default(10),
  createdAt: timestamp('created_at').defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  comparisons: many(savedComparisons),
  favorites: many(userFavorites),
  presets: many(customWeightPresets),
}));

export const savedComparisonsRelations = relations(savedComparisons, ({ one }) => ({
  user: one(users, {
    fields: [savedComparisons.userId],
    references: [users.id],
  }),
}));

export const userFavoritesRelations = relations(userFavorites, ({ one }) => ({
  user: one(users, {
    fields: [userFavorites.userId],
    references: [users.id],
  }),
}));

export const customWeightPresetsRelations = relations(customWeightPresets, ({ one }) => ({
  user: one(users, {
    fields: [customWeightPresets.userId],
    references: [users.id],
  }),
}));
