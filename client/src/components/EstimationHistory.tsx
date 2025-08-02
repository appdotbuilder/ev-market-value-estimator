
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import type { EvValueEstimation } from '../../../server/src/schema';

export function EstimationHistory() {
  const [estimations, setEstimations] = useState<EvValueEstimation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadEstimations = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getEvValueEstimations.query();
      setEstimations(result);
    } catch (error) {
      console.error('Failed to load estimations:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEstimations();
  }, [loadEstimations]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  if (isLoading) {
    return (
      <Card className="bg-white/90 backdrop-blur-sm">
        <CardContent className="text-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading estimation history...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">📊 Estimation History</h2>
        <p className="text-gray-600">Review previous EV value calculations and compare scenarios</p>
      </div>

      {/* Estimations List */}
      {estimations.length === 0 ? (
        <Card className="bg-white/90 backdrop-blur-sm">
          <CardContent className="text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Estimations Yet</h3>
            <p className="text-gray-500">
              Use the Value Calculator to create your first EV market value estimation.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {estimations
            .sort((a: EvValueEstimation, b: EvValueEstimation) => 
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )
            .map((estimation: EvValueEstimation) => (
              <Card key={estimation.id} className="bg-white/90 backdrop-blur-sm hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg text-gray-800">
                        Estimation #{estimation.id}
                      </CardTitle>
                      <p className="text-sm text-gray-500">
                        {estimation.created_at.toLocaleDateString()} at {estimation.created_at.toLocaleTimeString()}
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                      {formatCurrency(estimation.estimated_value_eur_per_year)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Input Parameters */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-800">Input Parameters</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Annual Kilometers:</span>
                          <span className="font-medium">{estimation.annual_km.toLocaleString()} km</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">EV Spec ID:</span>
                          <span className="font-medium">#{estimation.ev_spec_id}</span>
                        </div>
                      </div>
                    </div>

                    {/* Market Breakdown */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-800">Market Value Breakdown</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-blue-500 text-xs">Day-Ahead</Badge>
                          </div>
                          <span className="font-medium text-blue-700">
                            {formatCurrency(estimation.day_ahead_value)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-yellow-500 text-xs">Intraday</Badge>
                          </div>
                          <span className="font-medium text-yellow-700">
                            {formatCurrency(estimation.intraday_value)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-purple-500 text-xs">Imbalance</Badge>
                          </div>
                          <span className="font-medium text-purple-700">
                            {formatCurrency(estimation.imbalance_value)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          }
        </div>
      )}
    </div>
  );
}
