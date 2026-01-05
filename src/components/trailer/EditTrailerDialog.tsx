import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { useToast } from "@/hooks/use-toast";
import { equipmentApi } from "@/lib/equipmentApi";
import { Equipment } from "@/lib/types";

interface EditTrailerDialogProps {
  trailer: Equipment | null;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

type StatusValue = "active" | "inactive";

const EditTrailerDialog = ({
  trailer,
  open,
  onClose,
  onUpdated,
}: EditTrailerDialogProps) => {
  const { toast } = useToast();
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

  useEffect(() => {
    if (!trailer) return;
    setFormData({
      number: trailer.unitNumber ?? "",
      vin: trailer.vin ?? "",
      make: trailer.make ?? "",
      year: trailer.year ? String(trailer.year) : "",
      status:
        (trailer.status?.toLowerCase() as StatusValue) === "inactive"
          ? "inactive"
          : "active",
    });
  }, [trailer]);

  if (!trailer) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const yearNumber =
        formData.year.trim() === "" ? undefined : Number(formData.year);

      await equipmentApi.update(trailer.id, {
        unitNumber: formData.number.trim(),
        vin: formData.vin.trim(),
        year: isNaN(yearNumber as number) ? undefined : yearNumber,
        make: formData.make.trim() || undefined,
        model: trailer.model,
        purchasedAt: trailer.purchasedAt,
        type: trailer.type,
        length: trailer.length,
        weightCapacity: trailer.weightCapacity,
        status: formData.status as any,
      });

      toast({
        title: "Updated",
        description: "Trailer updated successfully",
      });

      onUpdated();
      onClose();
    } catch (error: any) {
      const message =
        error?.response?.data?.message ??
        error?.message ??
        "Failed to update trailer";

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
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Trailer {trailer.number}</DialogTitle>
          <DialogDescription>
            Update trailer information and save changes.
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
                required
              />
            </div>

            {/* Make */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="make" className="text-right">
                Make
              </Label>
              <Input
                id="make"
                value={formData.make}
                onChange={(e) =>
                  setFormData({ ...formData, make: e.target.value })
                }
                className="col-span-3"
              />
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
                min="1990"
                max="2035"
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
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditTrailerDialog;
