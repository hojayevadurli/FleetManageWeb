
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  MapPin, 
  Navigation, 
  Clock, 
  Fuel, 
  User, 
  Gauge, 
  RefreshCw,
  Calendar,
  Compass
} from "lucide-react";
// import { supabase } from "@/integrations/supabase/client"; // Removed - using backend API
import { toast } from "sonner";

interface Vehicle {
  id: string;
  vehicle_id: string;
  vin: string;
  make: string;
  model: string;
  year: number;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  motive_vehicle_id?: string;
  current_location?: any;
  last_location_update?: string;
  odometer_reading?: number;
  engine_hours?: number;
  fuel_level?: number;
  status_details?: string;
  driver_assigned?: string;
}

interface VehicleLocationDialogProps {
  vehicle: Vehicle;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const VehicleLocationDialog = ({ vehicle, open, onOpenChange }: VehicleLocationDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [locationData, setLocationData] = useState<any>(null);

  const fetchDetailedLocation = async () => {
    if (!vehicle.motive_vehicle_id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('motive-integration', {
        body: {
          action: 'get_vehicle_location',
          motiveVehicleId: vehicle.motive_vehicle_id
        }
      });

      if (error) throw error;

      if (data.success) {
        setLocationData(data.location);
      } else {
        setLocationData(data.location); // Mock data fallback
        toast.warning("Using mock location data - API unavailable");
      }
    } catch (error) {
      console.error('Location fetch error:', error);
      toast.error("Failed to fetch detailed location");
    } finally {
      setLoading(false);
    }
  };

  const formatLastUpdate = (timestamp?: string) => {
    if (!timestamp) return "Never";
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  const openInGoogleMaps = () => {
    if (vehicle.current_location?.latitude && vehicle.current_location?.longitude) {
      const url = `https://www.google.com/maps?q=${vehicle.current_location.latitude},${vehicle.current_location.longitude}`;
      window.open(url, '_blank');
    } else if (locationData?.latitude && locationData?.longitude) {
      const url = `https://www.google.com/maps?q=${locationData.latitude},${locationData.longitude}`;
      window.open(url, '_blank');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            {vehicle.vehicle_id} - Location & Details
          </DialogTitle>
          <DialogDescription>
            Complete vehicle information from Motive integration
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Basic Vehicle Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Vehicle Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Vehicle:</span>
                  <span className="font-medium">{vehicle.year} {vehicle.make} {vehicle.model}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <Badge variant={vehicle.status === 'active' ? 'default' : 'secondary'}>
                    {vehicle.status}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">VIN:</span>
                  <span className="font-mono text-sm">{vehicle.vin}</span>
                </div>
                {vehicle.motive_vehicle_id && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Motive ID:</span>
                    <span className="font-medium">{vehicle.motive_vehicle_id}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Current Location */}
          {(vehicle.current_location || locationData) && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-red-500" />
                    Current Location
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={fetchDetailedLocation}
                      disabled={loading || !vehicle.motive_vehicle_id}
                    >
                      {loading ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                      Refresh
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={openInGoogleMaps}
                    >
                      <Navigation className="h-4 w-4 mr-1" />
                      Maps
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {vehicle.current_location?.latitude && (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Coordinates:</span>
                      <span className="font-mono text-sm">
                        {vehicle.current_location.latitude.toFixed(6)}, {vehicle.current_location.longitude.toFixed(6)}
                      </span>
                    </div>
                    {vehicle.current_location.address && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Address:</span>
                        <span className="text-sm text-right max-w-xs">{vehicle.current_location.address}</span>
                      </div>
                    )}
                  </div>
                )}
                
                {locationData && (
                  <div className="space-y-2 pt-2 border-t">
                    <h4 className="font-medium text-sm text-gray-700">Real-time Data:</h4>
                    {locationData.speed !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 flex items-center gap-1">
                          <Gauge className="h-4 w-4" />
                          Speed:
                        </span>
                        <span className="font-medium">{locationData.speed} mph</span>
                      </div>
                    )}
                    {locationData.heading !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 flex items-center gap-1">
                          <Compass className="h-4 w-4" />
                          Heading:
                        </span>
                        <span className="font-medium">{locationData.heading}°</span>
                      </div>
                    )}
                    {locationData.address && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Live Address:</span>
                        <span className="text-sm text-right max-w-xs">{locationData.address}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    Last updated: {formatLastUpdate(vehicle.last_location_update)}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Vehicle Diagnostics */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Vehicle Diagnostics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {vehicle.odometer_reading && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 flex items-center gap-1">
                      <Navigation className="h-4 w-4" />
                      Odometer:
                    </span>
                    <span className="font-medium">{vehicle.odometer_reading.toLocaleString()} mi</span>
                  </div>
                )}
                
                {vehicle.engine_hours && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Engine Hours:
                    </span>
                    <span className="font-medium">{vehicle.engine_hours} hrs</span>
                  </div>
                )}
                
                {vehicle.fuel_level !== null && vehicle.fuel_level !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 flex items-center gap-1">
                      <Fuel className={`h-4 w-4 ${
                        vehicle.fuel_level < 25 ? 'text-red-500' : 
                        vehicle.fuel_level < 50 ? 'text-yellow-500' : 'text-green-500'
                      }`} />
                      Fuel Level:
                    </span>
                    <span className={`font-medium ${
                      vehicle.fuel_level < 25 ? 'text-red-500' : 
                      vehicle.fuel_level < 50 ? 'text-yellow-500' : 'text-green-500'
                    }`}>
                      {vehicle.fuel_level}%
                    </span>
                  </div>
                )}
                
                {vehicle.driver_assigned && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 flex items-center gap-1">
                      <User className="h-4 w-4" />
                      Driver:
                    </span>
                    <span className="font-medium">{vehicle.driver_assigned}</span>
                  </div>
                )}
              </div>
              
              {vehicle.status_details && (
                <div className="mt-4 pt-3 border-t">
                  <span className="text-gray-600 flex items-center gap-1 mb-1">
                    <Calendar className="h-4 w-4" />
                    Status Details:
                  </span>
                  <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                    {vehicle.status_details}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VehicleLocationDialog;
