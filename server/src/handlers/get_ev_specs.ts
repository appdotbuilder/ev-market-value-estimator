
import { db } from '../db';
import { evSpecsTable } from '../db/schema';
import { type EvSpec } from '../schema';

export const getEvSpecs = async (): Promise<EvSpec[]> => {
  try {
    const results = await db.select()
      .from(evSpecsTable)
      .execute();

    // Convert numeric fields back to numbers
    return results.map(spec => ({
      ...spec,
      battery_capacity_kwh: parseFloat(spec.battery_capacity_kwh),
      efficiency_kwh_per_100km: parseFloat(spec.efficiency_kwh_per_100km),
      max_charging_power_kw: parseFloat(spec.max_charging_power_kw)
    }));
  } catch (error) {
    console.error('Failed to fetch EV specs:', error);
    throw error;
  }
};
