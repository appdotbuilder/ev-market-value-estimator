
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { evSpecsTable } from '../db/schema';
import { type CreateEvSpecInput, type UpdateEvSpecInput } from '../schema';
import { updateEvSpec } from '../handlers/update_ev_spec';
import { eq } from 'drizzle-orm';

// Test data
const testEvSpec: CreateEvSpecInput = {
  model: 'Tesla Model 3',
  battery_capacity_kwh: 75.0,
  efficiency_kwh_per_100km: 16.5,
  max_charging_power_kw: 250.0
};

const createTestEvSpec = async () => {
  const result = await db.insert(evSpecsTable)
    .values({
      model: testEvSpec.model,
      battery_capacity_kwh: testEvSpec.battery_capacity_kwh.toString(),
      efficiency_kwh_per_100km: testEvSpec.efficiency_kwh_per_100km.toString(),
      max_charging_power_kw: testEvSpec.max_charging_power_kw.toString()
    })
    .returning()
    .execute();
  
  return result[0];
};

describe('updateEvSpec', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update all fields of an existing EV spec', async () => {
    const existingEvSpec = await createTestEvSpec();

    const updateInput: UpdateEvSpecInput = {
      id: existingEvSpec.id,
      model: 'Tesla Model S',
      battery_capacity_kwh: 100.0,
      efficiency_kwh_per_100km: 18.5,
      max_charging_power_kw: 350.0
    };

    const result = await updateEvSpec(updateInput);

    // Verify returned data
    expect(result.id).toEqual(existingEvSpec.id);
    expect(result.model).toEqual('Tesla Model S');
    expect(result.battery_capacity_kwh).toEqual(100.0);
    expect(result.efficiency_kwh_per_100km).toEqual(18.5);
    expect(result.max_charging_power_kw).toEqual(350.0);
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify numeric types
    expect(typeof result.battery_capacity_kwh).toBe('number');
    expect(typeof result.efficiency_kwh_per_100km).toBe('number');
    expect(typeof result.max_charging_power_kw).toBe('number');
  });

  it('should update only specified fields', async () => {
    const existingEvSpec = await createTestEvSpec();

    const updateInput: UpdateEvSpecInput = {
      id: existingEvSpec.id,
      model: 'Updated Model Name',
      battery_capacity_kwh: 85.0
    };

    const result = await updateEvSpec(updateInput);

    // Verify updated fields
    expect(result.model).toEqual('Updated Model Name');
    expect(result.battery_capacity_kwh).toEqual(85.0);

    // Verify unchanged fields
    expect(result.efficiency_kwh_per_100km).toEqual(16.5);
    expect(result.max_charging_power_kw).toEqual(250.0);
    expect(result.id).toEqual(existingEvSpec.id);
    expect(result.created_at).toEqual(existingEvSpec.created_at);
  });

  it('should persist changes in database', async () => {
    const existingEvSpec = await createTestEvSpec();

    const updateInput: UpdateEvSpecInput = {
      id: existingEvSpec.id,
      model: 'BMW i4',
      efficiency_kwh_per_100km: 19.2
    };

    await updateEvSpec(updateInput);

    // Query database directly to verify persistence
    const dbResult = await db.select()
      .from(evSpecsTable)
      .where(eq(evSpecsTable.id, existingEvSpec.id))
      .execute();

    expect(dbResult).toHaveLength(1);
    expect(dbResult[0].model).toEqual('BMW i4');
    expect(parseFloat(dbResult[0].efficiency_kwh_per_100km)).toEqual(19.2);
    expect(parseFloat(dbResult[0].battery_capacity_kwh)).toEqual(75.0);
    expect(parseFloat(dbResult[0].max_charging_power_kw)).toEqual(250.0);
  });

  it('should throw error when updating non-existent EV spec', async () => {
    const updateInput: UpdateEvSpecInput = {
      id: 99999,
      model: 'Non-existent Model'
    };

    await expect(updateEvSpec(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should handle updating with only one field', async () => {
    const existingEvSpec = await createTestEvSpec();

    const updateInput: UpdateEvSpecInput = {
      id: existingEvSpec.id,
      max_charging_power_kw: 22.0
    };

    const result = await updateEvSpec(updateInput);

    expect(result.max_charging_power_kw).toEqual(22.0);
    expect(result.model).toEqual('Tesla Model 3');
    expect(result.battery_capacity_kwh).toEqual(75.0);
    expect(result.efficiency_kwh_per_100km).toEqual(16.5);
  });
});
