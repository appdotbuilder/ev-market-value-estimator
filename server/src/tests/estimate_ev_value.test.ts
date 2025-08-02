
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { evSpecsTable, marketPricesTable, evValueEstimationsTable } from '../db/schema';
import { type EstimateEvValueInput } from '../schema';
import { estimateEvValue } from '../handlers/estimate_ev_value';
import { eq } from 'drizzle-orm';

describe('estimateEvValue', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testEvSpecId: number;

  beforeEach(async () => {
    // Create test EV specification
    const evSpecResult = await db.insert(evSpecsTable)
      .values({
        model: 'Tesla Model 3',
        battery_capacity_kwh: '75.00',
        efficiency_kwh_per_100km: '15.00',
        max_charging_power_kw: '250.00'
      })
      .returning()
      .execute();

    testEvSpecId = evSpecResult[0].id;

    // Create test market prices
    const now = new Date();
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    await db.insert(marketPricesTable)
      .values([
        {
          market_type: 'day_ahead',
          price_eur_per_mwh: '45.50',
          timestamp: hourAgo
        },
        {
          market_type: 'day_ahead',
          price_eur_per_mwh: '55.75',
          timestamp: now
        },
        {
          market_type: 'intraday',
          price_eur_per_mwh: '48.25',
          timestamp: hourAgo
        },
        {
          market_type: 'intraday',
          price_eur_per_mwh: '62.00',
          timestamp: now
        },
        {
          market_type: 'imbalance',
          price_eur_per_mwh: '65.00',
          timestamp: hourAgo
        },
        {
          market_type: 'imbalance',
          price_eur_per_mwh: '70.50',
          timestamp: now
        }
      ])
      .execute();
  });

  const testInput: EstimateEvValueInput = {
    annual_km: 15000,
    ev_spec_id: 0 // Will be set in beforeEach
  };

  it('should create an EV value estimation', async () => {
    const input = { ...testInput, ev_spec_id: testEvSpecId };
    const result = await estimateEvValue(input);

    expect(result.annual_km).toEqual(15000);
    expect(result.ev_spec_id).toEqual(testEvSpecId);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify numeric types
    expect(typeof result.estimated_value_eur_per_year).toBe('number');
    expect(typeof result.day_ahead_value).toBe('number');
    expect(typeof result.intraday_value).toBe('number');
    expect(typeof result.imbalance_value).toBe('number');

    // Verify positive values
    expect(result.estimated_value_eur_per_year).toBeGreaterThan(0);
    expect(result.day_ahead_value).toBeGreaterThan(0);
    expect(result.intraday_value).toBeGreaterThan(0);
    expect(result.imbalance_value).toBeGreaterThan(0);

    // Verify total equals sum of components
    const expectedTotal = result.day_ahead_value + result.intraday_value + result.imbalance_value;
    expect(Math.abs(result.estimated_value_eur_per_year - expectedTotal)).toBeLessThan(0.01);
  });

  it('should save estimation to database', async () => {
    const input = { ...testInput, ev_spec_id: testEvSpecId };
    const result = await estimateEvValue(input);

    const estimations = await db.select()
      .from(evValueEstimationsTable)
      .where(eq(evValueEstimationsTable.id, result.id))
      .execute();

    expect(estimations).toHaveLength(1);
    expect(estimations[0].annual_km).toEqual(15000);
    expect(estimations[0].ev_spec_id).toEqual(testEvSpecId);
    expect(parseFloat(estimations[0].estimated_value_eur_per_year)).toEqual(result.estimated_value_eur_per_year);
    expect(estimations[0].created_at).toBeInstanceOf(Date);
  });

  it('should calculate realistic values based on market prices', async () => {
    const input = { ...testInput, ev_spec_id: testEvSpecId };
    const result = await estimateEvValue(input);

    // With 15,000 km/year and 15 kWh/100km efficiency:
    // Annual consumption = 2.25 MWh
    // Expected day_ahead value should be based on 20% of consumption * avg price
    // Average day_ahead price from test data: (45.50 + 55.75) / 2 = 50.625
    // Expected day_ahead value ≈ 2.25 * 50.625 * 0.20 ≈ 22.78

    expect(result.day_ahead_value).toBeGreaterThan(15);
    expect(result.day_ahead_value).toBeLessThan(40);

    // Intraday value should be smaller
    expect(result.intraday_value).toBeGreaterThan(0);
    expect(result.intraday_value).toBeLessThan(result.day_ahead_value);

    // Imbalance value based on battery capacity and charging power
    expect(result.imbalance_value).toBeGreaterThan(0);
  });

  it('should throw error for non-existent EV spec', async () => {
    const input = { ...testInput, ev_spec_id: 99999 };

    await expect(estimateEvValue(input)).rejects.toThrow(/EV specification with id 99999 not found/i);
  });

  it('should handle missing market prices with defaults', async () => {
    // Clear all market prices
    await db.delete(marketPricesTable).execute();

    const input = { ...testInput, ev_spec_id: testEvSpecId };
    const result = await estimateEvValue(input);

    // Should still work with fallback prices
    expect(result.estimated_value_eur_per_year).toBeGreaterThan(0);
    expect(result.day_ahead_value).toBeGreaterThan(0);
    expect(result.intraday_value).toBeGreaterThan(0);
    expect(result.imbalance_value).toBeGreaterThan(0);
  });

  it('should scale values with annual kilometers', async () => {
    const lowKmInput = { ...testInput, ev_spec_id: testEvSpecId, annual_km: 5000 };
    const highKmInput = { ...testInput, ev_spec_id: testEvSpecId, annual_km: 25000 };

    const lowKmResult = await estimateEvValue(lowKmInput);
    const highKmResult = await estimateEvValue(highKmInput);

    // Higher km should result in higher day_ahead and intraday values
    expect(highKmResult.day_ahead_value).toBeGreaterThan(lowKmResult.day_ahead_value);
    expect(highKmResult.intraday_value).toBeGreaterThan(lowKmResult.intraday_value);
    expect(highKmResult.estimated_value_eur_per_year).toBeGreaterThan(lowKmResult.estimated_value_eur_per_year);

    // Imbalance value should be similar (based on battery capacity, not km)
    expect(Math.abs(highKmResult.imbalance_value - lowKmResult.imbalance_value)).toBeLessThan(5);
  });
});
