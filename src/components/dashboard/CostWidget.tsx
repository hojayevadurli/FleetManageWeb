
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown } from "lucide-react";

const CostWidget = () => {
  const costData = {
    thisMonth: 12450,
    lastMonth: 11200,
    categories: {
      fuel: 7200,
      maintenance: 3800,
      parts: 1450
    }
  };

  const monthlyChange = costData.thisMonth - costData.lastMonth;
  const isIncrease = monthlyChange > 0;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isIncrease ? (
              <TrendingUp className="h-5 w-5 text-red-600" />
            ) : (
              <TrendingDown className="h-5 w-5 text-green-600" />
            )}
            Cost Tracking
          </div>
          <div className="text-right">
            <div className="text-lg font-bold">${costData.thisMonth.toLocaleString()}</div>
            <div className={`text-xs ${isIncrease ? 'text-red-600' : 'text-green-600'}`}>
              {isIncrease ? '+' : ''}${monthlyChange.toLocaleString()}
            </div>
          </div>
        </CardTitle>
        <CardDescription>Monthly fleet expenses</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="text-center">
            <div className="font-semibold">${(costData.categories.fuel / 1000).toFixed(1)}k</div>
            <div className="text-gray-500">Fuel</div>
          </div>
          <div className="text-center">
            <div className="font-semibold">${(costData.categories.maintenance / 1000).toFixed(1)}k</div>
            <div className="text-gray-500">Maintenance</div>
          </div>
          <div className="text-center">
            <div className="font-semibold">${(costData.categories.parts / 1000).toFixed(1)}k</div>
            <div className="text-gray-500">Parts</div>
          </div>
        </div>
        <Button variant="outline" size="sm" className="w-full">
          View Cost Reports
        </Button>
      </CardContent>
    </Card>
  );
};

export default CostWidget;
