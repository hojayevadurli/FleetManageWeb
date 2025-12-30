
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, X, FileText } from "lucide-react";
import { useInspections } from "@/hooks/useInspections";

interface InspectionItem {
  category: string;
  items: string[];
}

const InspectionTemplateDialog = () => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    vehicle_type: "" as 'truck' | 'trailer' | 'both' | "",
    is_pti: false,
    fields: [{ category: "", items: [""] }] as InspectionItem[]
  });

  const { createTemplate, isCreatingTemplate } = useInspections();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.vehicle_type) {
      return;
    }

    const templateData = {
      name: formData.name,
      description: formData.description,
      vehicle_type: formData.vehicle_type as 'truck' | 'trailer' | 'both',
      is_pti: formData.is_pti,
      is_default: false,
      fields: formData.fields.filter(field => field.category && field.items.some(item => item.trim()))
    };

    createTemplate(templateData);
    setOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      vehicle_type: "",
      is_pti: false,
      fields: [{ category: "", items: [""] }]
    });
  };

  const addCategory = () => {
    setFormData({
      ...formData,
      fields: [...formData.fields, { category: "", items: [""] }]
    });
  };

  const removeCategory = (categoryIndex: number) => {
    if (formData.fields.length > 1) {
      const newFields = formData.fields.filter((_, index) => index !== categoryIndex);
      setFormData({ ...formData, fields: newFields });
    }
  };

  const updateCategory = (categoryIndex: number, category: string) => {
    const newFields = [...formData.fields];
    newFields[categoryIndex].category = category;
    setFormData({ ...formData, fields: newFields });
  };

  const addItem = (categoryIndex: number) => {
    const newFields = [...formData.fields];
    newFields[categoryIndex].items.push("");
    setFormData({ ...formData, fields: newFields });
  };

  const removeItem = (categoryIndex: number, itemIndex: number) => {
    const newFields = [...formData.fields];
    if (newFields[categoryIndex].items.length > 1) {
      newFields[categoryIndex].items.splice(itemIndex, 1);
      setFormData({ ...formData, fields: newFields });
    }
  };

  const updateItem = (categoryIndex: number, itemIndex: number, value: string) => {
    const newFields = [...formData.fields];
    newFields[categoryIndex].items[itemIndex] = value;
    setFormData({ ...formData, fields: newFields });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Create Template
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Inspection Template</DialogTitle>
          <DialogDescription>
            Create a reusable inspection template with custom categories and items.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Daily Safety Check"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicle_type">Vehicle Type *</Label>
              <Select 
                value={formData.vehicle_type} 
                onValueChange={(value: 'truck' | 'trailer' | 'both') => 
                  setFormData({ ...formData, vehicle_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select vehicle type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="truck">Truck</SelectItem>
                  <SelectItem value="trailer">Trailer</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description of this inspection template"
              rows={2}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_pti"
              checked={formData.is_pti}
              onCheckedChange={(checked) => setFormData({ ...formData, is_pti: checked })}
            />
            <Label htmlFor="is_pti">Pre-Trip Inspection (PTI)</Label>
          </div>

          {/* Inspection Categories */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Inspection Categories</Label>
              <Button type="button" variant="outline" size="sm" onClick={addCategory}>
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </div>

            {formData.fields.map((field, categoryIndex) => (
              <div key={categoryIndex} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Category name (e.g., Engine, Lights, Tires)"
                    value={field.category}
                    onChange={(e) => updateCategory(categoryIndex, e.target.value)}
                    className="flex-1"
                  />
                  {formData.fields.length > 1 && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => removeCategory(categoryIndex)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Inspection Items</Label>
                  {field.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="flex items-center gap-2">
                      <Input
                        placeholder="Inspection item (e.g., Oil level, Tire pressure)"
                        value={item}
                        onChange={(e) => updateItem(categoryIndex, itemIndex, e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addItem(categoryIndex)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      {field.items.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeItem(categoryIndex, itemIndex)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreatingTemplate}>
              {isCreatingTemplate ? "Creating..." : "Create Template"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default InspectionTemplateDialog;
