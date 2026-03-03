import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, ShieldAlert } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface WorkOrderItemData {
  type: "part" | "labor" | "fee" | "tax" | "misc" | "discount";
  description: string;
  price: number;
  quantity: number;
  partNumber?: string;
  isWarrantyClaim?: boolean;
  warrantyExpiryDate?: string;
}

interface HistoricalPart {
  description: string;
  date: string;
}

interface WorkOrderItemsProps {
  items: WorkOrderItemData[];
  onItemsChange: (items: WorkOrderItemData[]) => void;
  historicalParts?: HistoricalPart[];
}

const WorkOrderItems = ({ items, onItemsChange, historicalParts = [] }: WorkOrderItemsProps) => {
  const quickAddItems = [
    { desc: "Full Inspection", type: "labor", price: 0, qty: 1 },
    { desc: "Oil Change", type: "labor", price: 0, qty: 1 },
    { desc: "Brake Service", type: "labor", price: 0, qty: 1 },
    { desc: "Tire Rotation", type: "labor", price: 0, qty: 1 }
  ];

  const handleQuickAdd = (item: any) => {
    onItemsChange([...items, { type: item.type as any, description: item.desc, price: item.price, quantity: item.qty }]);
  };

  const updateItem = (index: number, field: keyof WorkOrderItemData, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    onItemsChange(newItems);
  };

  const handleDeleteItem = (index: number) => {
    onItemsChange(items.filter((_, i) => i !== index));
  };

  const checkGhostWarranty = (desc: string) => {
    if (!desc || desc.length < 4) return null;
    const lowerDesc = desc.toLowerCase();
    const match = historicalParts.find(p => p.description.toLowerCase().includes(lowerDesc) || lowerDesc.includes(p.description.toLowerCase()));
    return match;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          📋 Services Performed
        </h3>
      </div>

      {/* Quick Add Pills */}
      <div className="flex flex-wrap gap-2 mb-2">
        {quickAddItems.map((item) => (
          <Button
            key={item.desc}
            type="button"
            variant="outline"
            size="sm"
            className="text-[10px] h-7 px-3 rounded-full bg-slate-50 border-slate-200 text-slate-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors"
            onClick={() => handleQuickAdd(item)}
          >
            + {item.desc}
          </Button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {items.length === 0 ? (
          <div className="p-8 text-center bg-slate-50/50">
            <p className="text-slate-400 text-xs italic mb-4">No services listed yet.</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mx-auto"
              onClick={() => onItemsChange([...items, { type: "misc", description: "", quantity: 1, price: 0 }])}
            >
              <Plus className="h-4 w-4 mr-2" /> Add Service
            </Button>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {items.map((item, index) => {
              const isLabor = item.type === "labor";
              const isPart = item.type === "part";

              const qtyLabel = isLabor ? "Hours" : "Qty";
              const priceLabel = isLabor ? "Hr Rate" : "Unit Price";

              const ghostMatch = isPart ? checkGhostWarranty(item.description) : null;
              const shouldPulse = ghostMatch && !item.isWarrantyClaim;

              return (
                <li key={index} className="group p-4 hover:bg-slate-50/50 transition-colors relative border-b border-slate-100 last:border-0 rounded-lg">
                  <div className="flex flex-col gap-3">

                    {/* Top Row: Core Details */}
                    <div className="flex items-start gap-3 w-full">
                      {/* Type Dropdown */}
                      <div className="w-28 shrink-0">
                        <Label className="text-[10px] uppercase text-slate-400 font-bold mb-1 block">Type</Label>
                        <Select
                          value={(item.type || "misc").toLowerCase()}
                          onValueChange={(val: any) => updateItem(index, "type", val)}
                        >
                          <SelectTrigger className="h-8 text-xs bg-white border-slate-200">
                            <SelectValue placeholder="Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="part">Part</SelectItem>
                            <SelectItem value="labor">Labor</SelectItem>
                            <SelectItem value="fee">Fee</SelectItem>
                            <SelectItem value="tax">Tax</SelectItem>
                            <SelectItem value="misc">Misc</SelectItem>
                            <SelectItem value="discount">Discount</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Description */}
                      <div className="flex-1 min-w-0">
                        <Label className="text-[10px] uppercase text-slate-400 font-bold mb-1 block">Description</Label>
                        <Input
                          value={item.description}
                          onChange={(e) => updateItem(index, "description", e.target.value)}
                          className="bg-white px-3 h-8 font-medium text-slate-700 placeholder:text-slate-300 text-sm w-full border-slate-200"
                          placeholder="Describe service or part..."
                        />
                      </div>

                      {/* Delete button (Top Right) */}
                      <div className="pt-5 shrink-0">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                          onClick={() => handleDeleteItem(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Second Row: Numbers & Add-ons */}
                    <div className="flex flex-wrap items-end gap-x-4 gap-y-3 w-full pl-0 sm:pl-[7.75rem]">
                      {/* Quantity */}
                      <div className="w-24 sm:w-20 shrink-0">
                        <Label className="text-[10px] uppercase text-slate-400 font-bold mb-1 block">{qtyLabel}</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.quantity}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            updateItem(index, "quantity", isNaN(val) ? 0 : val);
                          }}
                          className="h-8 text-right font-mono text-xs px-2 bg-white border-slate-200"
                        />
                      </div>

                      {/* Unit Price */}
                      <div className="w-28 shrink-0">
                        <Label className="text-[10px] uppercase text-slate-400 font-bold mb-1 block">{priceLabel}</Label>
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                          <Input
                            type="number"
                            step="0.01"
                            value={item.price}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              updateItem(index, "price", isNaN(val) ? 0 : val);
                            }}
                            className="h-8 pl-6 text-right font-mono text-xs px-2 bg-white border-slate-200"
                          />
                        </div>
                      </div>

                      {/* Amount Display */}
                      <div className="w-24 shrink-0 text-right pb-1 flex-1 sm:flex-none">
                        <Label className="text-[10px] uppercase text-slate-400 font-bold mb-1 block sm:hidden text-right">Amount</Label>
                        <div className="text-sm font-black text-slate-700 font-mono">
                          ${((item.price || 0) * (item.quantity || 0)).toFixed(2)}
                        </div>
                      </div>

                      <div className="hidden sm:block flex-1"></div>

                      {/* Flex Break on small screens if needed, otherwise wrap seamlessly */}
                      <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0 border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0">
                        {/* Warranty Claim Checkbox with Ghost Warranty Hint - Available for ALL types */}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <label className={`flex items-center gap-2 px-3 h-8 rounded-md border cursor-pointer transition-all ${shouldPulse
                                ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400 ring-opacity-50 animate-pulse'
                                : item.isWarrantyClaim
                                  ? 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                                  : 'bg-white border-slate-200 hover:bg-slate-50'
                                }`}>
                                <Input
                                  type="checkbox"
                                  checked={!!item.isWarrantyClaim}
                                  onChange={(e) => updateItem(index, "isWarrantyClaim", e.target.checked)}
                                  className={`h-3.5 w-3.5 rounded ${item.isWarrantyClaim ? 'text-blue-600' : ''}`}
                                />
                                <div className="flex items-center gap-1.5 whitespace-nowrap">
                                  {shouldPulse && <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />}
                                  <span className={`text-[11px] font-bold ${shouldPulse ? 'text-amber-700' :
                                    item.isWarrantyClaim ? 'text-blue-700' : 'text-slate-600'
                                    }`}>
                                    {shouldPulse ? "Ghost Warranty Match" : "Warranty"}
                                  </span>
                                </div>
                              </label>
                            </TooltipTrigger>
                            {shouldPulse && ghostMatch && (
                              <TooltipContent side="top" className="bg-amber-100 text-amber-900 border-amber-200 text-xs font-medium max-w-[250px]">
                                A likely identical part ({ghostMatch.description}) was installed on {new Date(ghostMatch.date).toLocaleDateString()}. Is this a warranty claim?!
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </TooltipProvider>

                        {/* Warranty Expiry Date Input (Shows only if warranted) */}
                        {item.isWarrantyClaim && (
                          <div className="w-32 shrink-0 animate-in fade-in slide-in-from-left-2">
                            <Input
                              type="date"
                              value={item.warrantyExpiryDate ? item.warrantyExpiryDate.substring(0, 10) : ""}
                              onChange={(e) => updateItem(index, "warrantyExpiryDate", e.target.value)}
                              className="h-8 text-[11px] border-blue-200 bg-blue-50 text-blue-700"
                              title="Warranty Expiration Date"
                            />
                          </div>
                        )}

                        {/* Part Number Input */}
                        {isPart && (
                          <div className="w-32 shrink-0">
                            <Input
                              placeholder="Part # (Opt)"
                              value={item.partNumber || ""}
                              onChange={(e) => updateItem(index, "partNumber", e.target.value)}
                              className="h-8 text-[11px] border-dashed bg-slate-50/50"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}

            {/* Footer Add Button */}
            <li className="bg-slate-50/50 p-2 border-t border-slate-100">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full justify-start text-xs font-bold text-slate-500 hover:text-blue-600 hover:bg-white h-9"
                onClick={() => onItemsChange([...items, { type: "misc", description: "", quantity: 1, price: 0 }])}
              >
                <Plus className="h-4 w-4 mr-2" /> Add Another Line Item
              </Button>
            </li>
          </ul>
        )}
      </div>
    </div>
  );
};

export default WorkOrderItems;
