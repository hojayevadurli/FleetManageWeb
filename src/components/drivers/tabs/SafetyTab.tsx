import { Driver, OperatorIncident } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Copy, MoreHorizontal, Truck, Check } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { incidentsApi } from "@/lib/incidentsApi";
import { format, differenceInDays } from "date-fns";
import { toast } from "sonner";

interface SafetyTabProps {
    driver?: Driver;
    refreshKey?: number;
    onAddRecord?: () => void;
}

export function SafetyTab({ driver, refreshKey = 0, onAddRecord }: SafetyTabProps) {
    const [incidents, setIncidents] = useState<OperatorIncident[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (driver?.id) {
            setLoading(true);
            incidentsApi.list(driver.id)
                .then(data => setIncidents(data))
                .catch(err => {
                    console.error("Failed to load incidents", err);
                    toast.error("Failed to load safety records");
                })
                .finally(() => setLoading(false));
        }
    }, [driver?.id, refreshKey]);

    const formatSafeDate = (dString: string) => {
        try {
            return format(new Date(dString), "MM/dd/yyyy");
        } catch {
            return dString;
        }
    };

    const formatSafeDateTime = (dString: string) => {
        try {
            return format(new Date(dString), "MM/dd/yyyy HH:mm");
        } catch {
            return dString;
        }
    };

    const getAgeColor = (days: number) => {
        if (days < 30) return "bg-green-500";
        if (days < 90) return "bg-amber-500";
        return "bg-red-500";
    };

    const mapIncident = (inc: OperatorIncident) => {
        const daysOld = differenceInDays(new Date(), new Date(inc.date));

        return {
            id: inc.reportNumber || inc.id.substring(0, 8).toUpperCase(),
            company: "Everin LLC", // Or fetch from global state
            date: formatSafeDate(inc.date),
            location: inc.location,
            age: daysOld,
            ageColor: getAgeColor(daysOld),
            insLevelTitle: inc.type,
            insLevel: inc.inspectionLevel || "",
            insLevelDesc: inc.inspectionLevel ? `Level ${inc.inspectionLevel} Inspection` : "General Inspection",
            inspectedParties: [inc.inspectedParty || inc.operatorName],
            partyBadge: inc.isAtFault ? 'Penalty' : (inc.type === 'DotInspection' && !inc.violations ? 'Reward' : ''),
            unit: inc.equipmentUnitNumber || "N/A",
            violations: [
                {
                    text: !inc.violations || inc.violations.toLowerCase() === 'no violations' ? 'No Violation' : inc.violations,
                    code: '',
                    color: !inc.violations || inc.violations.toLowerCase() === 'no violations' ? 'bg-green-500' : 'bg-red-500'
                }
            ],
            outOfService: inc.isOutOfService ? "YES" : "NO",
            fineAmount: inc.fineAmount ? `$${inc.fineAmount.toFixed(2)}` : "$0.00",
            notesTitle: inc.description || (inc.type === 'DotInspection' && (!inc.violations || inc.violations.toLowerCase() === 'no violations') ? 'CLEAN INSPECTION' : 'RECORDED'),
            notesDate: formatSafeDateTime(inc.createdAt),
            notesAuthor: "Safety Department",
            resolutionAmount: "$0.00",
            resolved: inc.status === 'Closed'
        };
    };

    const tableData = incidents.map(mapIncident);

    return (
        <div className="w-full space-y-4">
            <div className="flex justify-end items-center">
                {onAddRecord && (
                    <Button
                        variant="outline"
                        onClick={onAddRecord}
                        className="text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100 hover:text-emerald-800"
                    >
                        + Add Record
                    </Button>
                )}
            </div>

            {loading ? (
                <div className="p-4 text-center text-gray-500">Loading safety records...</div>
            ) : !incidents.length ? (
                <div className="p-8 text-center bg-white border border-gray-200 rounded-lg">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">No Safety Records Found</h3>
                    <p className="text-gray-500 text-sm">There are no incidents, inspections, or tickets associated with this driver.</p>
                </div>
            ) : (
                <>
                    {/* Mobile View - Cards */}
                    <div className="block lg:hidden space-y-4">
                        {tableData.map((row, i) => (
                            <div key={i} className="bg-white border text-left border-gray-200 rounded-lg shadow-sm p-4 flex flex-col gap-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="font-bold text-[15px] text-gray-900 leading-tight mb-0.5">{row.id}</div>
                                        <div className="text-[12px] text-gray-500">{row.company}</div>
                                    </div>
                                    <div className={`flex items-center justify-center h-6 w-6 rounded-full text-white text-[11px] font-bold ${row.ageColor}`}>
                                        {row.age}
                                    </div>
                                </div>

                                <div className="flex justify-between items-center bg-gray-50 p-2 rounded-md">
                                    <span className="font-semibold text-[13px] text-gray-900">{row.date}</span>
                                    <span className="text-[11px] text-gray-500 uppercase font-medium">{row.location}</span>
                                </div>

                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="font-bold text-[14px] text-gray-900">{row.insLevelTitle}</div>
                                        {row.insLevel && (
                                            <Badge variant="outline" className="text-[10px] uppercase h-5 text-gray-600 bg-white">L: {row.insLevel}</Badge>
                                        )}
                                    </div>
                                    <div className="text-gray-500 text-[12px]">{row.insLevelDesc}</div>
                                </div>

                                <div>
                                    <div className="text-[11px] text-gray-500 uppercase font-bold mb-2">Inspected Parties</div>
                                    {row.inspectedParties.map((party, pIdx) => (
                                        <div key={pIdx} className="mb-2 last:mb-0 bg-gray-50 p-2.5 rounded border border-gray-100">
                                            <div className="flex justify-between items-center gap-2">
                                                <span className="text-[13px] font-semibold text-gray-900">{party}</span>
                                                {pIdx === row.inspectedParties.length - 1 && row.partyBadge && (
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold tracking-wide uppercase leading-none whitespace-nowrap ${row.partyBadge === 'Penalty'
                                                        ? 'bg-[#f0e6e5] text-[#a57b77] border border-[#e8d5d3]'
                                                        : 'bg-[#e6f4ea] text-[#34A853] border border-[#d3ecd9]'
                                                        }`}>
                                                        {row.partyBadge}
                                                    </span>
                                                )}
                                            </div>
                                            {pIdx === row.inspectedParties.length - 1 && row.unit && row.unit !== "N/A" && (
                                                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-200">
                                                    <div className="bg-[#1f3a5f] text-white px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                                                        <span>{row.unit}</span>
                                                        <Truck className="h-3 w-3" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <div>
                                    <div className="text-[11px] text-gray-500 uppercase font-bold mb-2">Violations</div>
                                    <div className="flex flex-col gap-2">
                                        {row.violations.map((v, vIdx) => (
                                            <div key={vIdx} className="flex flex-col p-2.5 bg-gray-50 rounded border border-gray-100">
                                                <div className="flex items-start gap-2">
                                                    <div className={`mt-1 h-2.5 w-2.5 rounded-full flex-shrink-0 ${v.color}`} />
                                                    <span className={`text-[12px] ${v.text === 'No Violation' ? 'text-[#34A853] font-bold' : 'text-gray-700 font-medium'}`}>
                                                        {v.text}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 mt-1">
                                    <div className="bg-gray-50 p-2.5 rounded flex flex-col items-center justify-center border border-gray-100">
                                        <span className="text-gray-500 text-[10px] uppercase font-bold mb-1">Fine</span>
                                        <span className="font-bold text-[15px] text-gray-900">{row.fineAmount}</span>
                                    </div>
                                    <div className="bg-gray-50 p-2.5 rounded flex flex-col items-center justify-center border border-gray-100">
                                        <span className="text-gray-500 text-[10px] uppercase font-bold mb-1">Resolution</span>
                                        <div className="flex items-center gap-1.5">
                                            <span className="font-bold text-[15px] text-gray-900">{row.resolutionAmount}</span>
                                            {row.resolutionAmount === "$0.00" && row.resolved && <Check className="h-4 w-4 text-[#34A853]" />}
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 p-2.5 rounded flex flex-col items-center justify-center border border-gray-100">
                                        <span className="text-gray-500 text-[10px] uppercase font-bold mb-1">Out of Srv</span>
                                        <span className={`font-bold text-[12px] px-2 py-0.5 rounded ${row.outOfService === 'YES' ? 'bg-red-100 text-red-600' : 'bg-gray-200 text-gray-600'}`}>{row.outOfService}</span>
                                    </div>
                                    <div className="bg-gray-50 p-2.5 rounded flex flex-col items-center justify-center border border-gray-100">
                                        <span className="text-gray-500 text-[10px] uppercase font-bold mb-1">Actions</span>
                                        <div className="flex gap-2">
                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-gray-700 bg-white border border-gray-200">
                                                <Copy className="h-3 w-3" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-gray-700 bg-white border border-gray-200">
                                                <MoreHorizontal className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {row.notesTitle && (
                                    <div className="bg-amber-50/50 p-3 rounded border border-amber-100 mt-1">
                                        <div className="flex justify-between items-center mb-1">
                                            <div className="text-[11px] text-amber-700 uppercase font-bold">Notes</div>
                                            <div className="text-[10px] text-amber-600 font-medium">{row.notesDate}</div>
                                        </div>
                                        <div className="text-[13px] font-bold text-gray-900 mb-0.5">{row.notesTitle}</div>
                                        <div className="text-[11px] text-gray-500">{row.notesAuthor}</div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Desktop View - Table */}
                    <div className="hidden lg:block bg-white rounded-lg border border-gray-200 shadow-sm w-full">
                        <div className="overflow-x-auto w-full">
                            <Table className="min-w-max w-full">
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent border-b border-gray-200">
                                        <TableHead className="font-bold text-gray-700 py-3 whitespace-nowrap text-xs">
                                            Ins/Report #<br />
                                            Date/Location/Age
                                        </TableHead>
                                        <TableHead className="font-bold text-gray-700 py-3 whitespace-nowrap text-xs">
                                            Ins Level
                                        </TableHead>
                                        <TableHead className="font-bold text-gray-700 py-3 whitespace-nowrap text-xs">
                                            Inspected Parties
                                        </TableHead>
                                        <TableHead className="font-bold text-gray-700 py-3 text-xs w-[280px]">
                                            Violations Discovered
                                        </TableHead>
                                        <TableHead className="font-bold text-gray-700 py-3 whitespace-nowrap text-xs">
                                            Out of S...
                                        </TableHead>
                                        <TableHead className="font-bold text-gray-700 py-3 whitespace-nowrap text-xs">
                                            Fine Amo...
                                        </TableHead>
                                        <TableHead className="font-bold text-gray-700 py-3 text-xs w-[200px]">
                                            Notes
                                        </TableHead>
                                        <TableHead className="font-bold text-gray-700 py-3 whitespace-nowrap text-xs">
                                            Resolutio...
                                        </TableHead>
                                        <TableHead className="w-[40px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {tableData.map((row, i) => (
                                        <TableRow key={i} className="hover:bg-gray-50/50 border-b border-gray-100 bg-white">
                                            <TableCell className="py-4 align-top">
                                                <div className="font-bold text-[13px] text-gray-900 leading-tight">{row.id}</div>
                                                <div className="text-[11px] text-gray-500 mb-2">{row.company}</div>

                                                <div className="flex items-start gap-3 mt-4">
                                                    <div>
                                                        <div className="font-semibold text-[12px] text-gray-900 leading-tight">{row.date}</div>
                                                        <div className="text-[10px] text-gray-500 uppercase font-medium mt-0.5">{row.location}</div>
                                                    </div>
                                                    <div className={`flex items-center justify-center h-5 w-5 rounded-full text-white text-[10px] font-bold mt-1 ${row.ageColor}`}>
                                                        {row.age}
                                                    </div>
                                                </div>
                                            </TableCell>

                                            <TableCell className="py-4 align-top">
                                                <div className="font-bold text-[13px] text-gray-900 leading-tight mb-1">{row.insLevelTitle}</div>
                                                {row.insLevel && (
                                                    <div className="font-bold text-gray-800 uppercase text-[11px] mb-1">
                                                        LEVEL: {row.insLevel}
                                                    </div>
                                                )}
                                                <div className="text-gray-500 text-[11px] leading-tight max-w-[150px]">
                                                    {row.insLevelDesc}
                                                </div>
                                            </TableCell>

                                            <TableCell className="py-4 align-top">
                                                {row.inspectedParties.map((party, pIdx) => (
                                                    <div key={pIdx} className="mb-2 last:mb-0">
                                                        <div className="flex items-center gap-1.5 flex-wrap w-full">
                                                            <span className="text-[13px] font-semibold text-gray-900 whitespace-nowrap">{party}</span>
                                                            {pIdx === row.inspectedParties.length - 1 && row.partyBadge && (
                                                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold tracking-wide uppercase leading-none whitespace-nowrap ${row.partyBadge === 'Penalty'
                                                                    ? 'bg-[#f0e6e5] text-[#a57b77] border border-[#e8d5d3]'
                                                                    : 'bg-[#e6f4ea] text-[#34A853] border border-[#d3ecd9]'
                                                                    }`}>
                                                                    {row.partyBadge}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                                {row.unit && row.unit !== "N/A" && (
                                                    <div className="flex items-center gap-1 mt-2">
                                                        <div className="bg-[#1f3a5f] text-white px-1.5 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 whitespace-nowrap">
                                                            <span>{row.unit}</span>
                                                            <Truck className="h-3 w-3" />
                                                        </div>
                                                        <div className="cursor-pointer text-gray-400 hover:text-gray-600">
                                                            <Copy className="h-3 w-3" />
                                                        </div>
                                                    </div>
                                                )}
                                            </TableCell>

                                            <TableCell className="py-4 align-top">
                                                <div className="flex flex-col gap-3">
                                                    {row.violations.map((v, vIdx) => (
                                                        <div key={vIdx} className="flex flex-col">
                                                            <div className="flex items-start gap-1.5 leading-snug">
                                                                <div className={`mt-1 h-2.5 w-2.5 rounded-full flex-shrink-0 ${v.color}`} />
                                                                <span className={`text-[12px] ${v.text === 'No Violation' ? 'text-[#34A853] font-bold' : 'text-gray-700 font-medium'}`}>
                                                                    {v.text}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </TableCell>

                                            <TableCell className="py-4 align-top">
                                                <div className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-[11px] font-bold border ${row.outOfService === 'YES' ? 'bg-red-100 text-red-600 border-red-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                                                    {row.outOfService}
                                                </div>
                                            </TableCell>

                                            <TableCell className="py-4 align-top font-bold text-[13px] text-gray-900">
                                                {row.fineAmount}
                                            </TableCell>

                                            <TableCell className="py-4 align-top">
                                                <div className="text-gray-900 font-bold text-[11px] uppercase mb-2">
                                                    {row.notesTitle}
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] text-gray-500">
                                                    <span className="whitespace-nowrap">{row.notesDate}</span>
                                                    <span className="whitespace-nowrap truncate">{row.notesAuthor}</span>
                                                </div>
                                            </TableCell>

                                            <TableCell className="py-4 align-top">
                                                <div className="flex items-center gap-3">
                                                    <span className="font-bold text-[13px] text-gray-900">{row.resolutionAmount}</span>
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="p-1 bg-[#1f3a5f] text-white rounded cursor-pointer hover:opacity-90 transition-opacity">
                                                            <Copy className="h-3.5 w-3.5" />
                                                        </div>
                                                        {row.resolved && (
                                                            <div className="flex items-center gap-1 px-2 py-1 bg-[#e6f4ea] text-[#34A853] border border-[#d3ecd9] rounded-full text-[11px] font-bold">
                                                                <div className="h-3 w-3 rounded-full bg-[#34A853] flex items-center justify-center text-white">
                                                                    <Check className="h-2 w-2 stroke-[3]" />
                                                                </div>
                                                                Resolved
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>

                                            <TableCell className="py-4 align-top">
                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-gray-700 -ml-2">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
