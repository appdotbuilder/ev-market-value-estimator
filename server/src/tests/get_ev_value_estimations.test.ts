
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { evSpecsTable, evValueEstimationsTable } from '../db/schema';
import { getEvValueEstimations } from '../handlers/get_ev_value_estimations';

describe('getEvValueEstimations', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no estimations exist', async () => {
    const result = await getEvValueEstimations();
    
    expect(result).toEqual([]);
  });

  it('should return all EV value estimations', async () => {
    // Create prerequisite EV spec first
    const evSpecResult = await db.insert(evSpecsTable)
      .values({
        model: 'Test EV Model',
        battery_capacity_kwh: '75.00',
        efficiency_kwh_per_100km: '18.50',
        max_charging_power_kw: '150.00'
      })
      .returning()
      .execute();

    const evSpecId = evSpecResult[0].id;

    // Create test estimations
    await db.insert(evValueEstimationsTable)
      .values([
        {
          annual_km: 15000,
          ev_spec_id: evSpecId,
          estimated_value_eur_per_year: '1250.75',
          day_ahead_value: '800.25',
          intraday_value: '300.50',
          imbalance_value: '150.00'
        },
        {
          annual_km: 25000,
          ev_spec_id: evSpecId,
          estimated_value_eur_per_year: '2100.50',
          day_ahead_value: '1350.75',
          intraday_value: '500.25',
          imbalance_value: '249.50'
        }
      ])
      .execute();

    const result = await getEvValueEstimations();

    expect(result).toHaveLength(2);
    
    // Verify first estimation
    const firstEstimation = result[0];
    expect(firstEstimation.annual_km).toEqual(15000);
    expect(firstEstimation.ev_spec_id).toEqual(evSpecId);
    expect(firstEstimation.estimated_value_eur_per_year).toEqual(1250.75);
    expect(firstEstimation.day_ahead_value).toEqual(800.25);
    expect(firstEstimation.intraday_value).toEqual(300.50);
    expect(firstEstimation.imbalance_value).toEqual(150.00);
    expect(firstEstimation.id).toBeDefined();
    expect(firstEstimation.created_at).toBeInstanceOf(Date);

    // Verify second estimation
    const secondEstimation = result[1];
    expect(secondEstimation.annual_km).toEqual(25000);
    expect(secondEstimation.ev_spec_id).toEqual(evSpecId);
    expect(secondEstimation.estimated_value_eur_per_year).toEqual(2100.50);
    expect(secondEstimation.day_ahead_value).toEqual(1350.75);
    expect(secondEstimation.intraday_value).toEqual(500.25);
    expect(secondEstimation.imbalance_value).toEqual(249.50);
    expect(secondEstimation.id).toBeDefined();
    expect(secondEstimation.created_at).toBeInstanceOf(Date);
  });

  it('should return numeric values as numbers not strings', async () => {
    // Create prerequisite EV spec
    const evSpecResult = await db.insert(evSpecsTable)
      .values({
        model: 'Test EV Model',
        battery_capacity_kwh: '60.00',
        efficiency_kwh_per_100km: '16.00',
        max_charging_power_kw: '120.00'
      })
      .returning()
      .execute();

    const evSpecId = evSpecResult[0].id;

    // Create test estimation
    await db.insert(evValueEstimationsTable)
      .values({
        annual_km: 20000,
        ev_spec_id: evSpecId,
        estimated_value_eur_per_year: '1800.99',
        day_ahead_value: '1200.00',
        intraday_value: '400.50',
        imbalance_value: '198.49'
      })
      .execute();

    const result = await getEvValueEstimations();

    expect(result).toHaveLength(1);
    
    const estimation = result[0];
    
    // Verify all numeric fields are actual numbers
    expect(typeof estimation.estimated_value_eur_per_year).toBe('number');
    expect(typeof estimation.day_ahead_value).toBe('number');
    expect(typeof estimation.intraday_value).toBe('number');
    expect(typeof estimation.imbalance_value).toBe('number');
    
    // Verify values are correct
    expect(estimation.estimated_value_eur_per_year).toEqual(1800.99);
    expect(estimation.day_ahead_value).toEqual(1200.00);
    expect(estimation.intraday_value).toEqual(400.50);
    expect(estimation.imbalance_value).toEqual(198.49);
  });
});
