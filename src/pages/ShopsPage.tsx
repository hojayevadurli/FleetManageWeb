import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Search,
  Map as MapIcon,
  List,
  Plus,
  Filter,
  Sparkles,
  X,
  Star,
  RotateCcw,
} from "lucide-react";
import { Shop, VENDOR_PREFERENCE_CONFIG, SERVICE_SPECIALTIES } from "@/components/shops/types/ShopTypes";
import ShopCard from "@/components/shops/ShopCard";
import ShopMap from "@/pages/ShopMap";
import AddShopDialog from "@/components/shops/AddShopDialog";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { shopsApi } from "@/lib/shopsApi";
import { Loader } from "@googlemaps/js-api-loader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "AIzaSyCCej-dqJ3vLFfiXyVC8JvNOdzNuYOpczI";

const ShopsPage = () => {
  const [view, setView] = useState<'list' | 'map'>('list');
  const [shops, setShops] = useState<Shop[]>([]);
  const [filteredShops, setFilteredShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddShopOpen, setIsAddShopOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Map & Search States
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [tierFilter, setTierFilter] = useState<string[]>([]);
  const [specialtyFilter, setSpecialtyFilter] = useState<string[]>([]);
  const [ratingFilter, setRatingFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState('name');

  // Computed stats for filter badges and summary
  const shopStats = useMemo(() => {
    const tierCounts = {
      preferred: shops.filter(s => s.vendor_preference === 'PREFERRED').length,
      standard: shops.filter(s => s.vendor_preference === 'STANDARD').length,
      warning: shops.filter(s => s.vendor_preference === 'RESTRICTED').length,
      new: shops.filter(s => s.vendor_preference === 'NEW').length,
      partner: shops.filter(s => s.vendor_preference === 'PARTNER').length,
    };

    // Calculate counts for each specialty
    const specialtyCounts: Record<string, number> = {};
    SERVICE_SPECIALTIES.forEach(spec => {
      // Check if shop has this specialty (case insensitive partial match or direct match)
      specialtyCounts[spec] = shops.filter(s =>
        s.specialties && s.specialties.some(shopSpec => shopSpec.toLowerCase() === spec.toLowerCase())
      ).length;
    });

    const avgRating = shops.length > 0
      ? shops.reduce((acc, s) => acc + (s.average_rating || 0), 0) / shops.length
      : 0;
    const shopsWithCoords = shops.filter(s => s.latitude && s.longitude).length;
    return { tierCounts, specialtyCounts, avgRating, shopsWithCoords };
  }, [shops]);

  // Check if any filters are active
  const activeFiltersCount = tierFilter.length + specialtyFilter.length + (ratingFilter !== 'ALL' ? 1 : 0);
  const hasActiveFilters = activeFiltersCount > 0 || searchTerm !== '';

  // Clear all filters
  const clearAllFilters = () => {
    setTierFilter([]);
    setSpecialtyFilter([]);
    setRatingFilter('ALL');
    setSearchTerm('');
  };

  const removeSpecialtyFilter = (spec: string) => {
    setSpecialtyFilter(prev => prev.filter(s => s !== spec));
  };

  const removeTierFilter = (tier: string) => {
    setTierFilter(prev => prev.filter(t => t !== tier));
  };

  useEffect(() => {
    loadShops();
    initializeGoogleMaps();
  }, []);

  useEffect(() => {
    filterShops();
  }, [shops, searchTerm, tierFilter, specialtyFilter, ratingFilter, sortBy]);

  const loadShops = async () => {
    setLoading(true);
    try {
      const data = await shopsApi.list();
      setShops(data);
    } catch (error) {
      console.error('Error loading shops:', error);
      toast({
        title: "Error loading shops",
        description: "Could not retrieve service network data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const initializeGoogleMaps = async () => {
    try {
      const loader = new Loader({
        apiKey: GOOGLE_MAPS_API_KEY,
        version: "weekly",
        libraries: ["places"],
      });

      await loader.load();

      if (searchInputRef.current) {
        autocompleteRef.current = new window.google.maps.places.Autocomplete(searchInputRef.current, {
          types: ['geocode', 'establishment'],
          fields: ['geometry', 'name', 'formatted_address'],
        });

        autocompleteRef.current.addListener("place_changed", () => {
          const place = autocompleteRef.current?.getPlace();
          if (place && place.geometry && place.geometry.location) {
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();

            setSearchTerm(place.name || place.formatted_address || "");
            setMapCenter({ lat, lng });

            // Auto switch to map view
            setView('map');
          }
        });
      }
    } catch (e) {
      console.error("Failed to load Google Maps Places", e);
    }
  };

  const filterShops = () => {
    let filtered = shops;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(shop =>
        shop.shop_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shop.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (shop.specialties && shop.specialties.some(s => s.toLowerCase().includes(searchTerm.toLowerCase())))
      );
    }

    // Tier filter (Multi-select OR logic)
    if (tierFilter.length > 0) {
      filtered = filtered.filter(shop => tierFilter.includes(shop.vendor_preference));
    }

    // Specialty filter (Multi-select OR logic)
    if (specialtyFilter.length > 0) {
      filtered = filtered.filter(shop =>
        shop.specialties && shop.specialties.some(s => specialtyFilter.some(filter => filter.toLowerCase() === s.toLowerCase()))
      );
    }

    // Rating Filter
    if (ratingFilter !== 'ALL') {
      const minStars = parseFloat(ratingFilter);
      filtered = filtered.filter(shop => (shop.average_rating || 0) >= minStars);
    }

    // Sorting
    if (sortBy === 'name') {
      filtered.sort((a, b) => a.shop_name.localeCompare(b.shop_name));
    } else if (sortBy === 'rating') {
      filtered.sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0));
    } else if (sortBy === 'rate') {
      filtered.sort((a, b) => (a.labor_rate || 0) - (b.labor_rate || 0));
    } else if (sortBy === 'recent') {
      filtered.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    }

    setFilteredShops(filtered);
  };

  const toggleTier = (tier: string) => {
    setTierFilter(prev =>
      prev.includes(tier)
        ? prev.filter(t => t !== tier)
        : [...prev, tier]
    );
  };

  const toggleSpecialty = (spec: string) => {
    setSpecialtyFilter(prev =>
      prev.includes(spec)
        ? prev.filter(s => s !== spec)
        : [...prev, spec]
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      <div className="max-w-7xl mx-auto px-8 py-10 space-y-8">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <h1 className="text-5xl font-black text-slate-900 tracking-tight">
              Service Network
            </h1>
            <p className="text-lg text-slate-500 font-medium max-w-xl">
              Manage trusted partners, audit performance, and discover new shops across your maintenance cloud.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-white p-1.5 rounded-2xl border border-slate-200 flex shadow-sm">
              <Button
                variant={view === 'list' ? 'default' : 'ghost'}
                onClick={() => setView('list')}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'list' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600 hover:bg-transparent'
                  }`}
              >
                <List className="w-4 h-4" /> List
              </Button>
              <Button
                variant={view === 'map' ? 'default' : 'ghost'}
                onClick={() => setView('map')}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'map' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600 hover:bg-transparent'
                  }`}
              >
                <MapIcon className="w-4 h-4" /> Map
              </Button>
            </div>

            <Button
              variant="outline"
              onClick={() => setIsAddShopOpen(true)}
              className="px-6 py-3 rounded-[1rem] border-2 border-blue-600 text-blue-600 font-bold text-xs uppercase tracking-widest hover:bg-blue-50 transition-all active:scale-95 flex items-center gap-2 h-auto"
            >
              <Plus className="w-4 h-4" /> Add Shop
            </Button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <Input
              ref={searchInputRef}
              type="text"
              placeholder="Search shops, locations, or services..."
              className="w-full pl-14 pr-8 py-6 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 shadow-sm focus-visible:ring-4 focus-visible:ring-blue-500/10 transition-all h-auto"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                className={`flex items-center gap-3 px-6 py-6 border rounded-2xl text-xs font-black uppercase tracking-widest shadow-sm h-auto transition-all ${activeFiltersCount > 0 ? 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-200'}`}
              >
                <Filter className="w-4 h-4" />
                Filters
                {activeFiltersCount > 0 && (
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white/20 text-white text-[9px]">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[450px] overflow-y-auto bg-white">
              <SheetHeader className="mb-8">
                <SheetTitle className="text-2xl font-black text-slate-900 flex items-center justify-between">
                  <span>Filters</span>
                  {activeFiltersCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllFilters}
                      className="text-xs font-bold text-slate-400 hover:text-red-500 uppercase tracking-wider"
                    >
                      Reset All
                    </Button>
                  )}
                </SheetTitle>
                <SheetDescription>
                  Refine your search by network tier, rating, and services.
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-8">
                {/* Network Tier Section */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Network Tier</h3>
                  <div className="space-y-3">
                    {[
                      { key: 'NEW', label: VENDOR_PREFERENCE_CONFIG.NEW.label, count: shopStats.tierCounts.new, color: 'bg-blue-500' },
                      { key: 'PARTNER', label: VENDOR_PREFERENCE_CONFIG.PARTNER.label, count: shopStats.tierCounts.partner, color: 'bg-indigo-500' },
                      { key: 'PREFERRED', label: VENDOR_PREFERENCE_CONFIG.PREFERRED.label, count: shopStats.tierCounts.preferred, color: 'bg-emerald-500' },
                      { key: 'STANDARD', label: VENDOR_PREFERENCE_CONFIG.STANDARD.label, count: shopStats.tierCounts.standard, color: 'bg-orange-500' },
                      { key: 'RESTRICTED', label: VENDOR_PREFERENCE_CONFIG.RESTRICTED.label, count: shopStats.tierCounts.warning, color: 'bg-rose-500' },
                    ].map((tier) => (
                      <div key={tier.key} className="flex items-center space-x-3">
                        <Checkbox
                          id={`tier-${tier.key}`}
                          checked={tierFilter.includes(tier.key)}
                          onCheckedChange={() => toggleTier(tier.key)}
                        />
                        <label
                          htmlFor={`tier-${tier.key}`}
                          className="text-sm font-bold text-slate-700 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1 flex justify-between items-center cursor-pointer select-none py-1"
                        >
                          <span className="flex items-center gap-2">
                            {tier.label}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tier.count > 0 ? 'bg-slate-100 text-slate-600' : 'bg-slate-50 text-slate-300'}`}>
                            {tier.count}
                          </span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-slate-100" />

                {/* Rating Section */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Min Rating</h3>
                  <RadioGroup value={ratingFilter} onValueChange={setRatingFilter}>
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="ALL" id="r-all" />
                      <Label htmlFor="r-all" className="text-sm font-medium text-slate-700 cursor-pointer">All Ratings</Label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="3" id="r-3" />
                      <Label htmlFor="r-3" className="text-sm font-medium text-slate-700 cursor-pointer flex items-center gap-1">
                        3+ <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="4" id="r-4" />
                      <Label htmlFor="r-4" className="text-sm font-medium text-slate-700 cursor-pointer flex items-center gap-1">
                        4+ <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="4.5" id="r-4.5" />
                      <Label htmlFor="r-4.5" className="text-sm font-medium text-slate-700 cursor-pointer flex items-center gap-1">
                        4.5+ <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="h-px bg-slate-100" />

                {/* Specialties Section */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Specialties</h3>
                  <div className="grid grid-cols-1 gap-3">
                    {SERVICE_SPECIALTIES.map((spec) => (
                      <div key={spec} className="flex items-center space-x-3">
                        <Checkbox
                          id={`spec-${spec}`}
                          checked={specialtyFilter.includes(spec)}
                          onCheckedChange={() => toggleSpecialty(spec)}
                        />
                        <label
                          htmlFor={`spec-${spec}`}
                          className="text-sm font-medium text-slate-700 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1 flex justify-between items-center cursor-pointer select-none py-1"
                        >
                          <span>{spec}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${shopStats.specialtyCounts[spec] > 0 ? 'bg-slate-100 text-slate-600' : 'bg-slate-50 text-slate-300'}`}>
                            {shopStats.specialtyCounts[spec] || 0}
                          </span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
              <SheetFooter className="mt-12">
                {/* Footer content if needed */}
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>

        {/* Active Filter Chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 items-center animate-in fade-in slide-in-from-top-2 duration-300">
            <span className="text-xs font-bold text-slate-400 uppercase mr-2">Using Filters:</span>

            {tierFilter.map(tier => (
              <div key={tier} className="flex items-center gap-1 pl-3 pr-2 py-1.5 bg-slate-900 text-white rounded-full text-xs font-bold shadow-sm">
                <span>{VENDOR_PREFERENCE_CONFIG[tier as keyof typeof VENDOR_PREFERENCE_CONFIG]?.label || tier}</span>
                <button onClick={() => removeTierFilter(tier)} className="p-0.5 hover:bg-white/20 rounded-full ml-1">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}

            {ratingFilter !== 'ALL' && (
              <div className="flex items-center gap-1 pl-3 pr-2 py-1.5 bg-slate-900 text-white rounded-full text-xs font-bold shadow-sm">
                <span className="flex items-center gap-1">{ratingFilter}+ <Star className="w-3 h-3 fill-white text-white" /></span>
                <button onClick={() => setRatingFilter('ALL')} className="p-0.5 hover:bg-white/20 rounded-full ml-1">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {specialtyFilter.map(spec => (
              <div key={spec} className="flex items-center gap-1 pl-3 pr-2 py-1.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-full text-xs font-bold shadow-sm">
                <span>{spec}</span>
                <button onClick={() => removeSpecialtyFilter(spec)} className="p-0.5 hover:bg-slate-200 rounded-full ml-1 text-slate-500">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}

            <button
              onClick={clearAllFilters}
              className="text-xs font-bold text-red-500 hover:text-red-600 hover:underline px-3"
            >
              Clear All
            </button>
          </div>
        )}

        {/* Shop Count & Sorting */}
        {!loading && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Stats Summary */}
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm font-bold text-slate-600">
                Showing <span className="text-slate-900 font-black">{filteredShops.length}</span> of <span className="text-slate-900 font-black">{shops.length}</span> vendors
              </p>
              <span className="text-slate-300">•</span>
              <div className="flex items-center gap-1.5 text-sm font-bold text-emerald-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                {shopStats.tierCounts.preferred} preferred
              </div>
              <span className="text-slate-300">•</span>
              <div className="flex items-center gap-1 text-sm font-bold text-amber-600">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                {shopStats.avgRating.toFixed(1)} avg
              </div>
              {view === 'map' && (
                <>
                  <span className="text-slate-300">•</span>
                  <div className="flex items-center gap-1.5 text-sm font-bold text-blue-600">
                    <MapIcon className="w-3.5 h-3.5" />
                    {shopStats.shopsWithCoords} on map
                  </div>
                </>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
              >
                <option value="name">Name (A-Z)</option>
                <option value="rating">Highest Rated</option>
                <option value="rate">Lowest Rate</option>
                <option value="recent">Recently Added</option>
              </select>
            </div>
          </div>
        )}

        {/* Content Area */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[3rem] border border-slate-100 italic font-black text-slate-300 uppercase tracking-[0.3em]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            Orchestrating Network Data...
          </div>
        ) : view === 'list' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredShops.map(shop => (
              <ShopCard
                key={shop.id}
                shop={shop}
                onClick={() => navigate(`/app/shops/${shop.id}`)}
              />
            ))}
            {filteredShops.length === 0 && (
              <div className="col-span-full py-16 text-center bg-white rounded-[3rem] border border-slate-100">
                <div className="space-y-4">
                  <p className="text-lg font-black text-slate-400">No vendors found</p>
                  <p className="text-sm text-slate-400">Try adjusting your filters or add a new vendor</p>
                  <button
                    onClick={() => setIsAddShopOpen(true)}
                    className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all"
                  >
                    + Add Vendor
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-sm overflow-hidden min-h-[600px] relative">
            <ShopMap shops={filteredShops} center={mapCenter} />
          </div>
        )
        }
      </div>

      <AddShopDialog
        open={isAddShopOpen}
        onOpenChange={setIsAddShopOpen}
        onShopAdded={loadShops}
        existingShops={shops}
      />
    </div>
  );
};

export default ShopsPage;
