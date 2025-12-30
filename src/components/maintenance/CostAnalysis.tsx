
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from "@/components/ui/chart";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer,
  Area,
  AreaChart
} from "recharts";
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign, 
  AlertTriangle,
  Target,
  Calculator
} from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";

interface ServiceRecord {
  id: string;
  vehicle_id: string;
  vehicle_type: string;
  service_date: string;
  work_completed: string;
  total_cost?: number;
  labor_hours?: number;
  mileage?: number;
  shops?: {
    shop_name: string;
    labor_rate: number;
    rate_category: string;
  };
}

interface CostAnalysisProps {
  records: ServiceRecord[];
  selectedVehicle?: string;
}

interface VehicleDataMap {
  [vehicleId: string]: {
    vehicle: string;
    totalCost: number;
    totalMiles: number;
    serviceCount: number;
  };
}

interface ShopDataMap {
  [shopName: string]: {
    name: string;
    totalCost: number;
    serviceCount: number;
    avgCost: number;
    laborRate: number;
    category: string;
  };
}

const CostAnalysis = ({ records, selectedVehicle }: CostAnalysisProps) => {
  // Filter records
  const filteredRecords = selectedVehicle && selectedVehicle !== "all" 
    ? records.filter(record => record.vehicle_id === selectedVehicle)
    : records;

  // Calculate cost per mile analysis
  const getCostPerMileData = () => {
    const vehicleData: VehicleDataMap = {};
    
    filteredRecords.forEach(record => {
      if (record.total_cost && record.mileage) {
        const vehicleId = record.vehicle_id;
        if (!vehicleData[vehicleId]) {
          vehicleData[vehicleId] = {
            vehicle: vehicleId,
            totalCost: 0,
            totalMiles: 0,
            serviceCount: 0
          };
        }
        vehicleData[vehicleId].totalCost += record.total_cost;
        vehicleData[vehicleId].totalMiles = Math.max(vehicleData[vehicleId].totalMiles, record.mileage);
        vehicleData[vehicleId].serviceCount += 1;
      }
    });

    return Object.values(vehicleData).map(data => ({
      ...data,
      costPerMile: data.totalMiles > 0 ? data.totalCost / data.totalMiles : 0
    })).sort((a, b) => b.costPerMile - a.costPerMile);
  };

  // Quarterly spending analysis
  const getQuarterlySpendingData = () => {
    const quarters = [];
    const currentDate = new Date();
    
    for (let i = 7; i >= 0; i--) {
      const quarterStart = new Date(currentDate.getFullYear(), Math.floor(currentDate.getMonth() / 3) * 3 - i * 3, 1);
      const quarterEnd = new Date(quarterStart.getFullYear(), quarterStart.getMonth() + 3, 0);
      
      quarters.push({
        quarter: `Q${Math.floor(quarterStart.getMonth() / 3) + 1} ${quarterStart.getFullYear()}`,
        start: quarterStart,
        end: quarterEnd,
        cost: 0,
        services: 0
      });
    }

    filteredRecords.forEach(record => {
      if (record.total_cost) {
        const serviceDate = new Date(record.service_date);
        const quarter = quarters.find(q => 
          serviceDate >= q.start && serviceDate <= q.end
        );
        if (quarter) {
          quarter.cost += record.total_cost;
          quarter.services += 1;
        }
      }
    });

    return quarters;
  };

  // Cost category breakdown
  const getCostCategoryData = () => {
    const categories = {
      'Labor': 0,
      'Parts': 0,
      'Preventive': 0,
      'Emergency Repairs': 0,
      'Inspections': 0
    };

    filteredRecords.forEach(record => {
      if (record.total_cost) {
        const workCompleted = record.work_completed.toLowerCase();
        const cost = record.total_cost;
        
        if (workCompleted.includes('emergency') || workCompleted.includes('breakdown')) {
          categories['Emergency Repairs'] += cost;
        } else if (workCompleted.includes('inspection')) {
          categories['Inspections'] += cost;
        } else if (workCompleted.includes('preventive') || workCompleted.includes('maintenance')) {
          categories['Preventive'] += cost;
        } else if (record.labor_hours && record.shops) {
          const laborCost = record.labor_hours * record.shops.labor_rate;
          categories['Labor'] += laborCost;
          categories['Parts'] += Math.max(0, cost - laborCost);
        } else {
          categories['Parts'] += cost;
        }
      }
    });

    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  };

  // Calculate trends and insights
  const calculateInsights = () => {
    const quarterlyData = getQuarterlySpendingData();
    const recentQuarters = quarterlyData.slice(-4);
    
    const currentQuarter = recentQuarters[recentQuarters.length - 1];
    const previousQuarter = recentQuarters[recentQuarters.length - 2];
    const yearAgo = quarterlyData[quarterlyData.length - 5];
    
    const quarterlyTrend = previousQuarter ? 
      ((currentQuarter.cost - previousQuarter.cost) / previousQuarter.cost) * 100 : 0;
    
    const yearOverYearTrend = yearAgo ? 
      ((currentQuarter.cost - yearAgo.cost) / yearAgo.cost) * 100 : 0;

    const totalCost = filteredRecords.reduce((sum, record) => sum + (record.total_cost || 0), 0);
    const avgQuarterlyCost = recentQuarters.reduce((sum, q) => sum + q.cost, 0) / recentQuarters.length;
    
    // Identify high-cost vehicles
    const costPerMileData = getCostPerMileData();
    const highCostVehicles = costPerMileData.filter(v => v.costPerMile > 0.5);
    
    return {
      quarterlyTrend,
      yearOverYearTrend,
      totalCost,
      avgQuarterlyCost,
      highCostVehicles: highCostVehicles.length,
      isIncreasing: quarterlyTrend > 5,
      isDecreasing: quarterlyTrend < -5
    };
  };

  const costPerMileData = getCostPerMileData();
  const quarterlySpendingData = getQuarterlySpendingData();
  const costCategoryData = getCostCategoryData();
  const insights = calculateInsights();

  const chartConfig = {
    cost: {
      label: "Cost",
      color: "#2563eb",
    },
    services: {
      label: "Services",
      color: "#60a5fa",
    },
  };

  return (
    <div className="space-y-6">
      {/* Key Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quarterly Trend</CardTitle>
            {insights.isIncreasing ? (
              <TrendingUp className="h-4 w-4 text-red-500" />
            ) : insights.isDecreasing ? (
              <TrendingDown className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {insights.quarterlyTrend > 0 ? '+' : ''}
              {insights.quarterlyTrend.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              vs previous quarter
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Year over Year</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {insights.yearOverYearTrend > 0 ? '+' : ''}
              {insights.yearOverYearTrend.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              vs same quarter last year
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Quarterly Cost</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${insights.avgQuarterlyCost.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">
              Last 4 quarters
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High-Cost Vehicles</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.highCostVehicles}</div>
            <p className="text-xs text-muted-foreground">
              Above $0.50 per mile
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Trend Alert */}
      {insights.isIncreasing && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <div>
                <h3 className="font-semibold text-orange-800">Rising Costs Detected</h3>
                <p className="text-sm text-orange-700">
                  Maintenance costs have increased by {insights.quarterlyTrend.toFixed(1)}% this quarter. 
                  Consider reviewing maintenance schedules and shop rates.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quarterly Spending Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Quarterly Spending Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={quarterlySpendingData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="quarter" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="cost"
                    stroke="#2563eb"
                    fill="#2563eb"
                    fillOpacity={0.3}
                    name="Cost ($)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Cost per Mile Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Cost per Mile by Vehicle</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={costPerMileData.slice(0, 8)} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="vehicle" type="category" width={80} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="costPerMile" fill="#2563eb" name="Cost per Mile ($)" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Cost Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Cost Category Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {costCategoryData.map((category, index) => (
              <div key={category.name} className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  ${category.value.toFixed(0)}
                </div>
                <div className="text-sm text-muted-foreground">{category.name}</div>
                <Badge variant="outline" className="mt-1">
                  {((category.value / insights.totalCost) * 100).toFixed(1)}%
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CostAnalysis;
