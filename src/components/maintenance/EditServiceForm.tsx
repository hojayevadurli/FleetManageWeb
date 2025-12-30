
import ServiceHistoryFormFields from "./ServiceHistoryFormFields";
import InvoiceUpload from "./InvoiceUpload";
import { ServiceHistoryFormData } from "./types/ServiceHistoryTypes";

interface EditServiceFormProps {
  formData: ServiceHistoryFormData;
  onFieldChange: (field: string, value: string | File | null) => void;
  onVehicleChange: (vehicleId: string, vehicleType: 'truck' | 'trailer') => void;
  onAddShop: () => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  onCancel: () => void;
}

const EditServiceForm = ({
  formData,
  onFieldChange,
  onVehicleChange,
  onAddShop,
  onSubmit,
  isLoading,
  onCancel
}: EditServiceFormProps) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <ServiceHistoryFormFields
        formData={formData}
        onFieldChange={onFieldChange}
        onVehicleChange={onVehicleChange}
        onAddShop={onAddShop}
      />

      <InvoiceUpload
        onFileChange={(file) => onFieldChange("invoice_file", file)}
        currentFile={formData.invoice_file}
      />

      <div className="flex gap-2 pt-4">
        <button 
          type="submit" 
          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50" 
          disabled={isLoading}
        >
          {isLoading ? "Updating..." : "Update Service Record"}
        </button>
        <button 
          type="button" 
          className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default EditServiceForm;
