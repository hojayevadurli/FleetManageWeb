
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Clock, 
  Star, 
  Filter, 
  Search,
  Plus,
  Navigation,
  Eye
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Shop } from "./types/ShopTypes";
import ShopDetailsDialog from "./ShopDetailsDialog";
import AddShopDialog from "./AddShopDialog";

const ShopDirectory = () => {
  const [shops, setShops] = useState<Shop[]>([]);
  const [filteredShops, setFilteredShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isAddShopOpen, setIsAddShopOpen] = useState(false);

  useEffect(() => {
    loadShops();
  }, []);

  useEffect(() => {
    filterShops();
  }, [shops, searchTerm, ratingFilter, categoryFilter]);

  const loadShops = async () => {
    try {
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .order('shop_name');

      if (error) throw error;
      
      // Type cast the data to ensure rate_category is properly typed
      const typedShops = (data || []).map(shop => ({
        ...shop,
        rate_category: shop.rate_category as 'green' | 'orange' | 'red',
        hours_of_operation: shop.hours_of_operation as Record<string, string>,
        specialties: shop.specialties as string[]
      }));
      
      setShops(typedShops);
    } catch (error) {
      console.error('Error loading shops:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterShops = () => {
    let filtered = shops;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(shop => 
        shop.shop_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shop.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shop.shop_id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Rating filter
    if (ratingFilter !== "all") {
      const minRating = parseInt(ratingFilter);
      filtered = filtered.filter(shop => 
        (shop.average_rating || 0) >= minRating
      );
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(shop => 
        shop.rate_category === categoryFilter
      );
    }

    setFilteredShops(filtered);
  };

  const getRateColor = (category: string) => {
    switch (category) {
      case "green": return "bg-green-100 text-green-800";
      case "orange": return "bg-orange-100 text-orange-800";
      case "red": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
        }`}
      />
    ));
  };

  const handleShopAdded = () => {
    loadShops();
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading shops...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Shop Directory</h2>
          <p className="text-gray-600">Manage and browse all service shops</p>
        </div>
        <Button onClick={() => setIsAddShopOpen(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Shop
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search shops..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={ratingFilter} onValueChange={setRatingFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                <SelectItem value="4">4+ Stars</SelectItem>
                <SelectItem value="3">3+ Stars</SelectItem>
                <SelectItem value="2">2+ Stars</SelectItem>
                <SelectItem value="1">1+ Stars</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="green">Green Rate</SelectItem>
                <SelectItem value="orange">Orange Rate</SelectItem>
                <SelectItem value="red">Red Rate</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center text-sm text-gray-600">
              <Filter className="h-4 w-4 mr-2" />
              {filteredShops.length} of {shops.length} shops
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shop Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredShops.map((shop) => (
          <Card key={shop.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg">{shop.shop_name}</CardTitle>
                  <CardDescription className="text-sm">{shop.shop_id}</CardDescription>
                </div>
                <Badge className={getRateColor(shop.rate_category)}>
                  {shop.rate_category}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-600">{shop.address}</span>
              </div>

              {shop.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">{shop.phone}</span>
                </div>
              )}

              {shop.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">{shop.email}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold">${shop.labor_rate}/hr</span>
                </div>
                <div className="flex items-center gap-1">
                  {renderStars(Math.round(shop.average_rating || 0))}
                  <span className="text-sm text-gray-600 ml-1">
                    ({shop.total_reviews || 0})
                  </span>
                </div>
              </div>

              {shop.specialties && shop.specialties.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {shop.specialties.slice(0, 3).map((specialty, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {specialty}
                    </Badge>
                  ))}
                  {shop.specialties.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{shop.specialties.length - 3} more
                    </Badge>
                  )}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => {
                    setSelectedShop(shop);
                    setIsDetailsOpen(true);
                  }}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Details
                </Button>
                {shop.latitude && shop.longitude && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      const url = `https://www.google.com/maps/dir/?api=1&destination=${shop.latitude},${shop.longitude}`;
                      window.open(url, '_blank');
                    }}
                  >
                    <Navigation className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredShops.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500">
            <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No shops found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <ShopDetailsDialog
        shop={selectedShop}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
      />

      <AddShopDialog
        open={isAddShopOpen}
        onOpenChange={setIsAddShopOpen}
        onShopAdded={handleShopAdded}
      />
    </div>
  );
};

export default ShopDirectory;
