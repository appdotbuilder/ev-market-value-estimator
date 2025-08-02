
import { db } from '../db';
import { evSpecsTable } from '../db/schema';
import { type UpdateEvSpecInput, type EvSpec } from '../schema';
import { eq } from 'drizzle-orm';

export const updateEvSpec = async (input: UpdateEvSpecInput): Promise<EvSpec> => {
  try {
    // Build update object with only defined fields
    const updateData: any = {};
    
    if (input.model !== undefined) {
      updateData.model = input.model;
    }
    if (input.battery_capacity_kwh !== undefined) {
      updateData.battery_capacity_kwh = input.battery_capacity_kwh.toString();
    }
    if (input.efficiency_kwh_per_100km !== undefined) {
      updateData.efficiency_kwh_per_100km = input.efficiency_kwh_per_100km.toString();
    }
    if (input.max_charging_power_kw !== undefined) {
      updateData.max_charging_power_kw = input.max_charging_power_kw.toString();
    }

    // Update the EV spec record
    const result = await db.update(evSpecsTable)
      .set(updateData)
      .where(eq(evSpecsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`EV spec with id ${input.id} not found`);
    }

    // Convert numeric fields back to numbers before returning
    const evSpec = result[0];
    return {
      ...evSpec,
      battery_capacity_kwh: parseFloat(evSpec.battery_capacity_kwh),
      efficiency_kwh_per_100km: parseFloat(evSpec.efficiency_kwh_per_100km),
      max_charging_power_kw: parseFloat(evSpec.max_charging_power_kw)
    };
  } catch (error) {
    console.error('EV spec update failed:', error);
    throw error;
  }
};
