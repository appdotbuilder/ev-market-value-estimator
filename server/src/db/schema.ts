
import { serial, text, pgTable, timestamp, numeric, integer, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Define market type enum
export const marketTypeEnum = pgEnum('market_type', ['day_ahead', 'intraday', 'imbalance']);

// EV specifications table
export const evSpecsTable = pgTable('ev_specs', {
  id: serial('id').primaryKey(),
  model: text('model').notNull(),
  battery_capacity_kwh: numeric('battery_capacity_kwh', { precision: 6, scale: 2 }).notNull(),
  efficiency_kwh_per_100km: numeric('efficiency_kwh_per_100km', { precision: 5, scale: 2 }).notNull(),
  max_charging_power_kw: numeric('max_charging_power_kw', { precision: 6, scale: 2 }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Market prices table
export const marketPricesTable = pgTable('market_prices', {
  id: serial('id').primaryKey(),
  market_type: marketTypeEnum('market_type').notNull(),
  price_eur_per_mwh: numeric('price_eur_per_mwh', { precision: 8, scale: 2 }).notNull(),
  timestamp: timestamp('timestamp').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// EV value estimations table
export const evValueEstimationsTable = pgTable('ev_value_estimations', {
  id: serial('id').primaryKey(),
  annual_km: integer('annual_km').notNull(),
  ev_spec_id: integer('ev_spec_id').notNull(),
  estimated_value_eur_per_year: numeric('estimated_value_eur_per_year', { precision: 10, scale: 2 }).notNull(),
  day_ahead_value: numeric('day_ahead_value', { precision: 10, scale: 2 }).notNull(),
  intraday_value: numeric('intraday_value', { precision: 10, scale: 2 }).notNull(),
  imbalance_value: numeric('imbalance_value', { precision: 10, scale: 2 }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Define relations
export const evSpecsRelations = relations(evSpecsTable, ({ many }) => ({
  estimations: many(evValueEstimationsTable),
}));

export const evValueEstimationsRelations = relations(evValueEstimationsTable, ({ one }) => ({
  evSpec: one(evSpecsTable, {
    fields: [evValueEstimationsTable.ev_spec_id],
    references: [evSpecsTable.id],
  }),
}));

// TypeScript types for the table schemas
export type EvSpec = typeof evSpecsTable.$inferSelect;
export type NewEvSpec = typeof evSpecsTable.$inferInsert;

export type MarketPrice = typeof marketPricesTable.$inferSelect;
export type NewMarketPrice = typeof marketPricesTable.$inferInsert;

export type EvValueEstimation = typeof evValueEstimationsTable.$inferSelect;
export type NewEvValueEstimation = typeof evValueEstimationsTable.$inferInsert;

// Export all tables for proper query building
export const tables = {
  evSpecs: evSpecsTable,
  marketPrices: marketPricesTable,
  evValueEstimations: evValueEstimationsTable,
};
