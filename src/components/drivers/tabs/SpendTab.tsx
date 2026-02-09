import { Driver } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button"; // Assuming Button component exists
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { DollarSign, TrendingUp, CreditCard, AlertTriangle, ArrowUpRight, ArrowDownRight, Filter } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

interface SpendTabProps {
    driver: Driver;
}

// Mock Data for Visuals
const transactionHistory = [
    { id: 1, date: "2024-06-01", category: "Fuel Advance", description: "Pilot Travel Center #452", amount: 45.50, linkedTo: "Advance", status: "Approved" },
    { id: 2, date: "2024-05-28", category: "Maintenance", description: "Oil Change & Filter", amount: 125.00, linkedTo: "WO-2024-001", status: "Completed" },
    { id: 3, date: "2024-05-25", category: "Toll", description: "NY Thruway Authority", amount: 28.75, linkedTo: "Deduction", status: "Processed" },
    { id: 4, date: "2024-05-20", category: "Fine", description: "Overweight Violation", amount: 150.00, linkedTo: "Deduction", status: "Pending" },
    { id: 5, date: "2024-05-15", category: "Payroll", description: "Detention Pay", amount: 75.00, linkedTo: "Payroll", status: "Approved" },
];

const spendBreakdown = [
    { name: "Fuel Advances", value: 400, color: "#3b82f6" }, // Blue
    { name: "Maintenance", value: 350, color: "#10b981" }, // Emerald
    { name: "Fines", value: 150, color: "#ef4444" }, // Red
    { name: "Tolls", value: 100, color: "#f59e0b" }, // Amber
];

const weeklyTrend = [
    { week: "W1", spend: 120 },
    { week: "W2", spend: 150 },
    { week: "W3", spend: 180 },
    { week: "W4", spend: 140 },
    { week: "W5", spend: 200 },
    { week: "W6", spend: 250 }, // Spike
    { week: "W7", spend: 160 },
    { week: "W8", spend: 140 },
    { week: "W9", spend: 130 },
    { week: "W10", spend: 150 },
    { week: "W11", spend: 190 },
    { week: "W12", spend: 245 }, // Current
];

export function SpendTab({ driver }: SpendTabProps) {
    const totalSpend = driver.totalSpend || 12450; // Mocked fallback if 0
    const avgWeeklySpend = 245.00;
    const lastTransaction = transactionHistory[0];

    // Simple Risk Logic
    const isHighRisk = weeklyTrend[weeklyTrend.length - 1].spend > weeklyTrend[weeklyTrend.length - 2].spend * 1.25;

    return (
        <div className="space-y-6">
            {/* Risk Alert */}
            {isHighRisk && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                        <h4 className="text-sm font-bold text-red-800">Unusual Spend Increase Detected</h4>
                        <p className="text-sm text-red-700 mt-1">
                            Weekly spend has increased by <strong>29%</strong> compared to last week. Review recent transactions using the table below.
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
                                <p className="text-2xl font-bold text-gray-900 mt-1">${avgWeeklySpend.toFixed(2)}</p>
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
                                <p className="text-sm font-medium text-gray-500">Cost Per Mile</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">$0.14<span className="text-sm font-normal text-gray-500">/mi</span></p>
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
                                <p className="text-2xl font-bold text-gray-900 mt-1">${lastTransaction.amount.toFixed(2)}</p>
                                <p className="text-xs text-gray-400 mt-1 truncate max-w-[120px]">{lastTransaction.category}</p>
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
                        <CardTitle className="text-base font-semibold">Spend Breakdown (YTD)</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[250px] flex items-center justify-center relative">
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
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Custom Legend */}
                        <div className="absolute bottom-0 w-full flex justify-center gap-4 text-xs">
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
                                <Tooltip formatter={(value) => [`$${value}`, "Spend"]} />
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
                            {transactionHistory.map((tx) => (
                                <TableRow key={tx.id}>
                                    <TableCell className="font-medium text-gray-700">{tx.date}</TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className={`
                                            ${tx.category === 'Fine' ? 'bg-red-100 text-red-700' :
                                                tx.category === 'Fuel Advance' ? 'bg-blue-100 text-blue-700' :
                                                    tx.category === 'Maintenance' ? 'bg-emerald-100 text-emerald-700' :
                                                        'bg-gray-100 text-gray-700'} border-none font-normal
                                        `}>
                                            {tx.category}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-gray-600">{tx.description}</TableCell>
                                    <TableCell>
                                        <span className="text-blue-600 hover:underline cursor-pointer text-sm">
                                            {tx.linkedTo}
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
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
