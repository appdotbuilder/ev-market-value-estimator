
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { marketPricesTable } from '../db/schema';
import { type CreateMarketPriceInput, type GetMarketPricesInput } from '../schema';
import { getMarketPrices } from '../handlers/get_market_prices';

// Test data setup
const testMarketPrices: CreateMarketPriceInput[] = [
  {
    market_type: 'day_ahead',
    price_eur_per_mwh: 50.25,
    timestamp: new Date('2024-01-15T10:00:00Z')
  },
  {
    market_type: 'intraday',
    price_eur_per_mwh: 55.75,
    timestamp: new Date('2024-01-15T11:00:00Z')
  },
  {
    market_type: 'imbalance',
    price_eur_per_mwh: 48.90,
    timestamp: new Date('2024-01-15T12:00:00Z')
  },
  {
    market_type: 'day_ahead',
    price_eur_per_mwh: 52.10,
    timestamp: new Date('2024-01-16T10:00:00Z')
  }
];

describe('getMarketPrices', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all market prices when no filters applied', async () => {
    // Insert test data
    await db.insert(marketPricesTable)
      .values(testMarketPrices.map(price => ({
        ...price,
        price_eur_per_mwh: price.price_eur_per_mwh.toString()
      })))
      .execute();

    const result = await getMarketPrices();

    expect(result).toHaveLength(4);
    
    // Verify numeric conversion
    result.forEach(price => {
      expect(typeof price.price_eur_per_mwh).toBe('number');
      expect(price.id).toBeDefined();
      expect(price.created_at).toBeInstanceOf(Date);
    });

    // Should be ordered by timestamp desc (most recent first)
    expect(result[0].timestamp.getTime()).toBeGreaterThan(result[1].timestamp.getTime());
  });

  it('should filter by market type', async () => {
    // Insert test data
    await db.insert(marketPricesTable)
      .values(testMarketPrices.map(price => ({
        ...price,
        price_eur_per_mwh: price.price_eur_per_mwh.toString()
      })))
      .execute();

    const input: GetMarketPricesInput = {
      market_type: 'day_ahead'
    };

    const result = await getMarketPrices(input);

    expect(result).toHaveLength(2);
    result.forEach(price => {
      expect(price.market_type).toBe('day_ahead');
      expect(typeof price.price_eur_per_mwh).toBe('number');
    });
  });

  it('should filter by date range', async () => {
    // Insert test data
    await db.insert(marketPricesTable)
      .values(testMarketPrices.map(price => ({
        ...price,
        price_eur_per_mwh: price.price_eur_per_mwh.toString()
      })))
      .execute();

    const input: GetMarketPricesInput = {
      from_date: new Date('2024-01-15T10:30:00Z'),
      to_date: new Date('2024-01-15T23:59:59Z')
    };

    const result = await getMarketPrices(input);

    expect(result).toHaveLength(2);
    result.forEach(price => {
      expect(price.timestamp.getTime()).toBeGreaterThanOrEqual(input.from_date!.getTime());
      expect(price.timestamp.getTime()).toBeLessThanOrEqual(input.to_date!.getTime());
    });
  });

  it('should apply limit correctly', async () => {
    // Insert test data
    await db.insert(marketPricesTable)
      .values(testMarketPrices.map(price => ({
        ...price,
        price_eur_per_mwh: price.price_eur_per_mwh.toString()
      })))
      .execute();

    const input: GetMarketPricesInput = {
      limit: 2
    };

    const result = await getMarketPrices(input);

    expect(result).toHaveLength(2);
    
    // Should still be ordered by timestamp desc
    expect(result[0].timestamp.getTime()).toBeGreaterThan(result[1].timestamp.getTime());
  });

  it('should combine multiple filters', async () => {
    // Insert test data
    await db.insert(marketPricesTable)
      .values(testMarketPrices.map(price => ({
        ...price,
        price_eur_per_mwh: price.price_eur_per_mwh.toString()
      })))
      .execute();

    const input: GetMarketPricesInput = {
      market_type: 'day_ahead',
      from_date: new Date('2024-01-15T00:00:00Z'),
      to_date: new Date('2024-01-15T23:59:59Z'),
      limit: 1
    };

    const result = await getMarketPrices(input);

    expect(result).toHaveLength(1);
    expect(result[0].market_type).toBe('day_ahead');
    expect(result[0].timestamp.getTime()).toBeGreaterThanOrEqual(input.from_date!.getTime());
    expect(result[0].timestamp.getTime()).toBeLessThanOrEqual(input.to_date!.getTime());
    expect(result[0].price_eur_per_mwh).toBe(50.25);
  });

  it('should return empty array when no matches found', async () => {
    // Insert test data
    await db.insert(marketPricesTable)
      .values(testMarketPrices.map(price => ({
        ...price,
        price_eur_per_mwh: price.price_eur_per_mwh.toString()
      })))
      .execute();

    const input: GetMarketPricesInput = {
      market_type: 'day_ahead',
      from_date: new Date('2024-01-17T00:00:00Z')
    };

    const result = await getMarketPrices(input);

    expect(result).toHaveLength(0);
  });

  it('should handle undefined input gracefully', async () => {
    // Insert test data
    await db.insert(marketPricesTable)
      .values(testMarketPrices.map(price => ({
        ...price,
        price_eur_per_mwh: price.price_eur_per_mwh.toString()
      })))
      .execute();

    const result = await getMarketPrices(undefined);

    expect(result).toHaveLength(4);
    result.forEach(price => {
      expect(typeof price.price_eur_per_mwh).toBe('number');
    });
  });
});
