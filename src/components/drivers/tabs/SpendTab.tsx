import { Driver } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, CreditCard, PieChart } from "lucide-react";

interface SpendTabProps {
    driver: Driver;
}

export function SpendTab({ driver }: SpendTabProps) {
    // Mock spend data
    const totalSpend = driver.totalSpend || 0;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Total Spend (YTD)</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">${totalSpend.toLocaleString()}</p>
                            </div>
                            <div className="h-10 w-10 bg-blue-50 rounded-full flex items-center justify-center">
                                <DollarSign className="h-5 w-5 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Avg. Weekly Spend</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">$245.00</p>
                            </div>
                            <div className="h-10 w-10 bg-purple-50 rounded-full flex items-center justify-center">
                                <TrendingUp className="h-5 w-5 text-purple-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Last Transaction</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">$45.50</p>
                                <p className="text-xs text-gray-400">Fuel Advance • 2 days ago</p>
                            </div>
                            <div className="h-10 w-10 bg-emerald-50 rounded-full flex items-center justify-center">
                                <CreditCard className="h-5 w-5 text-emerald-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-dashed">
                <CardContent className="p-12 text-center text-gray-400">
                    <PieChart className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                    <p>Transaction history and breakdown coming soon.</p>
                </CardContent>
            </Card>
        </div>
    );
}
