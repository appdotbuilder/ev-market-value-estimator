
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { evSpecsTable } from '../db/schema';
import { type CreateEvSpecInput } from '../schema';
import { createEvSpec } from '../handlers/create_ev_spec';
import { eq } from 'drizzle-orm';

// Test input for EV spec creation
const testInput: CreateEvSpecInput = {
  model: 'Tesla Model 3',
  battery_capacity_kwh: 75.5,
  efficiency_kwh_per_100km: 15.2,
  max_charging_power_kw: 250.0
};

describe('createEvSpec', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an EV spec', async () => {
    const result = await createEvSpec(testInput);

    // Basic field validation
    expect(result.model).toEqual('Tesla Model 3');
    expect(result.battery_capacity_kwh).toEqual(75.5);
    expect(result.efficiency_kwh_per_100km).toEqual(15.2);
    expect(result.max_charging_power_kw).toEqual(250.0);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify numeric fields are numbers
    expect(typeof result.battery_capacity_kwh).toBe('number');
    expect(typeof result.efficiency_kwh_per_100km).toBe('number');
    expect(typeof result.max_charging_power_kw).toBe('number');
  });

  it('should save EV spec to database', async () => {
    const result = await createEvSpec(testInput);

    // Query database to verify persistence
    const evSpecs = await db.select()
      .from(evSpecsTable)
      .where(eq(evSpecsTable.id, result.id))
      .execute();

    expect(evSpecs).toHaveLength(1);
    expect(evSpecs[0].model).toEqual('Tesla Model 3');
    expect(parseFloat(evSpecs[0].battery_capacity_kwh)).toEqual(75.5);
    expect(parseFloat(evSpecs[0].efficiency_kwh_per_100km)).toEqual(15.2);
    expect(parseFloat(evSpecs[0].max_charging_power_kw)).toEqual(250.0);
    expect(evSpecs[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle different EV models correctly', async () => {
    const bmwInput: CreateEvSpecInput = {
      model: 'BMW iX',
      battery_capacity_kwh: 111.5,
      efficiency_kwh_per_100km: 19.8,
      max_charging_power_kw: 200.0
    };

    const result = await createEvSpec(bmwInput);

    expect(result.model).toEqual('BMW iX');
    expect(result.battery_capacity_kwh).toEqual(111.5);
    expect(result.efficiency_kwh_per_100km).toEqual(19.8);
    expect(result.max_charging_power_kw).toEqual(200.0);

    // Verify it's saved in database
    const evSpecs = await db.select()
      .from(evSpecsTable)
      .where(eq(evSpecsTable.model, 'BMW iX'))
      .execute();

    expect(evSpecs).toHaveLength(1);
    expect(parseFloat(evSpecs[0].battery_capacity_kwh)).toEqual(111.5);
  });
});
