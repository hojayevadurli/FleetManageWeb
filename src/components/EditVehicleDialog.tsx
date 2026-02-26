import { useEffect, useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/Api.temp";

interface Vehicle {
  id: string;
  vehicle_id: string;
  vin: string;
  make: string;
  model: string;
  year: number;
  status: "active" | "inactive";
  motive_vehicle_id?: string;
  current_location?: any;
  last_location_update?: string;
  odometer_reading?: number;
  engine_hours?: number;
  fuel_level?: number;
  status_details?: string;
  driver_assigned?: string;
}

interface VehicleFormData {
  vehicle_id: string;
  vin: string;
  make: string;
  model: string;
  year: number;
  status: "active" | "inactive";
  motive_vehicle_id?: string;
  odometer_reading?: number;
  engine_hours?: number;
  fuel_level?: number;
  status_details?: string;
  driver_assigned?: string;
}

interface EditVehicleDialogProps {
  vehicle: Vehicle | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVehicleUpdated: () => void;
}

const EditVehicleDialog = ({
  vehicle,
  open,
  onOpenChange,
  onVehicleUpdated,
}: EditVehicleDialogProps) => {
  const [motiveIntegrationEnabled, setMotiveIntegrationEnabled] = useState(
    !!vehicle?.motive_vehicle_id
  );
  const { toast } = useToast();

  const form = useForm<VehicleFormData>({
    defaultValues: {
      vehicle_id: vehicle?.vehicle_id || "",
      vin: vehicle?.vin || "",
      make: vehicle?.make || "",
      model: vehicle?.model || "",
      year: vehicle?.year || new Date().getFullYear(),
      status: vehicle?.status || "active",
      motive_vehicle_id: vehicle?.motive_vehicle_id || "",
      odometer_reading: vehicle?.odometer_reading || undefined,
      engine_hours: vehicle?.engine_hours || undefined,
      fuel_level: vehicle?.fuel_level || undefined,
      status_details: vehicle?.status_details || "",
      driver_assigned: vehicle?.driver_assigned || "",
    },
  });

  const suggestedMakes = ["Freightliner", "Volvo", "Peterbilt", "Kenworth", "Mack"];

  // Reset form values when dialog opens or vehicle changes
  useEffect(() => {
    if (vehicle && open) {
      form.reset({
        vehicle_id: vehicle.vehicle_id,
        vin: vehicle.vin,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        status: vehicle.status,
        motive_vehicle_id: vehicle.motive_vehicle_id || "",
        odometer_reading: vehicle.odometer_reading || undefined,
        engine_hours: vehicle.engine_hours || undefined,
        fuel_level: vehicle.fuel_level || undefined,
        status_details: vehicle.status_details || "",
        driver_assigned: vehicle.driver_assigned || "",
      });
      setMotiveIntegrationEnabled(!!vehicle.motive_vehicle_id);
    }
  }, [vehicle, open, form]);

  const onSubmit = async (data: VehicleFormData) => {
    if (!vehicle) return;

    try {
      // Map UI -> backend DTO (Truck)
      // Truck: Number, Vin, Year, Make, Model, PlateNumber, Mileage, EngineType, Status
      await api.put(`/trucks/${vehicle.id}`, {
        number: data.vehicle_id.trim(),
        vin: data.vin.trim(),
        year: data.year,
        make: data.make.trim(),
        model: data.model.trim(),
        plateNumber: null, // extend later if you add plate to UI
        mileage: data.odometer_reading ?? null,
        engineType: null,
        status: data.status,
      });

      // NOTE: motive_* & telemetry fields are not persisted yet on backend.
      // When you add them to your Truck entity or a separate table, extend this payload.

      toast({
        title: "Success",
        description: "Vehicle updated successfully",
      });

      onOpenChange(false);
      onVehicleUpdated();
    } catch (error: any) {
      console.error("Failed to update vehicle", error);
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.title ||
        error?.message ||
        "Failed to update vehicle";

      toast({
        title: "Error",
        description: msg,
        variant: "destructive",
      });
    }
  };

  if (!vehicle) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Vehicle - {vehicle.vehicle_id}</DialogTitle>
          <DialogDescription>
            Update vehicle details and Motive integration settings.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="vehicle_id"
                rules={{ required: "Vehicle ID is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vehicle ID</FormLabel>
                    <FormControl>
                      <Input placeholder="TR-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
            </div>

            <FormField
              control={form.control}
              name="vin"
              rules={{
                required: "VIN is required",
                minLength: { value: 17, message: "VIN must be 17 characters" },
                maxLength: { value: 17, message: "VIN must be 17 characters" },
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

            <div className="grid grid-cols-3 gap-4">
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

              <FormField
                control={form.control}
                name="year"
                rules={{
                  required: "Year is required",
                  min: { value: 1900, message: "Year must be after 1900" },
                  max: {
                    value: new Date().getFullYear() + 1,
                    message: "Year cannot be in the future",
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
                        onChange={(e) =>
                          field.onChange(
                            e.target.value
                              ? parseInt(e.target.value, 10)
                              : new Date().getFullYear()
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Motive Integration Section (UI only for now) */}
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Motive Integration</h3>
                  <p className="text-sm text-gray-600">
                    Connect this vehicle to Motive for real-time tracking
                  </p>
                </div>
                <Switch
                  checked={motiveIntegrationEnabled}
                  onCheckedChange={setMotiveIntegrationEnabled}
                />
              </div>

              {motiveIntegrationEnabled && (
                <div className="space-y-4 pl-4 border-l-2 border-blue-200">
                  <FormField
                    control={form.control}
                    name="motive_vehicle_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Motive Vehicle ID</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter Motive vehicle ID"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="odometer_reading"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Odometer Reading (miles)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="125000"
                              {...field}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value
                                    ? parseInt(e.target.value, 10)
                                    : undefined
                                )
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="engine_hours"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Engine Hours</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.1"
                              placeholder="5200.5"
                              {...field}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value
                                    ? parseFloat(e.target.value)
                                    : undefined
                                )
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="fuel_level"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fuel Level (%)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              placeholder="75"
                              {...field}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value
                                    ? parseFloat(e.target.value)
                                    : undefined
                                )
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="driver_assigned"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Assigned Driver</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="status_details"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status Details</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Additional status information"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Update Vehicle</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditVehicleDialog;
