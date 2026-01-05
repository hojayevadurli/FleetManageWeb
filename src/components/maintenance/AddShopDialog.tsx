
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
// import { supabase } from "@/integrations/supabase/client"; // Removed - using backend API
import { useToast } from "@/hooks/use-toast";

interface AddShopDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onShopAdded: (shop: any) => void;
}

const AddShopDialog = ({ open, onOpenChange, onShopAdded }: AddShopDialogProps) => {
  const [formData, setFormData] = useState({
    shop_name: "",
    address: "",
    contact_name: "",
    labor_rate: "",
    rate_category: "green" as "green" | "orange" | "red",
    comment: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Generate shop ID
      const { data: shopIdData } = await supabase.rpc('generate_shop_id');
      
      const shopData = {
        ...formData,
        shop_id: shopIdData,
        labor_rate: parseFloat(formData.labor_rate) || 0
      };

      const { data, error } = await supabase
        .from('shops')
        .insert([shopData])
        .select()
        .single();

      if (error) throw error;

      onShopAdded(data);
      onOpenChange(false);
      
      // Reset form
      setFormData({
        shop_name: "",
        address: "",
        contact_name: "",
        labor_rate: "",
        rate_category: "green",
        comment: ""
      });

      toast({
        title: "Shop added successfully",
        description: `${data.shop_name} has been added to your shops.`
      });
    } catch (error) {
      console.error('Error adding shop:', error);
      toast({
        title: "Error adding shop",
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getRateColor = (category: string) => {
    switch (category) {
      case "green": return "text-green-600";
      case "orange": return "text-orange-600";
      case "red": return "text-red-600";
      default: return "text-gray-600";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Shop</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="shop_name">Shop Name</Label>
            <Input
              id="shop_name"
              value={formData.shop_name}
              onChange={(e) => handleChange("shop_name", e.target.value)}
              placeholder="Auto Service Center"
              required
            />
          </div>

          <div>
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleChange("address", e.target.value)}
              placeholder="123 Main St, City, State 12345"
              required
            />
          </div>

          <div>
            <Label htmlFor="contact_name">Contact Name (Optional)</Label>
            <Input
              id="contact_name"
              value={formData.contact_name}
              onChange={(e) => handleChange("contact_name", e.target.value)}
              placeholder="John Doe"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="labor_rate">Labor Rate ($/hr)</Label>
              <Input
                id="labor_rate"
                type="number"
                step="0.01"
                value={formData.labor_rate}
                onChange={(e) => handleChange("labor_rate", e.target.value)}
                placeholder="75.00"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="rate_category">Rate Category</Label>
              <Select value={formData.rate_category} onValueChange={(value) => handleChange("rate_category", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="green">
                    <span className="text-green-600">● Green (Good)</span>
                  </SelectItem>
                  <SelectItem value="orange">
                    <span className="text-orange-600">● Orange (Fair)</span>
                  </SelectItem>
                  <SelectItem value="red">
                    <span className="text-red-600">● Red (Expensive)</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="comment">Comment (Optional)</Label>
            <Textarea
              id="comment"
              value={formData.comment}
              onChange={(e) => handleChange("comment", e.target.value)}
              placeholder="Additional notes about this shop..."
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? "Adding..." : "Add Shop"}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddShopDialog;
