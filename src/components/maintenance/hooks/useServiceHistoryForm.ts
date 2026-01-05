
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { serviceHistoryApi } from "@/lib/serviceHistoryApi";
import { shopsApi } from "@/lib/shopsApi";
import { parseReceipt } from "@/lib/gemini";

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

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};

export const useServiceHistoryForm = (onAddRecord: (record: any) => void, onClose: () => void) => {
  const [formData, setFormData] = useState<FormData>({
    vehicle_id: "",
    vehicle_type: "truck",
    service_date: new Date().toISOString().split('T')[0],
    work_completed: "",
    shop_id: "",
    labor_hours: "",
    total_cost: "",
    mileage: "",
    invoice_file: null
  });

  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string>("");
  const { toast } = useToast();

  const handleChange = (field: string, value: string | File | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleVehicleChange = (vehicleId: string, vehicleType: 'truck' | 'trailer') => {
    setFormData(prev => ({
      ...prev,
      vehicle_id: vehicleId,
      vehicle_type: vehicleType
    }));
  };

  const resetForm = () => {
    setFormData({
      vehicle_id: "",
      vehicle_type: "truck",
      service_date: new Date().toISOString().split('T')[0],
      work_completed: "",
      shop_id: "",
      labor_hours: "",
      total_cost: "",
      mileage: "",
      invoice_file: null
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    let finalShopId = formData.shop_id;

    try {
      // 1. If no shop selected but invoice exists -> Auto-Detect Shop
      if (!finalShopId && formData.invoice_file) {
        setLoadingMessage("Analyzing invoice...");
        try {
          const base64 = await fileToBase64(formData.invoice_file);
          const parsed = await parseReceipt(base64, formData.invoice_file.type);

          if (parsed && parsed.businessName) {
            setLoadingMessage(`Checking for ${parsed.businessName}...`);

            // Check existence (simple name match for now)
            const allShops = await shopsApi.list();
            const existingShop = allShops.find(s =>
              s.shop_name.toLowerCase() === parsed.businessName.toLowerCase()
            );

            if (existingShop) {
              finalShopId = existingShop.id;
              toast({
                title: "Shop Detected",
                description: `Linked to existing shop: ${existingShop.shop_name}`,
              });
            } else {
              setLoadingMessage(`Creating new shop: ${parsed.businessName}...`);
              // Create new shop
              const newShop = await shopsApi.create({
                shopName: parsed.businessName,
                address: parsed.businessAddress ?
                  `${parsed.businessAddress.street}, ${parsed.businessAddress.city}, ${parsed.businessAddress.state}` :
                  "Address from Invoice",
                phone: parsed.businessContact?.phone,
                email: parsed.businessContact?.email,
                website: parsed.businessContact?.website,
                rateCategory: "green", // Default to preferred
                hoursOfOperation: {},
                specialties: []
              });
              finalShopId = newShop.id;
              toast({
                title: "New Shop Integrated",
                description: `Created ${newShop.shop_name} and added to network.`,
              });

              // Trigger global refresh if available
              if ((window as any).refreshShops) {
                (window as any).refreshShops();
              }
            }
          }
        } catch (err) {
          console.warn("Auto-shop creation failed, proceeding without shop link.", err);
          // Don't block the main submission, just warn
        }
      }

      setLoadingMessage("Saving service record...");

      const payload = {
        vehicle_id: formData.vehicle_id,
        vehicle_type: formData.vehicle_type,
        service_date: formData.service_date,
        work_completed: formData.work_completed,
        shop_id: finalShopId || undefined,
        labor_hours: formData.labor_hours ? parseFloat(formData.labor_hours) : undefined,
        total_cost: formData.total_cost ? parseFloat(formData.total_cost) : undefined,
        mileage: formData.mileage ? parseInt(formData.mileage) : undefined,
        invoice_file: formData.invoice_file || undefined
      };

      const data = await serviceHistoryApi.create(payload);

      onAddRecord(data);
      onClose();
      resetForm();

      toast({
        title: "Service record added successfully",
        description: `Service record for ${data.vehicle_id} has been saved.`
      });
    } catch (error) {
      console.error('Error adding service record:', error);
      toast({
        title: "Error adding service record",
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  };

  return {
    formData,
    isLoading,
    loadingMessage,
    handleChange,
    handleVehicleChange,
    handleSubmit
  };
};
