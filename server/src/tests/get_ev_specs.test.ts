
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { evSpecsTable } from '../db/schema';
import { getEvSpecs } from '../handlers/get_ev_specs';

describe('getEvSpecs', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no EV specs exist', async () => {
    const result = await getEvSpecs();
    expect(result).toEqual([]);
  });

  it('should return all EV specs with correct numeric conversions', async () => {
    // Create test EV specs
    await db.insert(evSpecsTable).values([
      {
        model: 'Tesla Model 3',
        battery_capacity_kwh: '75.50',
        efficiency_kwh_per_100km: '15.25',
        max_charging_power_kw: '250.00'
      },
      {
        model: 'BMW i4',
        battery_capacity_kwh: '83.90',
        efficiency_kwh_per_100km: '18.50',
        max_charging_power_kw: '200.00'
      }
    ]).execute();

    const result = await getEvSpecs();

    expect(result).toHaveLength(2);
    
    // Check first EV spec
    const tesla = result.find(spec => spec.model === 'Tesla Model 3');
    expect(tesla).toBeDefined();
    expect(tesla!.battery_capacity_kwh).toEqual(75.5);
    expect(typeof tesla!.battery_capacity_kwh).toBe('number');
    expect(tesla!.efficiency_kwh_per_100km).toEqual(15.25);
    expect(typeof tesla!.efficiency_kwh_per_100km).toBe('number');
    expect(tesla!.max_charging_power_kw).toEqual(250);
    expect(typeof tesla!.max_charging_power_kw).toBe('number');
    expect(tesla!.id).toBeDefined();
    expect(tesla!.created_at).toBeInstanceOf(Date);

    // Check second EV spec
    const bmw = result.find(spec => spec.model === 'BMW i4');
    expect(bmw).toBeDefined();
    expect(bmw!.battery_capacity_kwh).toEqual(83.9);
    expect(bmw!.efficiency_kwh_per_100km).toEqual(18.5);
    expect(bmw!.max_charging_power_kw).toEqual(200);
    expect(bmw!.id).toBeDefined();
    expect(bmw!.created_at).toBeInstanceOf(Date);
  });

  it('should handle single EV spec correctly', async () => {
    await db.insert(evSpecsTable).values({
      model: 'Volkswagen ID.3',
      battery_capacity_kwh: '58.00',
      efficiency_kwh_per_100km: '16.75',
      max_charging_power_kw: '125.00'
    }).execute();

    const result = await getEvSpecs();

    expect(result).toHaveLength(1);
    expect(result[0].model).toEqual('Volkswagen ID.3');
    expect(result[0].battery_capacity_kwh).toEqual(58);
    expect(result[0].efficiency_kwh_per_100km).toEqual(16.75);
    expect(result[0].max_charging_power_kw).toEqual(125);
  });
});
