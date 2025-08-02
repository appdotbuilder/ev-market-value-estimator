
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { marketPricesTable } from '../db/schema';
import { type CreateMarketPriceInput } from '../schema';
import { createMarketPrice } from '../handlers/create_market_price';
import { eq } from 'drizzle-orm';

// Test input for day ahead market
const testInput: CreateMarketPriceInput = {
  market_type: 'day_ahead',
  price_eur_per_mwh: 45.75,
  timestamp: new Date('2024-01-15T12:00:00Z')
};

describe('createMarketPrice', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a market price', async () => {
    const result = await createMarketPrice(testInput);

    // Basic field validation
    expect(result.market_type).toEqual('day_ahead');
    expect(result.price_eur_per_mwh).toEqual(45.75);
    expect(typeof result.price_eur_per_mwh).toBe('number');
    expect(result.timestamp).toEqual(testInput.timestamp);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save market price to database', async () => {
    const result = await createMarketPrice(testInput);

    // Query using proper drizzle syntax
    const marketPrices = await db.select()
      .from(marketPricesTable)
      .where(eq(marketPricesTable.id, result.id))
      .execute();

    expect(marketPrices).toHaveLength(1);
    expect(marketPrices[0].market_type).toEqual('day_ahead');
    expect(parseFloat(marketPrices[0].price_eur_per_mwh)).toEqual(45.75);
    expect(marketPrices[0].timestamp).toEqual(testInput.timestamp);
    expect(marketPrices[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle different market types', async () => {
    const intradayInput: CreateMarketPriceInput = {
      market_type: 'intraday',
      price_eur_per_mwh: 52.30,
      timestamp: new Date('2024-01-15T14:00:00Z')
    };

    const imbalanceInput: CreateMarketPriceInput = {
      market_type: 'imbalance',
      price_eur_per_mwh: -10.50,
      timestamp: new Date('2024-01-15T16:00:00Z')
    };

    const intradayResult = await createMarketPrice(intradayInput);
    const imbalanceResult = await createMarketPrice(imbalanceInput);

    expect(intradayResult.market_type).toEqual('intraday');
    expect(intradayResult.price_eur_per_mwh).toEqual(52.30);
    
    expect(imbalanceResult.market_type).toEqual('imbalance');
    expect(imbalanceResult.price_eur_per_mwh).toEqual(-10.50);
  });

  it('should handle negative prices', async () => {
    const negativeInput: CreateMarketPriceInput = {
      market_type: 'day_ahead',
      price_eur_per_mwh: -25.00,
      timestamp: new Date('2024-01-15T03:00:00Z')
    };

    const result = await createMarketPrice(negativeInput);

    expect(result.price_eur_per_mwh).toEqual(-25.00);
    expect(typeof result.price_eur_per_mwh).toBe('number');
  });
});
