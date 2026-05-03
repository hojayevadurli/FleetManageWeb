import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import AddShopDialog from "@/components/shops/AddShopDialog";
import InvoiceUpload from "./InvoiceUpload";
import ServiceHistoryFormFields from "./ServiceHistoryFormFields";
import { useServiceRecordForm } from "./hooks/useServiceRecordForm";
import type { ServiceRecord } from "./types/ServiceHistoryTypes";

import { Shop } from "@/components/shops/types/ShopTypes";

interface AddServiceHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddRecord: (record: ServiceRecord) => void;
}

const AddServiceHistoryDialog = ({
  open,
  onOpenChange,
  onAddRecord,
}: AddServiceHistoryDialogProps) => {
  const [isAddShopOpen, setIsAddShopOpen] = useState(false);
  const [shopRefreshKey, setShopRefreshKey] = useState(0);

  const {
    formData,
    isLoading,
    handleChange,
    handleVehicleChange,
    handleSubmit,
  } = useServiceRecordForm({
    record: null,
    open,
    onUpdateRecord: onAddRecord,
    onClose: () => onOpenChange(false),
  });

  const handleShopAdded = (shop?: Shop) => {
    if (!shop?.id) return;

    handleChange("shop_id", String(shop.id));
    setShopRefreshKey((current) => current + 1);
    setIsAddShopOpen(false);
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
              key={shopRefreshKey}
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
                {isLoading ? "Saving..." : "Add Service Record"}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
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