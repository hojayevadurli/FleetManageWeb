
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import VehicleCombobox from "./VehicleCombobox";
import ShopCombobox from "./ShopCombobox";

interface FormData {
  vehicle_id: string;
  vehicle_type: "truck" | "trailer";
  service_date: string;
  work_completed: string;
  shop_id: string;
  labor_hours: string;
  total_cost: string;
  mileage: string;
  invoice_file: File | null;
}

interface ServiceHistoryFormFieldsProps {
  formData: FormData;
  onFieldChange: (field: string, value: string | File | null) => void;
  onVehicleChange: (vehicleId: string, vehicleType: 'truck' | 'trailer') => void;
  onAddShop: () => void;
}

const ServiceHistoryFormFields = ({
  formData,
  onFieldChange,
  onVehicleChange,
  onAddShop
}: ServiceHistoryFormFieldsProps) => {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="vehicle_id">Vehicle ID</Label>
          <VehicleCombobox
            value={formData.vehicle_id}
            onValueChange={onVehicleChange}
          />
        </div>
        
        <div>
          <Label htmlFor="service_date">Service Date</Label>
          <Input
            id="service_date"
            type="date"
            value={formData.service_date}
            onChange={(e) => onFieldChange("service_date", e.target.value)}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="work_completed">Work Completed</Label>
        <Textarea
          id="work_completed"
          value={formData.work_completed}
          onChange={(e) => onFieldChange("work_completed", e.target.value)}
          placeholder="Describe the service performed..."
          required
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="shop_id">Shop</Label>
        <ShopCombobox
          value={formData.shop_id}
          onValueChange={(shopId) => onFieldChange("shop_id", shopId)}
          onAddShop={onAddShop}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="labor_hours">Labor Hours</Label>
          <Input
            id="labor_hours"
            type="number"
            step="0.5"
            value={formData.labor_hours}
            onChange={(e) => onFieldChange("labor_hours", e.target.value)}
            placeholder="3.5"
          />
        </div>
        
        <div>
          <Label htmlFor="total_cost">Total Cost ($)</Label>
          <Input
            id="total_cost"
            type="number"
            step="0.01"
            value={formData.total_cost}
            onChange={(e) => onFieldChange("total_cost", e.target.value)}
            placeholder="450.00"
          />
        </div>
        
        <div>
          <Label htmlFor="mileage">Mileage (Optional)</Label>
          <Input
            id="mileage"
            type="number"
            value={formData.mileage}
            onChange={(e) => onFieldChange("mileage", e.target.value)}
            placeholder="125000"
          />
        </div>
      </div>
    </>
  );
};

export default ServiceHistoryFormFields;
