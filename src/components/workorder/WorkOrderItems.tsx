import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, X } from "lucide-react";

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

  const handleUpdateDescription = (index: number, value: string) => {
    const newItems = [...items];
    newItems[index].description = value;
    onItemsChange(newItems);
  };

  const handleDeleteItem = (index: number) => {
    onItemsChange(items.filter((_, i) => i !== index));
  };

  const totalCost = items.reduce((acc, item) => acc + ((item.price || 0) * (item.quantity || 0)), 0);

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
            key={item}
            type="button"
            variant="outline"
            size="sm"
            className="text-[10px] h-7 px-3 rounded-full bg-slate-50 border-slate-200 text-slate-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors"
            onClick={() => handleQuickAdd(item)}
          >
            + {item}
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
              onClick={() => onItemsChange([...items, { description: "", quantity: 1, price: 0 }])}
            >
              <Plus className="h-4 w-4 mr-2" /> Add Service
            </Button>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {items.map((item, index) => (
              <li key={index} className="group flex items-center p-3 hover:bg-slate-50 transition-colors">
                <span className="text-slate-300 mr-3 text-lg">•</span>
                <div className="flex-1">
                  <Input
                    value={item.description}
                    onChange={(e) => handleUpdateDescription(index, e.target.value)}
                    className="border-transparent bg-transparent hover:bg-white focus:bg-white px-2 h-8 font-medium text-slate-700 placeholder:text-slate-300 transition-all text-sm w-full"
                    placeholder="Describe service performed..."
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-slate-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                  onClick={() => handleDeleteItem(index)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </li>
            ))}
            {/* Footer Add Button */}
            <li className="bg-slate-50/50 p-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full justify-start text-xs text-slate-400 hover:text-blue-600 h-8"
                onClick={() => onItemsChange([...items, { description: "", quantity: 1, price: 0 }])}
              >
                <Plus className="h-3 w-3 mr-2" /> Add Another Line Item
              </Button>
            </li>
          </ul>
        )}
      </div>

      {/* Total Cost Display at Bottom */}
      <div className="flex justify-end items-center gap-4 pt-2">
        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Total Cost</span>
        <div className="font-mono font-black text-xl text-slate-900 bg-slate-100 px-3 py-1 rounded-lg">
          ${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      </div>
    </div>
  );
};

export default WorkOrderItems;
