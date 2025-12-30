
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit2, Check, X, Trash2 } from "lucide-react";

interface WorkOrderItemsProps {
  items: string[];
  onItemsChange: (items: string[]) => void;
}

const WorkOrderItems = ({ items, onItemsChange }: WorkOrderItemsProps) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [newItem, setNewItem] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  // Quick add buttons for common work items
  const quickAddItems = [
    "Full Inspection",
    "Oil Change",
    "Brake Service",
    "Tire Rotation",
    "Battery Check",
    "Fluid Top-off"
  ];

  const handleAddItem = (item: string) => {
    if (item.trim() && !items.includes(item.trim())) {
      onItemsChange([...items, item.trim()]);
    }
  };

  const handleQuickAdd = (item: string) => {
    handleAddItem(item);
  };

  const handleAddNewItem = () => {
    if (newItem.trim()) {
      handleAddItem(newItem);
      setNewItem("");
      setIsAdding(false);
    }
  };

  const handleEditItem = (index: number) => {
    setEditingIndex(index);
    setEditValue(items[index]);
  };

  const handleSaveEdit = () => {
    if (editValue.trim() && editingIndex !== null) {
      const updatedItems = [...items];
      updatedItems[editingIndex] = editValue.trim();
      onItemsChange(updatedItems);
      setEditingIndex(null);
      setEditValue("");
    }
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditValue("");
  };

  const handleDeleteItem = (index: number) => {
    const updatedItems = items.filter((_, i) => i !== index);
    onItemsChange(updatedItems);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Label className="text-base font-semibold">Work Order Items</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsAdding(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </div>

      {/* Quick Add Buttons */}
      <div className="space-y-2">
        <Label className="text-sm text-gray-600">Quick Add:</Label>
        <div className="flex flex-wrap gap-2">
          {quickAddItems.map((item) => (
            <Button
              key={item}
              type="button"
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => handleQuickAdd(item)}
              disabled={items.includes(item)}
            >
              {item}
            </Button>
          ))}
        </div>
      </div>

      {/* Add New Item Input */}
      {isAdding && (
        <Card className="border-dashed">
          <CardContent className="pt-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter work item..."
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddNewItem()}
                autoFocus
              />
              <Button
                type="button"
                size="sm"
                onClick={handleAddNewItem}
                disabled={!newItem.trim()}
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsAdding(false);
                  setNewItem("");
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Work Items List */}
      <div className="space-y-2">
        {items.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="pt-6 pb-6">
              <div className="text-center text-gray-500">
                <p className="text-sm">No work items added yet</p>
                <p className="text-xs mt-1">Use quick add buttons or add custom items</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          items.map((item, index) => (
            <Card key={index} className="hover:shadow-sm transition-shadow">
              <CardContent className="pt-3 pb-3">
                <div className="flex items-center justify-between">
                  {editingIndex === index ? (
                    <div className="flex-1 flex gap-2">
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit()}
                        className="flex-1"
                        autoFocus
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleSaveEdit}
                        disabled={!editValue.trim()}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleCancelEdit}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <span className="text-sm font-medium">{item}</span>
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditItem(index)}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteItem(index)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {items.length > 0 && (
        <div className="text-sm text-gray-600">
          {items.length} work item{items.length !== 1 ? 's' : ''} added
        </div>
      )}
    </div>
  );
};

export default WorkOrderItems;
