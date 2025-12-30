
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

  const uploadInvoice = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('invoices')
        .upload(fileName, file);

      if (uploadError) {
        console.warn('Invoice upload failed:', uploadError);
        toast({
          title: "Invoice upload failed",
          description: "Service record will be saved without the invoice.",
          variant: "destructive"
        });
        return null;
      }
      
      return uploadData.path;
    } catch (uploadError) {
      console.warn('Invoice upload error:', uploadError);
      toast({
        title: "Invoice upload failed",
        description: "Service record will be saved without the invoice.",
        variant: "destructive"
      });
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let invoiceUrl = null;

      if (formData.invoice_file) {
        invoiceUrl = await uploadInvoice(formData.invoice_file);
      }

      const serviceData = {
        vehicle_id: formData.vehicle_id,
        vehicle_type: formData.vehicle_type,
        service_date: formData.service_date,
        work_completed: formData.work_completed,
        shop_id: formData.shop_id || null,
        labor_hours: formData.labor_hours ? parseFloat(formData.labor_hours) : null,
        total_cost: formData.total_cost ? parseFloat(formData.total_cost) : null,
        mileage: formData.mileage ? parseInt(formData.mileage) : null,
        invoice_url: invoiceUrl
      };

      const { data, error } = await supabase
        .from('service_history')
        .insert([serviceData])
        .select(`
          *,
          shops (
            shop_name,
            address,
            shop_id,
            labor_rate,
            rate_category
          )
        `)
        .single();

      if (error) throw error;

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
    }
  };

  return {
    formData,
    isLoading,
    handleChange,
    handleVehicleChange,
    handleSubmit
  };
};
