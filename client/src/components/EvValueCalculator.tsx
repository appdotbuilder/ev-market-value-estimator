
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import type { EvSpec, EvValueEstimation, EstimateEvValueInput } from '../../../server/src/schema';

interface EvValueCalculatorProps {
  evSpecs: EvSpec[];
  onDataUpdate: () => void;
}

export function EvValueCalculator({ evSpecs, onDataUpdate }: EvValueCalculatorProps) {
  const [formData, setFormData] = useState<EstimateEvValueInput>({
    annual_km: 15000,
    ev_spec_id: 0
  });
  const [estimation, setEstimation] = useState<EvValueEstimation | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedEvSpec = evSpecs.find((spec: EvSpec) => spec.id === formData.ev_spec_id);

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.ev_spec_id === 0) {
      setError('Please select an EV model');
      return;
    }

    setIsCalculating(true);
    setError(null);

    try {
      const result = await trpc.estimateEvValue.mutate(formData);
      setEstimation(result);
      onDataUpdate(); // Refresh data after calculation
    } catch (error) {
      console.error('Failed to calculate EV value:', error);
      setError('Failed to calculate EV value. Please try again.');
    } finally {
      setIsCalculating(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Input Form */}
      <Card className="bg-white/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🧮 Value Calculation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCalculate} className="space-y-6">
            {/* EV Model Selection */}
            <div className="space-y-2">
              <Label htmlFor="ev-spec">EV Model</Label>
              <Select
                value={formData.ev_spec_id.toString()}
                onValueChange={(value: string) =>
                  setFormData((prev: EstimateEvValueInput) => ({
                    ...prev,
                    ev_spec_id: parseInt(value)
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an EV model" />
                </SelectTrigger>
                <SelectContent>
                  {evSpecs.length === 0 ? (
                    <SelectItem value="0" disabled>
                      No EV models available - add some first
                    </SelectItem>
                  ) : (
                    evSpecs.map((spec: EvSpec) => (
                      <SelectItem key={spec.id} value={spec.id.toString()}>
                        {spec.model}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Selected EV Specs Display */}
            {selectedEvSpec && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">Selected EV Specifications</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-blue-700">Battery:</span> {selectedEvSpec.battery_capacity_kwh} kWh
                  </div>
                  <div>
                    <span className="text-blue-700">Efficiency:</span> {selectedEvSpec.efficiency_kwh_per_100km} kWh/100km
                  </div>
                  <div>
                    <span className="text-blue-700">Max Charging:</span> {selectedEvSpec.max_charging_power_kw} kW
                  </div>
                </div>
              </div>
            )}

            {/* Annual Kilometers */}
            <div className="space-y-2">
              <Label htmlFor="annual-km">Annual Kilometers Driven</Label>
              <Input
                id="annual-km"
                type="number"
                value={formData.annual_km}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: EstimateEvValueInput) => ({
                    ...prev,
                    annual_km: parseInt(e.target.value) || 0
                  }))
                }
                min="1000"
                max="100000"
                step="1000"
                placeholder="e.g., 15000"
                className="text-lg"
              />
              <p className="text-sm text-gray-600">
                Typical range: 10,000 - 25,000 km per year
              </p>
            </div>

            {error && (
              <Alert className="bg-red-50 border-red-200">
                <AlertDescription className="text-red-700">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              disabled={isCalculating || evSpecs.length === 0}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isCalculating ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Calculating...
                </>
              ) : (
                <>
                  💰 Calculate EV Value
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Results Display */}
      <Card className="bg-white/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📊 Estimation Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!estimation ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-6xl mb-4">🔍</div>
              <p>Select an EV model and annual kilometers to see the estimated market value.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Total Value */}
              <div className="text-center p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                <h3 className="text-lg font-medium text-gray-700 mb-2">Total Annual Value</h3>
                <div className="text-4xl font-bold text-green-600 mb-2">
                  {formatCurrency(estimation.estimated_value_eur_per_year)}
                </div>
                <Badge variant="outline" className="bg-white text-green-700 border-green-300">
                  Per vehicle per year
                </Badge>
              </div>

              <Separator />

              {/* Market Breakdown */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800">Market Value Breakdown</h4>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-blue-500">Day-Ahead</Badge>
                      <span className="text-sm text-gray-600">Base energy trading</span>
                    </div>
                    <span className="font-semibold text-blue-700">
                      {formatCurrency(estimation.day_ahead_value)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-yellow-500">Intraday</Badge>
                      <span className="text-sm text-gray-600">Short-term optimization</span>
                    </div>
                    <span className="font-semibold text-yellow-700">
                      {formatCurrency(estimation.intraday_value)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-purple-500">Imbalance</Badge>
                      <span className="text-sm text-gray-600">Grid balancing services</span>
                    </div>
                    <span className="font-semibold text-purple-700">
                      {formatCurrency(estimation.imbalance_value)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Additional Insights */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h5 className="font-medium text-gray-800 mb-2">Key Insights</h5>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Annual driving: {estimation.annual_km.toLocaleString()} km</li>
                  <li>• Selected model: {selectedEvSpec?.model}</li>
                  <li>• Calculation date: {estimation.created_at.toLocaleDateString()}</li>
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
