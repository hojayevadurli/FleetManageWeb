
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit2, Check, X, Trash2 } from "lucide-react";

export interface WorkOrderItemData {
  description: string;
  price: number;
  quantity: number;
}

interface WorkOrderItemsProps {
  items: WorkOrderItemData[];
  onItemsChange: (items: WorkOrderItemData[]) => void;
}

const WorkOrderItems = ({ items, onItemsChange }: WorkOrderItemsProps) => {
  // Quick add just appends a row with default values
  const quickAddItems = [
    "Full Inspection",
    "Oil Change",
    "Brake Service",
    "Tire Rotation",
    "Battery Check",
    "Fluid Top-off"
  ];

  const handleQuickAdd = (description: string) => {
    onItemsChange([...items, { description, price: 0, quantity: 1 }]);
  };

  const handleUpdateItem = (index: number, field: keyof WorkOrderItemData, value: string | number) => {
    const newItems = [...items];
    const currentItem = newItems[index];

    if (field === 'description') {
      currentItem.description = value as string;
    } else if (field === 'price') {
      currentItem.price = parseFloat(value as string) || 0;
    } else if (field === 'quantity') {
      currentItem.quantity = parseFloat(value as string) || 0;
    }

    onItemsChange(newItems);
  };

  const handleDeleteItem = (index: number) => {
    onItemsChange(items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Label className="text-base font-semibold">Work Order Items</Label>
      </div>

      {/* Quick Add Pills */}
      <div className="flex flex-wrap gap-2">
        {quickAddItems.map((item) => (
          <Button
            key={item}
            type="button"
            variant="outline"
            size="sm"
            className="text-xs rounded-full"
            onClick={() => handleQuickAdd(item)}
          >
            + {item}
          </Button>
        ))}
      </div>

      <div className="border rounded-xl overflow-hidden bg-white shadow-sm">
        <table className="w-full text-sm item-table">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest w-[40%]">Service Description</th>
              <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest w-[15%]">Qty</th>
              <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest w-[20%]">Unit Price</th>
              <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest w-[20%]">Amount</th>
              <th className="px-6 py-4 w-[5%]"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {items.map((item, index) => (
              <tr key={index} className="group hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <Input
                    value={item.description}
                    onChange={(e) => handleUpdateItem(index, 'description', e.target.value)}
                    className="border-transparent bg-transparent hover:bg-white focus:bg-white px-0 font-bold text-slate-900 placeholder:text-slate-300 transition-all"
                    placeholder="Description"
                  />
                </td>
                <td className="px-6 py-4 text-center">
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleUpdateItem(index, 'quantity', e.target.value)}
                    className="border-transparent bg-transparent hover:bg-white focus:bg-white px-0 text-center font-bold text-slate-700 h-8 w-20 mx-auto"
                  />
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="relative">
                    <span className="absolute left-auto right-full mr-2 top-1.5 text-slate-400 text-xs">$</span>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.price || ''}
                      onChange={(e) => handleUpdateItem(index, 'price', e.target.value)}
                      className="border-transparent bg-transparent hover:bg-white focus:bg-white text-right font-mono font-bold text-slate-600 h-8 w-24 ml-auto"
                      placeholder="0.00"
                    />
                  </div>
                </td>
                <td className="px-6 py-4 text-right font-mono font-black text-slate-900">
                  ${((item.price || 0) * (item.quantity || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-4 text-right">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                    onClick={() => handleDeleteItem(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}

            {/* Empty State / Add Row */}
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-xs italic">
                  No items added. Use the quick add buttons above or click "Add Item" below.
                </td>
              </tr>
            )}
          </tbody>
          <tfoot className="bg-slate-50/50 border-t border-slate-100">
            <tr>
              <td colSpan={5} className="px-2 py-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full justify-start text-slate-500 hover:text-blue-600 hover:bg-blue-50 py-6"
                  onClick={() => onItemsChange([...items, { description: "New Item", quantity: 1, price: 0 }])}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {items.length > 0 && (
        <div className="flex justify-end gap-6 px-6 text-sm">
          <div className="text-slate-500 uppercase font-bold text-[10px] tracking-widest py-1">Total Estimated Cost</div>
          <div className="font-mono font-black text-lg text-slate-900">
            ${items.reduce((acc, item) => acc + ((item.price || 0) * (item.quantity || 0)), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkOrderItems;
