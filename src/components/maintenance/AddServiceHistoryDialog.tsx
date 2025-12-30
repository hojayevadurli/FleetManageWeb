
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import AddShopDialog from "./AddShopDialog";
import InvoiceUpload from "./InvoiceUpload";
import ServiceHistoryFormFields from "./ServiceHistoryFormFields";
import { useServiceHistoryForm } from "./hooks/useServiceHistoryForm";

interface AddServiceHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddRecord: (record: any) => void;
}

const AddServiceHistoryDialog = ({ open, onOpenChange, onAddRecord }: AddServiceHistoryDialogProps) => {
  const [isAddShopOpen, setIsAddShopOpen] = useState(false);
  
  const {
    formData,
    isLoading,
    handleChange,
    handleVehicleChange,
    handleSubmit
  } = useServiceHistoryForm(onAddRecord, () => onOpenChange(false));

  const handleShopAdded = (shop: any) => {
    handleChange("shop_id", shop.id);
    // Refresh shops in combobox
    if ((window as any).refreshShops) {
      (window as any).refreshShops();
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Service Record</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <ServiceHistoryFormFields
              formData={formData}
              onFieldChange={handleChange}
              onVehicleChange={handleVehicleChange}
              onAddShop={() => setIsAddShopOpen(true)}
            />

            <InvoiceUpload
              onFileChange={(file) => handleChange("invoice_file", file)}
              currentFile={formData.invoice_file}
            />

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading ? "Adding..." : "Add Service Record"}
              </Button>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
            </div>
          </form>
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

export default AddServiceHistoryDialog;
