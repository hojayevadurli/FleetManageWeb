
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useInspections } from "@/hooks/useInspections";
import CustomFieldInput from "./inspection/CustomFieldInput";
import VehicleSelector from "./inspection/VehicleSelector";
import MediaUpload from "./inspection/MediaUpload";

const NewInspectionDialog = () => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    inspectionName: "",
    entity: "", // truck or trailer
    selectedVehicle: "",
    maintenanceFrequency: "",
    alert: "",
    customFields: [{ label: "", value: "", photos: null as FileList | null, videos: null as FileList | null }],
    photos: null as FileList | null,
    videos: null as FileList | null
  });
  const { toast } = useToast();
  const { createInspection, isCreatingInspection } = useInspections();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.inspectionName) {
      toast({
        title: "Error",
        description: "Please enter an inspection name",
        variant: "destructive"
      });
      return;
    }

    if (!formData.entity) {
      toast({
        title: "Error",
        description: "Please select entity type (Truck or Trailer)",
        variant: "destructive"
      });
      return;
    }

    if (!formData.selectedVehicle) {
      toast({
        title: "Error",
        description: "Please select a vehicle",
        variant: "destructive"
      });
      return;
    }

    try {
      const inspectionData = {
        vehicle_id: formData.selectedVehicle,
        vehicle_type: formData.entity,
        inspection_name: formData.inspectionName,
        inspection_date: formData.date,
        status: 'in_progress' as const,
        notes: formData.alert || undefined
      };

      createInspection(inspectionData);
      
      setOpen(false);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        inspectionName: "",
        entity: "",
        selectedVehicle: "",
        maintenanceFrequency: "",
        alert: "",
        customFields: [{ label: "", value: "", photos: null, videos: null }],
        photos: null,
        videos: null
      });
    } catch (error) {
      console.error('Error creating inspection:', error);
    }
  };

  const addCustomField = () => {
    setFormData({
      ...formData,
      customFields: [...formData.customFields, { label: "", value: "", photos: null, videos: null }]
    });
  };

  const removeCustomField = (index: number) => {
    const newFields = formData.customFields.filter((_, i) => i !== index);
    setFormData({ ...formData, customFields: newFields });
  };

  const updateCustomField = (index: number, field: string, value: any) => {
    const newFields = [...formData.customFields];
    newFields[index] = { ...newFields[index], [field]: value };
    setFormData({ ...formData, customFields: newFields });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Inspection
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Inspection</DialogTitle>
          <DialogDescription>
            Fill out the inspection details below.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Inspection Date */}
          <div className="space-y-2">
            <Label htmlFor="date" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Inspection Date
            </Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          {/* Inspection Name */}
          <div className="space-y-2">
            <Label htmlFor="inspectionName">Inspection Name *</Label>
            <Input
              id="inspectionName"
              type="text"
              placeholder="Enter inspection name"
              value={formData.inspectionName}
              onChange={(e) => setFormData({ ...formData, inspectionName: e.target.value })}
              required
            />
          </div>

          {/* Vehicle Selection Component */}
          <VehicleSelector
            entity={formData.entity}
            selectedVehicle={formData.selectedVehicle}
            onEntityChange={(value) => setFormData({ ...formData, entity: value, selectedVehicle: "" })}
            onVehicleChange={(value) => setFormData({ ...formData, selectedVehicle: value })}
          />

          {/* Maintenance Frequency (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="frequency">Maintenance Frequency (Optional)</Label>
            <Select 
              value={formData.maintenanceFrequency} 
              onValueChange={(value) => setFormData({ ...formData, maintenanceFrequency: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="semi-annual">Semi-Annual</SelectItem>
                <SelectItem value="annual">Annual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Alert */}
          <div className="space-y-2">
            <Label htmlFor="alert">Alert</Label>
            <Textarea
              id="alert"
              placeholder="Enter any alerts or important notes"
              value={formData.alert}
              onChange={(e) => setFormData({ ...formData, alert: e.target.value })}
              rows={3}
            />
          </div>

          {/* Custom Fields */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Custom Fields</Label>
              <Button type="button" variant="outline" size="sm" onClick={addCustomField}>
                <Plus className="h-4 w-4 mr-2" />
                Add Field
              </Button>
            </div>

            {formData.customFields.map((field, index) => (
              <CustomFieldInput
                key={index}
                field={field}
                index={index}
                onUpdate={updateCustomField}
                onRemove={removeCustomField}
                canRemove={formData.customFields.length > 1}
              />
            ))}
          </div>

          {/* General Photos and Videos */}
          <MediaUpload
            photos={formData.photos}
            videos={formData.videos}
            onPhotosChange={(files) => setFormData({ ...formData, photos: files })}
            onVideosChange={(files) => setFormData({ ...formData, videos: files })}
          />

          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-700"
              disabled={isCreatingInspection}
            >
              {isCreatingInspection ? "Creating..." : "Create Inspection"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewInspectionDialog;
