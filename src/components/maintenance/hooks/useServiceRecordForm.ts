
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ServiceHistoryFormData, ServiceRecord } from "../types/ServiceHistoryTypes";

interface UseServiceRecordFormProps {
  record: ServiceRecord | null;
  open: boolean;
  onUpdateRecord: (record: any) => void;
  onClose: () => void;
}

export const useServiceRecordForm = ({ 
  record, 
  open, 
  onUpdateRecord, 
  onClose 
}: UseServiceRecordFormProps) => {
  const [formData, setFormData] = useState<ServiceHistoryFormData>({
    vehicle_id: "",
    vehicle_type: "truck",
    service_date: "",
    work_completed: "",
    shop_id: "",
    labor_hours: "",
    total_cost: "",
    mileage: "",
    invoice_file: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (record && open) {
      setFormData({
        vehicle_id: record.vehicle_id || "",
        vehicle_type: record.vehicle_type as "truck" | "trailer" || "truck",
        service_date: record.service_date || "",
        work_completed: record.work_completed || "",
        shop_id: record.shop_id || "",
        labor_hours: record.labor_hours ? record.labor_hours.toString() : "",
        total_cost: record.total_cost ? record.total_cost.toString() : "",
        mileage: record.mileage ? record.mileage.toString() : "",
        invoice_file: null
      });
    }
  }, [record, open]);

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
          description: "Service record will be updated without the new invoice.",
          variant: "destructive"
        });
        return null;
      }
      
      return uploadData.path;
    } catch (uploadError) {
      console.warn('Invoice upload error:', uploadError);
      toast({
        title: "Invoice upload failed",
        description: "Service record will be updated without the new invoice.",
        variant: "destructive"
      });
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!record) return;
    
    setIsLoading(true);

    try {
      let invoiceUrl = record.invoice_url;

      if (formData.invoice_file) {
        const newInvoiceUrl = await uploadInvoice(formData.invoice_file);
        if (newInvoiceUrl) {
          invoiceUrl = newInvoiceUrl;
        }
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
        .update(serviceData)
        .eq('id', record.id)
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

      onUpdateRecord(data);
      onClose();

      toast({
        title: "Service record updated successfully",
        description: `Service record for ${data.vehicle_id} has been updated.`
      });
    } catch (error) {
      console.error('Error updating service record:', error);
      toast({
        title: "Error updating service record",
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
