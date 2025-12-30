
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AddShopDialog from "./AddShopDialog";
import EditServiceForm from "./EditServiceForm";
import { useServiceRecordForm } from "./hooks/useServiceRecordForm";
import { ServiceRecord } from "./types/ServiceHistoryTypes";

interface EditServiceHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateRecord: (record: any) => void;
  record: ServiceRecord | null;
}

const EditServiceHistoryDialog = ({ 
  open, 
  onOpenChange, 
  onUpdateRecord, 
  record 
}: EditServiceHistoryDialogProps) => {
  const [isAddShopOpen, setIsAddShopOpen] = useState(false);
  
  const {
    formData,
    isLoading,
    handleChange,
    handleVehicleChange,
    handleSubmit
  } = useServiceRecordForm({
    record,
    open,
    onUpdateRecord,
    onClose: () => onOpenChange(false)
  });

  const handleShopAdded = (shop: any) => {
    handleChange("shop_id", shop.id);
    if ((window as any).refreshShops) {
      (window as any).refreshShops();
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Service Record</DialogTitle>
          </DialogHeader>
          
          <EditServiceForm
            formData={formData}
            onFieldChange={handleChange}
            onVehicleChange={handleVehicleChange}
            onAddShop={() => setIsAddShopOpen(true)}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            onCancel={() => onOpenChange(false)}
          />
        </DialogContent>
      </Dialog>

      <AddShopDialog
        open={isAddShopOpen}
        onOpenChange={setIsAddShopOpen}
        onShopAdded={handleShopAdded}
      />
    </>
  );
};

export default EditServiceHistoryDialog;
