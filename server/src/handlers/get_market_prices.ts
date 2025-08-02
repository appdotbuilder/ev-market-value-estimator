
import { db } from '../db';
import { marketPricesTable } from '../db/schema';
import { type GetMarketPricesInput, type MarketPrice } from '../schema';
import { eq, gte, lte, and, desc, type SQL } from 'drizzle-orm';

export const getMarketPrices = async (input?: GetMarketPricesInput): Promise<MarketPrice[]> => {
  try {
    // Build conditions array for optional filters
    const conditions: SQL<unknown>[] = [];

    if (input) {
      // Filter by market type if provided
      if (input.market_type) {
        conditions.push(eq(marketPricesTable.market_type, input.market_type));
      }

      // Filter by date range if provided
      if (input.from_date) {
        conditions.push(gte(marketPricesTable.timestamp, input.from_date));
      }

      if (input.to_date) {
        conditions.push(lte(marketPricesTable.timestamp, input.to_date));
      }
    }

    // Build the complete query in a single chain without reassignment
    const baseQuery = db.select().from(marketPricesTable);
    
    const queryWithConditions = conditions.length > 0
      ? baseQuery.where(conditions.length === 1 ? conditions[0] : and(...conditions))
      : baseQuery;

    const queryWithOrder = queryWithConditions.orderBy(desc(marketPricesTable.timestamp));

    const finalQuery = input?.limit 
      ? queryWithOrder.limit(input.limit)
      : queryWithOrder;

    const results = await finalQuery.execute();

    // Convert numeric fields back to numbers
    return results.map(result => ({
      ...result,
      price_eur_per_mwh: parseFloat(result.price_eur_per_mwh)
    }));
  } catch (error) {
    console.error('Market prices query failed:', error);
    throw error;
  }
};
