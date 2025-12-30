
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer,
  Legend
} from "recharts";
import { 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  Wrench,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon
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

interface ServiceAnalyticsProps {
  records: ServiceRecord[];
  selectedVehicle?: string;
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

const ServiceAnalytics = ({ records, selectedVehicle }: ServiceAnalyticsProps) => {
  // Filter records if a specific vehicle is selected
  const filteredRecords = selectedVehicle && selectedVehicle !== "all" 
    ? records.filter(record => record.vehicle_id === selectedVehicle)
    : records;

  // Monthly cost analysis
  const getMonthlyCostData = () => {
    const last12Months = Array.from({ length: 12 }, (_, i) => {
      const date = subMonths(new Date(), i);
      return {
        month: format(date, 'MMM yyyy'),
        date: date,
        cost: 0,
        services: 0
      };
    }).reverse();

    filteredRecords.forEach(record => {
      if (record.total_cost) {
        const serviceDate = new Date(record.service_date);
        const monthData = last12Months.find(month => 
          isWithinInterval(serviceDate, {
            start: startOfMonth(month.date),
            end: endOfMonth(month.date)
          })
        );
        if (monthData) {
          monthData.cost += record.total_cost;
          monthData.services += 1;
        }
      }
    });

    return last12Months;
  };

  // Service type distribution
  const getServiceTypeData = () => {
    const serviceTypes: { [key: string]: number } = {};
    
    filteredRecords.forEach(record => {
      const workCompleted = record.work_completed.toLowerCase();
      let category = 'Other';
      
      if (workCompleted.includes('oil')) category = 'Oil Changes';
      else if (workCompleted.includes('brake')) category = 'Brake Service';
      else if (workCompleted.includes('tire')) category = 'Tire Service';
      else if (workCompleted.includes('inspection')) category = 'Inspections';
      else if (workCompleted.includes('preventive') || workCompleted.includes('maintenance')) category = 'Preventive';
      else if (workCompleted.includes('repair')) category = 'Repairs';
      else if (workCompleted.includes('engine')) category = 'Engine Service';
      
      serviceTypes[category] = (serviceTypes[category] || 0) + 1;
    });

    return Object.entries(serviceTypes).map(([name, value]) => ({ name, value }));
  };

  // Shop performance data
  const getShopPerformanceData = () => {
    const shopData: ShopDataMap = {};
    
    filteredRecords.forEach(record => {
      if (record.shops && record.total_cost) {
        const shopName = record.shops.shop_name;
        if (!shopData[shopName]) {
          shopData[shopName] = {
            name: shopName,
            totalCost: 0,
            serviceCount: 0,
            avgCost: 0,
            laborRate: record.shops.labor_rate,
            category: record.shops.rate_category
          };
        }
        shopData[shopName].totalCost += record.total_cost;
        shopData[shopName].serviceCount += 1;
      }
    });

    return Object.values(shopData).map(shop => ({
      ...shop,
      avgCost: shop.totalCost / shop.serviceCount
    })).sort((a, b) => b.totalCost - a.totalCost).slice(0, 10);
  };

  // Calculate key metrics
  const calculateMetrics = () => {
    const totalCost = filteredRecords.reduce((sum, record) => sum + (record.total_cost || 0), 0);
    const totalServices = filteredRecords.length;
    const avgCostPerService = totalServices > 0 ? totalCost / totalServices : 0;
    
    const currentMonth = new Date();
    const currentMonthServices = filteredRecords.filter(record => {
      const serviceDate = new Date(record.service_date);
      return serviceDate.getMonth() === currentMonth.getMonth() && 
             serviceDate.getFullYear() === currentMonth.getFullYear();
    });
    
    const monthlyServiceCount = currentMonthServices.length;
    const monthlyCost = currentMonthServices.reduce((sum, record) => sum + (record.total_cost || 0), 0);

    return {
      totalCost,
      totalServices,
      avgCostPerService,
      monthlyServiceCount,
      monthlyCost
    };
  };

  const monthlyCostData = getMonthlyCostData();
  const serviceTypeData = getServiceTypeData();
  const shopPerformanceData = getShopPerformanceData();
  const metrics = calculateMetrics();

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'];

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
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.totalCost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Across {metrics.totalServices} services
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Cost/Service</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.avgCostPerService.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Per service record
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.monthlyServiceCount}</div>
            <p className="text-xs text-muted-foreground">
              ${metrics.monthlyCost.toFixed(2)} spent
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Services</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalServices}</div>
            <p className="text-xs text-muted-foreground">
              Service records
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="cost-trends" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="cost-trends" className="flex items-center gap-2">
            <LineChartIcon className="h-4 w-4" />
            Cost Trends
          </TabsTrigger>
          <TabsTrigger value="service-types" className="flex items-center gap-2">
            <PieChartIcon className="h-4 w-4" />
            Service Types
          </TabsTrigger>
          <TabsTrigger value="shop-performance" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Shop Performance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cost-trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Cost & Service Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyCostData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="cost" orientation="left" />
                    <YAxis yAxisId="services" orientation="right" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Line 
                      yAxisId="cost" 
                      type="monotone" 
                      dataKey="cost" 
                      stroke="#2563eb" 
                      strokeWidth={2}
                      name="Cost ($)"
                    />
                    <Line 
                      yAxisId="services" 
                      type="monotone" 
                      dataKey="services" 
                      stroke="#60a5fa" 
                      strokeWidth={2}
                      name="Services"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="service-types" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Service Type Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={serviceTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {serviceTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shop-performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Shops</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={shopPerformanceData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="totalCost" fill="#2563eb" name="Total Cost ($)" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ServiceAnalytics;
