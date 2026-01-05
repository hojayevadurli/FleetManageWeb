// src/components/trailers/AddTrailerDialog.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { equipmentApi } from "@/lib/equipmentApi";

interface AddTrailerDialogProps {
  onTrailerAdded: () => void;
}

type StatusValue = "active" | "inactive";

const AddTrailerDialog = ({ onTrailerAdded }: AddTrailerDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<{
    number: string;
    vin: string;
    make: string;
    year: string;
    status: StatusValue;
  }>({
    number: "",
    vin: "",
    make: "",
    year: "",
    status: "active",
  });

  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const yearNumber =
        formData.year.trim() === "" ? undefined : Number(formData.year);

      await equipmentApi.create({
        unitNumber: formData.number.trim(),
        vin: formData.vin.trim(),
        year: isNaN(yearNumber as number) ? undefined : yearNumber,
        make: formData.make.trim() || undefined,
        type: "trailer", // Explicitly set type for backend discriminator
        status: formData.status as any,
        model: undefined,
        purchasedAt: undefined,
        length: undefined,
        weightCapacity: undefined,
      });

      toast({
        title: "Success",
        description: "Trailer added successfully",
      });

      setFormData({
        number: "",
        vin: "",
        make: "",
        year: "",
        status: "active",
      });

      setOpen(false);
      onTrailerAdded();
    } catch (error: any) {
      const message =
        error?.response?.data?.message ??
        error?.message ??
        "Failed to add trailer";

      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Trailer
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Trailer</DialogTitle>
          <DialogDescription>
            Enter the trailer information below to add it to your fleet.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Trailer Number */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="number" className="text-right">
                Trailer #
              </Label>
              <Input
                id="number"
                value={formData.number}
                onChange={(e) =>
                  setFormData({ ...formData, number: e.target.value })
                }
                className="col-span-3"
                placeholder="TRL-001"
                required
              />
            </div>

            {/* VIN */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="vin" className="text-right">
                VIN
              </Label>
              <Input
                id="vin"
                value={formData.vin}
                onChange={(e) =>
                  setFormData({ ...formData, vin: e.target.value })
                }
                className="col-span-3"
                placeholder="1HGBH41JXMN109186"
                required
              />
            </div>

            {/* Make */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="make" className="text-right">
                Make
              </Label>
              <Select
                value={formData.make}
                onValueChange={(value) =>
                  setFormData({ ...formData, make: value })
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select make" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Great Dane">Great Dane</SelectItem>
                  <SelectItem value="Premier">Premier</SelectItem>
                  <SelectItem value="Utility">Utility</SelectItem>
                  <SelectItem value="Wabash">Wabash</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Year */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="year" className="text-right">
                Year
              </Label>
              <Input
                id="year"
                type="number"
                value={formData.year}
                onChange={(e) =>
                  setFormData({ ...formData, year: e.target.value })
                }
                className="col-span-3"
                placeholder="2024"
                min="1990"
                max="2035"
                required
              />
            </div>

            {/* Status */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Status
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value: StatusValue) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Trailer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddTrailerDialog;
