import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { equipmentApi } from "@/lib/equipmentApi";

type EquipmentType = "truck" | "trailer";

interface VehicleFormData {
  equipmentType: EquipmentType;
  number: string;
  vin: string;
  make: string;
  model: string;
  year: number;
  status: "active" | "inactive";
  plateNumber?: string;   // truck-only
  trailerType?: string;   // trailer-only
}

interface AddVehicleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVehicleAdded: () => void;
}

const AddVehicleDialog = ({
  open,
  onOpenChange,
  onVehicleAdded,
}: AddVehicleDialogProps) => {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<VehicleFormData>({
    defaultValues: {
      equipmentType: "truck",
      number: "",
      vin: "",
      make: "",
      model: "",
      year: new Date().getFullYear(),
      status: "active",
      plateNumber: "",
      trailerType: "",
    },
  });

  const suggestedMakes = [
    "Freightliner",
    "Volvo",
    "Peterbilt",
    "Kenworth",
    "Mack",
  ];

  const onSubmit = async (data: VehicleFormData) => {
    try {
      setSubmitting(true);

      const payload: any = {
        unitNumber: data.number.trim(),
        vin: data.vin.trim(),
        year: data.year || undefined,
        make: data.make.trim() || undefined,
        model: data.model.trim() || undefined,
        status: data.status as any,
        type: data.equipmentType,
        licensePlate: data.equipmentType === "truck" ? (data.plateNumber?.trim() || undefined) : undefined,
        // Map trailerType to specs or specific field if backend supports it
        // based on previous analysis trailerType is used
        trailerType: data.equipmentType === "trailer" ? (data.trailerType?.trim() || undefined) : undefined,
      };

      await equipmentApi.create(payload);

      toast({
        title: "Vehicle added",
        description: "Vehicle was successfully added to your fleet.",
      });

      form.reset({
        equipmentType: "truck",
        number: "",
        vin: "",
        make: "",
        model: "",
        year: new Date().getFullYear(),
        status: "active",
        plateNumber: "",
        trailerType: "",
      });

      onOpenChange(false);
      onVehicleAdded();
    } catch (error: any) {
      const backendMessage =
        error?.response?.data?.message ||
        error?.response?.data?.title ||
        error?.message ||
        "Failed to add vehicle";

      toast({
        title: "Error adding vehicle",
        description: backendMessage,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const equipmentType = form.watch("equipmentType");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Vehicle</DialogTitle>
          <DialogDescription>
            Enter the vehicle details below to add it to your fleet.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Equipment Type */}
            <FormField
              control={form.control}
              name="equipmentType"
              rules={{ required: true }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Equipment Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="truck">Truck</SelectItem>
                      <SelectItem value="trailer">Trailer</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Unit Number */}
            <FormField
              control={form.control}
              name="number"
              rules={{ required: "Unit number is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit Number</FormLabel>
                  <FormControl>
                    <Input placeholder="0134, 1003, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* VIN */}
            <FormField
              control={form.control}
              name="vin"
              rules={{
                required: "VIN is required",
                minLength: {
                  value: 10,
                  message: "VIN looks too short",
                },
                maxLength: {
                  value: 24,
                  message: "VIN looks too long",
                },
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>VIN</FormLabel>
                  <FormControl>
                    <Input placeholder="1HGBH41JXMN109186" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Make */}
            <FormField
              control={form.control}
              name="make"
              rules={{ required: "Make is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Make</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select make" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {suggestedMakes.map((make) => (
                        <SelectItem key={make} value={make}>
                          {make}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Model */}
            <FormField
              control={form.control}
              name="model"
              rules={{ required: "Model is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Model</FormLabel>
                  <FormControl>
                    <Input placeholder="Cascadia" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Year */}
            <FormField
              control={form.control}
              name="year"
              rules={{
                required: "Year is required",
                min: { value: 1990, message: "Year must be after 1990" },
                max: {
                  value: new Date().getFullYear() + 1,
                  message: "Year cannot be too far in the future",
                },
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Year</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="2024"
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(
                          value === "" ? undefined : parseInt(value, 10)
                        );
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Truck-specific field */}
            {equipmentType === "truck" && (
              <FormField
                control={form.control}
                name="plateNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plate Number (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="ABC 12345" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Trailer-specific field */}
            {equipmentType === "trailer" && (
              <FormField
                control={form.control}
                name="trailerType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trailer Type (optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Reefer, Dry Van, Flatbed..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Status */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Adding..." : "Add Vehicle"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddVehicleDialog;
