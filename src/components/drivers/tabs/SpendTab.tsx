import { useEffect, useState } from "react";
import { Driver, OperatorSpendSummaryDto } from "@/lib/types";
import { operatorsApi } from "@/lib/operatorsApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { DollarSign, TrendingUp, CreditCard, AlertTriangle, ArrowUpRight, Filter, Loader2 } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

interface SpendTabProps {
    driver: Driver;
}

export function SpendTab({ driver }: SpendTabProps) {
    const [data, setData] = useState<OperatorSpendSummaryDto | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);

                // 1. Fetch Assignments to know what assets the driver operated and when
                const assignments = await operatorsApi.getAssignments(driver.id);
                console.log("SpendTab - Assignments:", assignments);

                if (!assignments || assignments.length === 0) {
                    setData({ totalSpend: 0, avgWeeklySpend: 0, transactions: [] });
                    return;
                }

                // 2. Identify unique assets
                const assetIds = Array.from(new Set(assignments.map(a => a.equipmentId)));
                console.log("SpendTab - Asset IDs:", assetIds);

                // 3. Fetch Work Orders for identifying assets
                // We'll fetch all WOs for each asset.
                // Improvement: If backend supported date filtering in list(), we'd use it.
                // For now, fetch recent/all for these assets.
                const allWorkOrders: any[] = [];
                for (const assetId of assetIds) {
                    // Fetch WOs for this asset
                    const wos = await import("@/lib/workOrdersApi").then(m => m.workOrdersApi.list({ equipmentId: assetId }));
                    allWorkOrders.push(...wos);
                }

                console.log("SpendTab - All WOs for assets:", allWorkOrders.length);

                // 4. Filter WOs: MUST be within an assignment period for that asset
                const relevantWOs = allWorkOrders.filter(wo => {
                    const woDate = new Date(wo.openedAt);
                    // Find any assignment for this asset that covers this date
                    return assignments.some(a => {
                        if (a.equipmentId !== wo.equipmentId) return false;

                        const start = new Date(a.startAt);
                        // If active (no end date), assume valid until forever (to include future scheduled WOs)
                        // If ended, use strict end date.
                        const end = a.endAt ? new Date(a.endAt) : new Date(8640000000000000);

                        return woDate >= start && woDate <= end;
                    });
                });

                console.log("SpendTab - Relevant WOs (during assignment):", relevantWOs.length);

                // 5. Aggregate Data
                const transactions = relevantWOs.map(wo => ({
                    id: wo.id,
                    date: wo.openedAt,
                    amount: wo.manualActualTotal || wo.estimatedTotal || 0,
                    vendor: wo.vendorName || "Unknown Vendor",
                    description: wo.title,
                    category: "Maintenance", // Default category
                    status: wo.status,
                    linkedEntityType: "Work Order",
                    linkedEntityId: wo.workOrderNumber || wo.id
                })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                const totalSpend = transactions.reduce((sum, t) => sum + t.amount, 0);

                // Calculate Tenure Duration (in weeks) to get avg
                // Simple approach: Earliest start date to Latest end date (or Now)
                // Better approach: Sum of days of all assignments
                const millisecondsInWeek = 1000 * 60 * 60 * 24 * 7;
                let totalDurationMs = 0;
                assignments.forEach(a => {
                    const start = new Date(a.startAt).getTime();
                    const end = a.endAt ? new Date(a.endAt).getTime() : Date.now();
                    totalDurationMs += (end - start);
                });
                const totalWeeks = Math.max(1, totalDurationMs / millisecondsInWeek);
                const avgWeeklySpend = totalSpend / totalWeeks;

                setData({
                    totalSpend,
                    avgWeeklySpend,
                    transactions
                });

            } catch (err) {
                console.error("Failed to load spend data", err);
                // Fallback to empty
                setData({ totalSpend: 0, avgWeeklySpend: 0, transactions: [] });
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [driver.id]);

    // Helper to keep the UI if data is loaded but empty
    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!data) return <div className="text-center p-8 text-gray-500">No spend data available.</div>;

    const { totalSpend, avgWeeklySpend, transactions } = data;
    const lastTransaction = transactions.length > 0 ? transactions[0] : null;

    // Process Spend Breakdown
    const breakdownMap = new Map<string, number>();
    transactions.forEach(t => {
        const current = breakdownMap.get(t.category) || 0;
        breakdownMap.set(t.category, current + t.amount);
    });

    const spendBreakdown = Array.from(breakdownMap.entries()).map(([name, value], idx) => ({
        name,
        value,
        color: ["#3b82f6", "#10b981", "#ef4444", "#f59e0b", "#8b5cf6"][idx % 5]
    }));

    // Process Weekly Trend (Last 12 weeks relative to now)
    // Simplified: Group by Week Start (Sunday)
    const trendMap = new Map<string, number>();
    const now = new Date();
    // Initialize last 12 weeks
    for (let i = 11; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - (i * 7));
        // Find Sunday
        const day = d.getDay();
        const diff = d.getDate() - day;
        const sunday = new Date(d.setDate(diff));
        const dateStr = sunday.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' });
        trendMap.set(dateStr, 0);
    }

    transactions.forEach(t => {
        const d = new Date(t.date);
        const day = d.getDay();
        const diff = d.getDate() - day;
        const sunday = new Date(d.setDate(diff));
        const dateStr = sunday.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' });

        if (trendMap.has(dateStr)) {
            trendMap.set(dateStr, (trendMap.get(dateStr) || 0) + t.amount);
        }
    });

    const weeklyTrend = Array.from(trendMap.entries()).map(([week, spend]) => ({ week, spend }));

    // Simple Risk Logic (Spike in last week vs avg)
    const lastWeekSpend = weeklyTrend[weeklyTrend.length - 1].spend;
    const prevWeekSpend = weeklyTrend[weeklyTrend.length - 2]?.spend || 0;
    const isHighRisk = prevWeekSpend > 0 && lastWeekSpend > prevWeekSpend * 1.5;

    return (
        <div className="space-y-6">
            {/* Risk Alert */}
            {isHighRisk && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                        <h4 className="text-sm font-bold text-red-800">Unusual Spend Increase Detected</h4>
                        <p className="text-sm text-red-700 mt-1">
                            Weekly spend has increased significantly compared to last week. Review recent transactions.
                        </p>
                    </div>
                </div>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Total Spend (YTD)</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">${totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
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
                                <p className="text-2xl font-bold text-gray-900 mt-1">${avgWeeklySpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
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
                                <p className="text-sm font-medium text-gray-500">Transactions</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{transactions.length}</p>
                            </div>
                            <div className="h-10 w-10 bg-orange-50 rounded-full flex items-center justify-center">
                                <ArrowUpRight className="h-5 w-5 text-orange-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Last Transaction</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">${lastTransaction?.amount.toFixed(2) || '0.00'}</p>
                                <p className="text-xs text-gray-400 mt-1 truncate max-w-[120px]">{lastTransaction?.category || '-'}</p>
                            </div>
                            <div className="h-10 w-10 bg-emerald-50 rounded-full flex items-center justify-center">
                                <CreditCard className="h-5 w-5 text-emerald-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Spend Breakdown */}
                <Card className="md:col-span-1">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">Spend Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[250px] flex items-center justify-center relative">
                        {spendBreakdown.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={spendBreakdown}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {spendBreakdown.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-gray-400 text-sm">No data to display</div>
                        )}
                        {/* Custom Legend */}
                        <div className="absolute bottom-0 w-full flex justify-center gap-4 text-xs flex-wrap">
                            {spendBreakdown.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                                    <span>{item.name}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Weekly Trend */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">Weekly Spend Trend (Last 12 Weeks)</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={weeklyTrend}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="week" axisLine={false} tickLine={false} fontSize={12} />
                                <YAxis axisLine={false} tickLine={false} fontSize={12} tickFormatter={(value) => `$${value}`} />
                                <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, "Spend"]} />
                                <Line type="monotone" dataKey="spend" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: "#3b82f6" }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Transaction History Table */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg font-bold">Transaction History</CardTitle>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="gap-2">
                            <Filter className="h-4 w-4" />
                            Filter
                        </Button>
                        <Button variant="outline" size="sm">
                            Export
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Linked To</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transactions.length > 0 ? transactions.map((tx) => (
                                <TableRow key={tx.id}>
                                    <TableCell className="font-medium text-gray-700">
                                        {new Date(tx.date).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className={`
                                            ${tx.category === 'Fine' ? 'bg-red-100 text-red-700' :
                                                tx.category === 'Maintenance' ? 'bg-emerald-100 text-emerald-700' :
                                                    'bg-gray-100 text-gray-700'} border-none font-normal
                                        `}>
                                            {tx.category}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-gray-600">{tx.description}</TableCell>
                                    <TableCell>
                                        <span className="text-blue-600 hover:underline cursor-pointer text-sm">
                                            {tx.linkedEntityType || "Ref"} #{tx.linkedEntityId ? tx.linkedEntityId.substring(0, 8) : "?"}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${tx.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                                            }`}>
                                            {tx.status}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-gray-900">
                                        ${tx.amount.toFixed(2)}
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                                        No recent transactions found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
