
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import type { MarketPrice, CreateMarketPriceInput, MarketType } from '../../../server/src/schema';

interface MarketPriceManagerProps {
  marketPrices: MarketPrice[];
  onDataUpdate: () => void;
}

export function MarketPriceManager({ marketPrices, onDataUpdate }: MarketPriceManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateMarketPriceInput>({
    market_type: 'day_ahead' as MarketType,
    price_eur_per_mwh: 0,
    timestamp: new Date()
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setError(null);

    try {
      await trpc.createMarketPrice.mutate(formData);
      setFormData({
        market_type: 'day_ahead' as MarketType,
        price_eur_per_mwh: 0,
        timestamp: new Date()
      });
      setIsAdding(false);
      onDataUpdate();
    } catch (error) {
      console.error('Failed to create market price:', error);
      setError('Failed to create market price. Please check your inputs.');
    } finally {
      setIsCreating(false);
    }
  };

  const getMarketTypeColor = (marketType: MarketType) => {
    switch (marketType) {
      case 'day_ahead': return 'bg-blue-500';
      case 'intraday': return 'bg-yellow-500';
      case 'imbalance': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(price);
  };

  // Group prices by market type for display
  const groupedPrices = marketPrices.reduce((acc, price) => {
    if (!acc[price.market_type]) {
      acc[price.market_type] = [];
    }
    acc[price.market_type].push(price);
    return acc;
  }, {} as Record<MarketType, MarketPrice[]>);

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">📈 Market Price Management</h2>
          <p className="text-gray-600">Manage electricity market price data for accurate valuations</p>
        </div>
        <Button
          onClick={() => setIsAdding(!isAdding)}
          className="bg-yellow-600 hover:bg-yellow-700"
        >
          {isAdding ? 'Cancel' : '+ Add Price Data'}
        </Button>
      </div>

      {/* Add New Price Form */}
      {isAdding && (
        <Card className="bg-white/95 backdrop-blur-sm border-yellow-200">
          <CardHeader>
            <CardTitle className="text-yellow-800">Add Market Price Data</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="market-type">Market Type</Label>
                  <Select
                    value={formData.market_type}
                    onValueChange={(value: MarketType) =>
                      setFormData((prev: CreateMarketPriceInput) => ({ ...prev, market_type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day_ahead">Day-Ahead Market</SelectItem>
                      <SelectItem value="intraday">Intraday Market</SelectItem>
                      <SelectItem value="imbalance">Imbalance Market</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Price (EUR/MWh)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price_eur_per_mwh || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateMarketPriceInput) => ({
                        ...prev,
                        price_eur_per_mwh: parseFloat(e.target.value) || 0
                      }))
                    }
                    step="0.01"
                    placeholder="e.g., 45.50"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timestamp">Timestamp</Label>
                  <Input
                    id="timestamp"
                    type="datetime-local"
                    value={formData.timestamp instanceof Date 
                      ? formData.timestamp.toISOString().slice(0, 16)
                      : ''
                    }
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateMarketPriceInput) => ({
                        ...prev,
                        timestamp: new Date(e.target.value)
                      }))
                    }
                    required
                  />
                </div>
              </div>

              {error && (
                <Alert className="bg-red-50 border-red-200">
                  <AlertDescription className="text-red-700">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button type="submit" disabled={isCreating} className="bg-yellow-600 hover:bg-yellow-700">
                  {isCreating ? 'Adding...' : 'Add Price Data'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsAdding(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Market Prices Display */}
      {marketPrices.length === 0 ? (
        <Card className="bg-white/90 backdrop-blur-sm">
          <CardContent className="text-center py-12">
            <div className="text-6xl mb-4">📈</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Market Price Data</h3>
            <p className="text-gray-500 mb-4">
              Add market price data to improve the accuracy of EV value calculations.
            </p>
            <Button onClick={() => setIsAdding(true)} className="bg-yellow-600 hover:bg-yellow-700">
              + Add First Price Data
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Market Type Sections */}
          {(['day_ahead', 'intraday', 'imbalance'] as MarketType[]).map((marketType: MarketType) => {
            const prices = groupedPrices[marketType] || [];
            if (prices.length === 0) return null;

            return (
              <Card key={marketType} className="bg-white/90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Badge className={getMarketTypeColor(marketType)}>
                      {marketType.replace('_', '-').toUpperCase()}
                    </Badge>
                    <span className="text-lg capitalize">
                      {marketType.replace('_', ' ')} Market
                    </span>
                    <span className="text-sm text-gray-500">
                      ({prices.length} price points)
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {prices
                      .sort((a: MarketPrice, b: MarketPrice) => 
                        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                      )
                      .slice(0, 6) // Show only latest 6 entries
                      .map((price: MarketPrice) => (
                        <div key={price.id} className="p-3 border rounded-lg bg-gray-50">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-semibold text-lg">
                              {formatPrice(price.price_eur_per_mwh)}
                            </span>
                            <span className="text-xs text-gray-500">
                              /MWh
                            </span>
                          </div>
                          <div className="text-sm text-gray-600">
                            {price.timestamp.toLocaleString()}
                          </div>
                        </div>
                      ))
                    }
                  </div>
                  {prices.length > 6 && (
                    <p className="text-sm text-gray-500 mt-3 text-center">
                      ... and {prices.length - 6} more entries
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
