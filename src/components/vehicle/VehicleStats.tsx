
import { Card, CardContent } from "@/components/ui/card";
import { 
  Zap,
  TrendingUp,
  Activity
} from "lucide-react";

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
}

interface VehicleStatsProps {
  vehicles: Vehicle[];
}

const VehicleStats = ({ vehicles }: VehicleStatsProps) => {
  const activeVehicles = vehicles.filter(v => v.status === 'active').length;
  const inactiveVehicles = vehicles.filter(v => v.status === 'inactive').length;
  const totalVehicles = vehicles.length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="relative overflow-hidden bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 hover:shadow-xl transition-all duration-300 hover:scale-105">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-emerald-700 mb-1">
                {activeVehicles}
              </div>
              <div className="text-emerald-600 font-medium">Active Vehicles</div>
            </div>
            <div className="bg-emerald-200 p-3 rounded-full">
              <Zap className="h-6 w-6 text-emerald-700" />
            </div>
          </div>
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-200 rounded-full -mr-10 -mt-10 opacity-20"></div>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200 hover:shadow-xl transition-all duration-300 hover:scale-105">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-slate-700 mb-1">
                {inactiveVehicles}
              </div>
              <div className="text-slate-600 font-medium">Inactive Vehicles</div>
            </div>
            <div className="bg-slate-200 p-3 rounded-full">
              <Activity className="h-6 w-6 text-slate-700" />
            </div>
          </div>
          <div className="absolute top-0 right-0 w-20 h-20 bg-slate-200 rounded-full -mr-10 -mt-10 opacity-20"></div>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-xl transition-all duration-300 hover:scale-105">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-blue-700 mb-1">
                {totalVehicles}
              </div>
              <div className="text-blue-600 font-medium">Total Fleet</div>
            </div>
            <div className="bg-blue-200 p-3 rounded-full">
              <TrendingUp className="h-6 w-6 text-blue-700" />
            </div>
          </div>
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-200 rounded-full -mr-10 -mt-10 opacity-20"></div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VehicleStats;
