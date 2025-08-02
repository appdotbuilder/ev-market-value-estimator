
import { db } from '../db';
import { evSpecsTable } from '../db/schema';
import { type CreateEvSpecInput, type EvSpec } from '../schema';

export const createEvSpec = async (input: CreateEvSpecInput): Promise<EvSpec> => {
  try {
    // Insert EV spec record
    const result = await db.insert(evSpecsTable)
      .values({
        model: input.model,
        battery_capacity_kwh: input.battery_capacity_kwh.toString(),
        efficiency_kwh_per_100km: input.efficiency_kwh_per_100km.toString(),
        max_charging_power_kw: input.max_charging_power_kw.toString()
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const evSpec = result[0];
    return {
      ...evSpec,
      battery_capacity_kwh: parseFloat(evSpec.battery_capacity_kwh),
      efficiency_kwh_per_100km: parseFloat(evSpec.efficiency_kwh_per_100km),
      max_charging_power_kw: parseFloat(evSpec.max_charging_power_kw)
    };
  } catch (error) {
    console.error('EV spec creation failed:', error);
    throw error;
  }
};
