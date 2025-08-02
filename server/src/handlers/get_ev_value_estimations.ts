
import { db } from '../db';
import { evValueEstimationsTable } from '../db/schema';
import { type EvValueEstimation } from '../schema';

export const getEvValueEstimations = async (): Promise<EvValueEstimation[]> => {
  try {
    const results = await db.select()
      .from(evValueEstimationsTable)
      .execute();

    // Convert numeric fields back to numbers
    return results.map(estimation => ({
      ...estimation,
      estimated_value_eur_per_year: parseFloat(estimation.estimated_value_eur_per_year),
      day_ahead_value: parseFloat(estimation.day_ahead_value),
      intraday_value: parseFloat(estimation.intraday_value),
      imbalance_value: parseFloat(estimation.imbalance_value)
    }));
  } catch (error) {
    console.error('Failed to fetch EV value estimations:', error);
    throw error;
  }
};
