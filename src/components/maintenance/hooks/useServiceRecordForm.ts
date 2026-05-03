import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import api from "@/lib/Api";
import { useToast } from "@/hooks/use-toast";
import type {
  ServiceHistoryFormData,
  ServiceRecord,
} from "../types/ServiceHistoryTypes";

interface UseServiceRecordFormProps {
  record: ServiceRecord | null;
  open: boolean;
  onUpdateRecord: (record: ServiceRecord) => void;
  onClose: () => void;
}

const SERVICE_HISTORY_ENDPOINT = "/service-history";

const emptyFormData: ServiceHistoryFormData = {
  vehicle_id: "",
  vehicle_type: "truck",
  service_date: "",
  work_completed: "",
  shop_id: "",
  labor_hours: "",
  total_cost: "",
  mileage: "",
  invoice_file: null,
};

const getSavedRecordFromResponse = (responseData: unknown): ServiceRecord => {
  const data = responseData as {
    record?: ServiceRecord;
    data?: ServiceRecord;
  };

  return data.record ?? data.data ?? (responseData as ServiceRecord);
};

const appendIfValue = (
  formData: FormData,
  key: string,
  value: string | number | null | undefined
) => {
  if (value === null || value === undefined || value === "") return;
  formData.append(key, String(value));
};

export const useServiceRecordForm = ({
  record,
  open,
  onUpdateRecord,
  onClose,
}: UseServiceRecordFormProps) => {
  const [formData, setFormData] =
    useState<ServiceHistoryFormData>(emptyFormData);

  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;

    if (record) {
      setFormData({
        vehicle_id: record.vehicle_id || "",
        vehicle_type: (record.vehicle_type as "truck" | "trailer") || "truck",
        service_date: record.service_date || "",
        work_completed: record.work_completed || "",
        shop_id: record.shop_id || "",
        labor_hours: record.labor_hours ? String(record.labor_hours) : "",
        total_cost: record.total_cost ? String(record.total_cost) : "",
        mileage: record.mileage ? String(record.mileage) : "",
        invoice_file: null,
      });
    } else {
      setFormData(emptyFormData);
    }
  }, [record, open]);

  const handleChange = (
    field: keyof ServiceHistoryFormData,
    value: string | File | null
  ) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleVehicleChange = (
    vehicleId: string,
    vehicleType: "truck" | "trailer"
  ) => {
    setFormData((previous) => ({
      ...previous,
      vehicle_id: vehicleId,
      vehicle_type: vehicleType,
    }));
  };

  const buildPayload = () => {
    const payload = new FormData();

    appendIfValue(payload, "vehicleId", formData.vehicle_id);
    appendIfValue(payload, "vehicleType", formData.vehicle_type);
    appendIfValue(payload, "serviceDate", formData.service_date);
    appendIfValue(payload, "workCompleted", formData.work_completed);
    appendIfValue(payload, "shopId", formData.shop_id);

    appendIfValue(
      payload,
      "laborHours",
      formData.labor_hours ? Number(formData.labor_hours) : null
    );

    appendIfValue(
      payload,
      "totalCost",
      formData.total_cost ? Number(formData.total_cost) : null
    );

    appendIfValue(
      payload,
      "mileage",
      formData.mileage ? Number(formData.mileage) : null
    );

    if (formData.invoice_file) {
      payload.append("invoiceFile", formData.invoice_file);
    }

    return payload;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const payload = buildPayload();

      const response = record?.id
        ? await api.put(`${SERVICE_HISTORY_ENDPOINT}/${record.id}`, payload)
        : await api.post(SERVICE_HISTORY_ENDPOINT, payload);

      const savedRecord = getSavedRecordFromResponse(response.data);

      onUpdateRecord(savedRecord);
      onClose();

      toast({
        title: record
          ? "Service record updated"
          : "Service record created",
        description: record
          ? "The service record was updated successfully."
          : "The service record was created successfully.",
      });
    } catch (error: unknown) {
      console.error("Service record save error:", error);

      const err = error as {
        response?: {
          data?: {
            message?: string;
            title?: string;
            error?: string;
          };
        };
        message?: string;
      };

      toast({
        title: record
          ? "Error updating service record"
          : "Error creating service record",
        description:
          err.response?.data?.message ||
          err.response?.data?.title ||
          err.response?.data?.error ||
          err.message ||
          "Please try again.",
        variant: "destructive",
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
    handleSubmit,
  };
};