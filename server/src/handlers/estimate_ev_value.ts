
import { db } from '../db';
import { evSpecsTable, marketPricesTable, evValueEstimationsTable } from '../db/schema';
import { type EstimateEvValueInput, type EvValueEstimation } from '../schema';
import { eq, desc } from 'drizzle-orm';

export const estimateEvValue = async (input: EstimateEvValueInput): Promise<EvValueEstimation> => {
  try {
    // Fetch EV specification
    const evSpecs = await db.select()
      .from(evSpecsTable)
      .where(eq(evSpecsTable.id, input.ev_spec_id))
      .execute();

    if (evSpecs.length === 0) {
      throw new Error(`EV specification with id ${input.ev_spec_id} not found`);
    }

    const evSpec = evSpecs[0];

    // Get latest market prices for each market type
    const dayAheadPrices = await db.select()
      .from(marketPricesTable)
      .where(eq(marketPricesTable.market_type, 'day_ahead'))
      .orderBy(desc(marketPricesTable.timestamp))
      .limit(24) // Last 24 hours for average
      .execute();

    const intradayPrices = await db.select()
      .from(marketPricesTable)
      .where(eq(marketPricesTable.market_type, 'intraday'))
      .orderBy(desc(marketPricesTable.timestamp))
      .limit(24)
      .execute();

    const imbalancePrices = await db.select()
      .from(marketPricesTable)
      .where(eq(marketPricesTable.market_type, 'imbalance'))
      .orderBy(desc(marketPricesTable.timestamp))
      .limit(24)
      .execute();

    // Calculate average prices (convert from string to number)
    const avgDayAheadPrice = dayAheadPrices.length > 0
      ? dayAheadPrices.reduce((sum, price) => sum + parseFloat(price.price_eur_per_mwh), 0) / dayAheadPrices.length
      : 50; // Default fallback price

    const avgIntradayPrice = intradayPrices.length > 0
      ? intradayPrices.reduce((sum, price) => sum + parseFloat(price.price_eur_per_mwh), 0) / intradayPrices.length
      : 55; // Default fallback price

    const avgImbalancePrice = imbalancePrices.length > 0
      ? imbalancePrices.reduce((sum, price) => sum + parseFloat(price.price_eur_per_mwh), 0) / imbalancePrices.length
      : 60; // Default fallback price

    // Calculate annual energy consumption in MWh
    const efficiency = parseFloat(evSpec.efficiency_kwh_per_100km);
    const annualEnergyConsumptionMWh = (input.annual_km / 100) * efficiency / 1000; // Convert kWh to MWh

    // Calculate base energy cost savings
    const batteryCapacityMWh = parseFloat(evSpec.battery_capacity_kwh) / 1000;
    const maxChargingPowerMW = parseFloat(evSpec.max_charging_power_kw) / 1000;

    // Day-ahead value: Smart charging based on price forecasts
    // Assume 20% cost reduction through optimal charging timing
    const dayAheadValue = annualEnergyConsumptionMWh * avgDayAheadPrice * 0.20;

    // Intraday value: Flexibility to adjust charging based on real-time prices
    // Assume 10% additional value from intraday market participation
    const intradayValue = annualEnergyConsumptionMWh * (avgIntradayPrice - avgDayAheadPrice) * 0.10;

    // Imbalance value: Grid services and frequency regulation
    // Based on battery capacity and charging power flexibility
    // Assume €10/MWh/year value per MW of flexible capacity
    const imbalanceValue = Math.min(batteryCapacityMWh, maxChargingPowerMW) * avgImbalancePrice * 0.05;

    const totalEstimatedValue = dayAheadValue + intradayValue + imbalanceValue;

    // Save estimation to database
    const result = await db.insert(evValueEstimationsTable)
      .values({
        annual_km: input.annual_km,
        ev_spec_id: input.ev_spec_id,
        estimated_value_eur_per_year: totalEstimatedValue.toString(),
        day_ahead_value: dayAheadValue.toString(),
        intraday_value: intradayValue.toString(),
        imbalance_value: imbalanceValue.toString()
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers
    const estimation = result[0];
    return {
      ...estimation,
      estimated_value_eur_per_year: parseFloat(estimation.estimated_value_eur_per_year),
      day_ahead_value: parseFloat(estimation.day_ahead_value),
      intraday_value: parseFloat(estimation.intraday_value),
      imbalance_value: parseFloat(estimation.imbalance_value)
    };
  } catch (error) {
    console.error('EV value estimation failed:', error);
    throw error;
  }
};
