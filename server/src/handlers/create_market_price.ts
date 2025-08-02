
import { db } from '../db';
import { marketPricesTable } from '../db/schema';
import { type CreateMarketPriceInput, type MarketPrice } from '../schema';

export const createMarketPrice = async (input: CreateMarketPriceInput): Promise<MarketPrice> => {
  try {
    // Insert market price record
    const result = await db.insert(marketPricesTable)
      .values({
        market_type: input.market_type,
        price_eur_per_mwh: input.price_eur_per_mwh.toString(), // Convert number to string for numeric column
        timestamp: input.timestamp
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const marketPrice = result[0];
    return {
      ...marketPrice,
      price_eur_per_mwh: parseFloat(marketPrice.price_eur_per_mwh) // Convert string back to number
    };
  } catch (error) {
    console.error('Market price creation failed:', error);
    throw error;
  }
};
