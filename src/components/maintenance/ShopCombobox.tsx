
import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";

interface Shop {
  id: string;
  shop_name: string;
  address: string;
  shop_id: string;
  labor_rate: number;
  rate_category: string;
  average_rating?: number;
  total_reviews?: number;
}

interface ShopComboboxProps {
  value: string;
  onValueChange: (shopId: string) => void;
  onAddShop: () => void;
}

const ShopCombobox = ({ value, onValueChange, onAddShop }: ShopComboboxProps) => {
  const [open, setOpen] = useState(false);
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadShops();
  }, []);

  const loadShops = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .order('shop_name');

      if (error) throw error;
      setShops(data || []);
    } catch (error) {
      console.error('Error loading shops:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedShop = shops.find(s => s.id === value);

  const getRateColor = (category: string) => {
    switch (category) {
      case "green": return "text-green-600";
      case "orange": return "text-orange-600";
      case "red": return "text-red-600";
      default: return "text-gray-600";
    }
  };

  const handleAddShop = () => {
    setOpen(false);
    onAddShop();
  };

  // Refresh shops when a new shop is added
  const refreshShops = () => {
    loadShops();
  };

  // Make refreshShops available to parent
  useEffect(() => {
    (window as any).refreshShops = refreshShops;
    return () => {
      delete (window as any).refreshShops;
    };
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedShop
            ? `${selectedShop.shop_name} - ${selectedShop.shop_id}`
            : "Select shop..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search shops..." />
          <CommandList>
            <CommandEmpty>
              {loading ? "Loading shops..." : "No shops found."}
            </CommandEmpty>
            <CommandGroup>
              <CommandItem onSelect={handleAddShop}>
                <Plus className="mr-2 h-4 w-4" />
                Add New Shop
              </CommandItem>
              {shops.map((shop) => (
                <CommandItem
                  key={shop.id}
                  value={shop.id}
                  onSelect={(currentValue) => {
                    onValueChange(currentValue);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === shop.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{shop.shop_name}</span>
                      <div className="flex items-center gap-2">
                        {shop.average_rating && (
                          <span className="text-xs text-yellow-600">
                            ★ {shop.average_rating.toFixed(1)}
                          </span>
                        )}
                        <span className={cn("text-xs font-medium", getRateColor(shop.rate_category))}>
                          ● ${shop.labor_rate}/hr
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">{shop.address}</span>
                      <span className="text-xs text-gray-400">{shop.shop_id}</span>
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default ShopCombobox;
