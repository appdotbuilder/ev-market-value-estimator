
import { z } from 'zod';

// Market types enum
export const marketTypeSchema = z.enum(['day_ahead', 'intraday', 'imbalance']);
export type MarketType = z.infer<typeof marketTypeSchema>;

// EV specification schema
export const evSpecSchema = z.object({
  id: z.number(),
  model: z.string(),
  battery_capacity_kwh: z.number().positive(),
  efficiency_kwh_per_100km: z.number().positive(),
  max_charging_power_kw: z.number().positive(),
  created_at: z.coerce.date()
});
export type EvSpec = z.infer<typeof evSpecSchema>;

// Market price schema
export const marketPriceSchema = z.object({
  id: z.number(),
  market_type: marketTypeSchema,
  price_eur_per_mwh: z.number(),
  timestamp: z.coerce.date(),
  created_at: z.coerce.date()
});
export type MarketPrice = z.infer<typeof marketPriceSchema>;

// EV value estimation request schema
export const evValueEstimationSchema = z.object({
  id: z.number(),
  annual_km: z.number().positive(),
  ev_spec_id: z.number(),
  estimated_value_eur_per_year: z.number(),
  day_ahead_value: z.number(),
  intraday_value: z.number(),
  imbalance_value: z.number(),
  created_at: z.coerce.date()
});
export type EvValueEstimation = z.infer<typeof evValueEstimationSchema>;

// Input schemas for API endpoints
export const createEvSpecInputSchema = z.object({
  model: z.string().min(1),
  battery_capacity_kwh: z.number().positive(),
  efficiency_kwh_per_100km: z.number().positive(),
  max_charging_power_kw: z.number().positive()
});
export type CreateEvSpecInput = z.infer<typeof createEvSpecInputSchema>;

export const createMarketPriceInputSchema = z.object({
  market_type: marketTypeSchema,
  price_eur_per_mwh: z.number(),
  timestamp: z.coerce.date()
});
export type CreateMarketPriceInput = z.infer<typeof createMarketPriceInputSchema>;

export const estimateEvValueInputSchema = z.object({
  annual_km: z.number().positive(),
  ev_spec_id: z.number()
});
export type EstimateEvValueInput = z.infer<typeof estimateEvValueInputSchema>;

export const updateEvSpecInputSchema = z.object({
  id: z.number(),
  model: z.string().min(1).optional(),
  battery_capacity_kwh: z.number().positive().optional(),
  efficiency_kwh_per_100km: z.number().positive().optional(),
  max_charging_power_kw: z.number().positive().optional()
});
export type UpdateEvSpecInput = z.infer<typeof updateEvSpecInputSchema>;

// Market price query schema
export const getMarketPricesInputSchema = z.object({
  market_type: marketTypeSchema.optional(),
  from_date: z.coerce.date().optional(),
  to_date: z.coerce.date().optional(),
  limit: z.number().int().positive().max(1000).optional()
});
export type GetMarketPricesInput = z.infer<typeof getMarketPricesInputSchema>;
