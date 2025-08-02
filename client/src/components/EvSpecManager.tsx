
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import type { EvSpec, CreateEvSpecInput } from '../../../server/src/schema';

interface EvSpecManagerProps {
  evSpecs: EvSpec[];
  onDataUpdate: () => void;
}

export function EvSpecManager({ evSpecs, onDataUpdate }: EvSpecManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateEvSpecInput>({
    model: '',
    battery_capacity_kwh: 0,
    efficiency_kwh_per_100km: 0,
    max_charging_power_kw: 0
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setError(null);

    try {
      await trpc.createEvSpec.mutate(formData);
      setFormData({
        model: '',
        battery_capacity_kwh: 0,
        efficiency_kwh_per_100km: 0,
        max_charging_power_kw: 0
      });
      setIsAdding(false);
      onDataUpdate();
    } catch (error) {
      console.error('Failed to create EV spec:', error);
      setError('Failed to create EV specification. Please check your inputs.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">🚗 EV Model Management</h2>
          <p className="text-gray-600">Manage electric vehicle specifications for value calculations</p>
        </div>
        <Button
          onClick={() => setIsAdding(!isAdding)}
          className="bg-green-600 hover:bg-green-700"
        >
          {isAdding ? 'Cancel' : '+ Add EV Model'}
        </Button>
      </div>

      {/* Add New EV Form */}
      {isAdding && (
        <Card className="bg-white/95 backdrop-blur-sm border-green-200">
          <CardHeader>
            <CardTitle className="text-green-800">Add New EV Model</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="model">Model Name</Label>
                  <Input
                    id="model"
                    value={formData.model}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateEvSpecInput) => ({ ...prev, model: e.target.value }))
                    }
                    placeholder="e.g., Tesla Model 3"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="battery">Battery Capacity (kWh)</Label>
                  <Input
                    id="battery"
                    type="number"
                    value={formData.battery_capacity_kwh || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateEvSpecInput) => ({
                        ...prev,
                        battery_capacity_kwh: parseFloat(e.target.value) || 0
                      }))
                    }
                    step="0.1"
                    min="10"
                    placeholder="e.g., 75.0"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="efficiency">Efficiency (kWh/100km)</Label>
                  <Input
                    id="efficiency"
                    type="number"
                    value={formData.efficiency_kwh_per_100km || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateEvSpecInput) => ({
                        ...prev,
                        efficiency_kwh_per_100km: parseFloat(e.target.value) || 0
                      }))
                    }
                    step="0.1"
                    min="5"
                    placeholder="e.g., 15.5"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="charging">Max Charging Power (kW)</Label>
                  <Input
                    id="charging"
                    type="number"
                    value={formData.max_charging_power_kw || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateEvSpecInput) => ({
                        ...prev,
                        max_charging_power_kw: parseFloat(e.target.value) || 0
                      }))
                    }
                    step="0.1"
                    min="3"
                    placeholder="e.g., 250.0"
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
                <Button type="submit" disabled={isCreating} className="bg-green-600 hover:bg-green-700">
                  {isCreating ? 'Creating...' : 'Create EV Model'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsAdding(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* EV Specifications List */}
      {evSpecs.length === 0 ? (
        <Card className="bg-white/90 backdrop-blur-sm">
          <CardContent className="text-center py-12">
            <div className="text-6xl mb-4">🚗</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No EV Models Available</h3>
            <p className="text-gray-500 mb-4">
              Add your first EV model to start calculating market values.
            </p>
            <Button onClick={() => setIsAdding(true)} className="bg-green-600 hover:bg-green-700">
              + Add First EV Model
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {evSpecs.map((spec: EvSpec) => (
            <Card key={spec.id} className="bg-white/90 backdrop-blur-sm hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-gray-800">{spec.model}</CardTitle>
                <Badge variant="outline" className="w-fit">
                  Added {spec.created_at.toLocaleDateString()}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex flex-col">
                    <span className="text-gray-500">Battery</span>
                    <span className="font-semibold text-blue-600">
                      {spec.battery_capacity_kwh} kWh
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-500">Efficiency</span>
                    <span className="font-semibold text-green-600">
                      {spec.efficiency_kwh_per_100km} kWh/100km
                    </span>
                  </div>
                  <div className="flex flex-col col-span-2">
                    <span className="text-gray-500">Max Charging Power</span>
                    <span className="font-semibold text-purple-600">
                      {spec.max_charging_power_kw} kW
                    </span>
                  </div>
                </div>

                {/* Calculated Insights */}
                <div className="pt-2 border-t border-gray-200">
                  <div className="text-xs text-gray-500 space-y-1">
                    <div>Range: ~{Math.round(spec.battery_capacity_kwh / spec.efficiency_kwh_per_100km * 100)} km</div>
                    <div>Charging time: ~{Math.round(spec.battery_capacity_kwh / spec.max_charging_power_kw * 60)} min (0-100%)</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
