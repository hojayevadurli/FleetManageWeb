import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
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
  Legend,
} from "recharts";
import {
  TrendingUp,
  DollarSign,
  Calendar,
  Wrench,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
} from "lucide-react";
import {
  format,
  subMonths,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  isValid,
} from "date-fns";

interface ServiceRecord {
  id: string;
  vehicle_id: string;
  vehicle_type: string;
  service_date: string;
  work_completed?: string | null;
  total_cost?: number | string | null;
  labor_hours?: number | string | null;
  mileage?: number | string | null;
  shops?: {
    shop_name?: string | null;
    labor_rate?: number | string | null;
    rate_category?: string | null;
  } | null;
}

interface ServiceAnalyticsProps {
  records: ServiceRecord[];
  selectedVehicle?: string;
}

interface ShopPerformanceRow {
  name: string;
  totalCost: number;
  serviceCount: number;
  avgCost: number;
  laborRate: number;
  category: string;
}

type ShopDataMap = Record<string, ShopPerformanceRow>;

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const numberValue = (value: number | string | null | undefined): number => {
  if (value === null || value === undefined || value === "") return 0;

  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const safeDate = (value: string): Date | null => {
  const date = new Date(value);
  return isValid(date) ? date : null;
};

const chartConfig = {
  cost: {
    label: "Cost",
    color: "#2563eb",
  },
  services: {
    label: "Services",
    color: "#60a5fa",
  },
  totalCost: {
    label: "Total Cost",
    color: "#2563eb",
  },
};

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
  "#FFC658",
];

const ServiceAnalytics = ({
  records,
  selectedVehicle,
}: ServiceAnalyticsProps) => {
  const filteredRecords =
    selectedVehicle && selectedVehicle !== "all"
      ? records.filter((record) => record.vehicle_id === selectedVehicle)
      : records;

  const getMonthlyCostData = () => {
    const last12Months = Array.from({ length: 12 }, (_, index) => {
      const date = subMonths(new Date(), index);

      return {
        month: format(date, "MMM yyyy"),
        date,
        cost: 0,
        services: 0,
      };
    }).reverse();

    filteredRecords.forEach((record) => {
      const cost = numberValue(record.total_cost);
      const serviceDate = safeDate(record.service_date);

      if (!serviceDate || cost <= 0) return;

      const monthData = last12Months.find((month) =>
        isWithinInterval(serviceDate, {
          start: startOfMonth(month.date),
          end: endOfMonth(month.date),
        })
      );

      if (!monthData) return;

      monthData.cost += cost;
      monthData.services += 1;
    });

    return last12Months;
  };

  const getServiceTypeData = () => {
    const serviceTypes: Record<string, number> = {};

    filteredRecords.forEach((record) => {
      const workCompleted = (record.work_completed || "").toLowerCase();

      let category = "Other";

      if (workCompleted.includes("oil")) category = "Oil Changes";
      else if (workCompleted.includes("brake")) category = "Brake Service";
      else if (workCompleted.includes("tire")) category = "Tire Service";
      else if (workCompleted.includes("inspection")) category = "Inspections";
      else if (
        workCompleted.includes("preventive") ||
        workCompleted.includes("maintenance") ||
        workCompleted.includes("pm service")
      ) {
        category = "Preventive";
      } else if (workCompleted.includes("repair")) category = "Repairs";
      else if (workCompleted.includes("engine")) category = "Engine Service";

      serviceTypes[category] = (serviceTypes[category] || 0) + 1;
    });

    return Object.entries(serviceTypes).map(([name, value]) => ({
      name,
      value,
    }));
  };

  const getShopPerformanceData = () => {
    const shopData: ShopDataMap = {};

    filteredRecords.forEach((record) => {
      const shopName = record.shops?.shop_name?.trim();
      const cost = numberValue(record.total_cost);

      if (!shopName || cost <= 0) return;

      if (!shopData[shopName]) {
        shopData[shopName] = {
          name: shopName,
          totalCost: 0,
          serviceCount: 0,
          avgCost: 0,
          laborRate: numberValue(record.shops?.labor_rate),
          category: record.shops?.rate_category || "Unknown",
        };
      }

      shopData[shopName].totalCost += cost;
      shopData[shopName].serviceCount += 1;
    });

    return Object.values(shopData)
      .map((shop) => ({
        ...shop,
        avgCost:
          shop.serviceCount > 0 ? shop.totalCost / shop.serviceCount : 0,
      }))
      .sort((a, b) => b.totalCost - a.totalCost)
      .slice(0, 10);
  };

  const calculateMetrics = () => {
    const totalCost = filteredRecords.reduce(
      (sum, record) => sum + numberValue(record.total_cost),
      0
    );

    const totalServices = filteredRecords.length;
    const avgCostPerService =
      totalServices > 0 ? totalCost / totalServices : 0;

    const currentMonth = new Date();

    const currentMonthServices = filteredRecords.filter((record) => {
      const serviceDate = safeDate(record.service_date);
      if (!serviceDate) return false;

      return (
        serviceDate.getMonth() === currentMonth.getMonth() &&
        serviceDate.getFullYear() === currentMonth.getFullYear()
      );
    });

    const monthlyServiceCount = currentMonthServices.length;

    const monthlyCost = currentMonthServices.reduce(
      (sum, record) => sum + numberValue(record.total_cost),
      0
    );

    return {
      totalCost,
      totalServices,
      avgCostPerService,
      monthlyServiceCount,
      monthlyCost,
    };
  };

  const monthlyCostData = getMonthlyCostData();
  const serviceTypeData = getServiceTypeData();
  const shopPerformanceData = getShopPerformanceData();
  const metrics = calculateMetrics();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currencyFormatter.format(metrics.totalCost)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across {metrics.totalServices} services
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Cost/Service
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currencyFormatter.format(metrics.avgCostPerService)}
            </div>
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
            <div className="text-2xl font-bold">
              {metrics.monthlyServiceCount}
            </div>
            <p className="text-xs text-muted-foreground">
              {currencyFormatter.format(metrics.monthlyCost)} spent
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Services
            </CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalServices}</div>
            <p className="text-xs text-muted-foreground">Service records</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="cost-trends" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="cost-trends" className="flex items-center gap-2">
            <LineChartIcon className="h-4 w-4" />
            Cost Trends
          </TabsTrigger>

          <TabsTrigger
            value="service-types"
            className="flex items-center gap-2"
          >
            <PieChartIcon className="h-4 w-4" />
            Service Types
          </TabsTrigger>

          <TabsTrigger
            value="shop-performance"
            className="flex items-center gap-2"
          >
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
                      name="Cost"
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
              {serviceTypeData.length === 0 ? (
                <div className="h-[400px] flex items-center justify-center text-sm text-muted-foreground">
                  No service type data available.
                </div>
              ) : (
                <ChartContainer config={chartConfig} className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={serviceTypeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                        }
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {serviceTypeData.map((item, index) => (
                          <Cell
                            key={`service-type-${item.name}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>

                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shop-performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Shops by Spend</CardTitle>
            </CardHeader>

            <CardContent>
              {shopPerformanceData.length === 0 ? (
                <div className="h-[400px] flex items-center justify-center text-sm text-muted-foreground">
                  No shop performance data available.
                </div>
              ) : (
                <ChartContainer config={chartConfig} className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={shopPerformanceData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={120} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar
                        dataKey="totalCost"
                        fill="#2563eb"
                        name="Total Cost"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ServiceAnalytics;