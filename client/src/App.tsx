
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { EvValueCalculator } from '@/components/EvValueCalculator';
import { EvSpecManager } from '@/components/EvSpecManager';
import { MarketPriceManager } from '@/components/MarketPriceManager';
import { EstimationHistory } from '@/components/EstimationHistory';
import { trpc } from '@/utils/trpc';
import type { EvSpec, MarketPrice } from '../../server/src/schema';

function App() {
  const [evSpecs, setEvSpecs] = useState<EvSpec[]>([]);
  const [marketPrices, setMarketPrices] = useState<MarketPrice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [specs, prices] = await Promise.all([
        trpc.getEvSpecs.query(),
        trpc.getMarketPrices.query({})
      ]);
      setEvSpecs(specs);
      setMarketPrices(prices);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading EV market data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            ⚡ EV Market Value Estimator
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Estimate the monetary value of Electric Vehicles in electricity markets. 
            Calculate potential revenue from day-ahead, intraday, and imbalance market participation.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">Available EV Models</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">{evSpecs.length}</div>
              <Badge variant="outline" className="mt-2 text-blue-600 border-blue-300">
                Ready for analysis
              </Badge>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-700">Market Data Points</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">{marketPrices.length}</div>
              <Badge variant="outline" className="mt-2 text-green-600 border-green-300">
                Price history available
              </Badge>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-purple-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-purple-700">Market Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900">3</div>
              <Badge variant="outline" className="mt-2 text-purple-600 border-purple-300">
                Day-ahead, Intraday, Imbalance
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="calculator" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-sm">
            <TabsTrigger value="calculator" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              💰 Value Calculator
            </TabsTrigger>
            <TabsTrigger value="ev-specs" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">
              🚗 EV Models
            </TabsTrigger>
            <TabsTrigger value="market-prices" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-white">
              📈 Market Prices
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
              📊 History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calculator" className="mt-6">
            <EvValueCalculator 
              evSpecs={evSpecs} 
              onDataUpdate={loadData}
            />
          </TabsContent>

          <TabsContent value="ev-specs" className="mt-6">
            <EvSpecManager 
              evSpecs={evSpecs} 
              onDataUpdate={loadData}
            />
          </TabsContent>

          <TabsContent value="market-prices" className="mt-6">
            <MarketPriceManager 
              marketPrices={marketPrices} 
              onDataUpdate={loadData}
            />
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <EstimationHistory />
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="text-center mt-12 text-gray-500 text-sm">
          <p>
            🌱 Empowering energy retailers with EV flexibility insights • 
            Supporting the transition to sustainable mobility
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
