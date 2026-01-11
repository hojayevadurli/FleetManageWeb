import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Map as MapIcon,
  List,
  Plus,
  Filter,
  Sparkles,
} from "lucide-react";
import { Shop } from "@/components/shops/types/ShopTypes";
import ShopCard from "@/components/shops/ShopCard";
import ShopMap from "@/pages/ShopMap"; // Updating import path to local file if it was moved or just using the one we edited
import AddShopDialog from "@/components/shops/AddShopDialog";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { shopsApi } from "@/lib/shopsApi";
import { Loader } from "@googlemaps/js-api-loader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

const ShopsPage = () => {
  const [view, setView] = useState<'list' | 'map'>('list');
  const [shops, setShops] = useState<Shop[]>([]);
  const [filteredShops, setFilteredShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddShopOpen, setIsAddShopOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Map & Search States
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | undefined>(undefined);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  // Filter States
  const [tierFilter, setTierFilter] = useState('ALL');
  const [auditFilter, setAuditFilter] = useState('ALL');
  const [priceFilter, setPriceFilter] = useState('ALL');

  useEffect(() => {
    loadShops();
    initializeGoogleMaps();
  }, []);

  useEffect(() => {
    filterShops();
  }, [shops, searchTerm, tierFilter, auditFilter, priceFilter]);

  const loadShops = async () => {
    setLoading(true);
    try {
      const data = await shopsApi.list();
      console.log('Fetched shops:', data);
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

            // If we are in list view, switching to map view might be nice, or just filtering
            // For now, let's auto-switch to map view if they search for a location
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
        shop.address.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Tier filter
    if (tierFilter !== 'ALL') {
      const mapping: Record<string, string> = {
        'PREFERRED': 'green',
        'STANDARD': 'orange',
        'WARNING': 'red'
      };
      filtered = filtered.filter(shop => shop.rate_category === mapping[tierFilter]);
    }

    // Audit filter (Rating)
    if (auditFilter !== 'ALL') {
      const minStars = parseFloat(auditFilter.split('+')[0]);
      filtered = filtered.filter(shop => (shop.average_rating || 0) >= minStars);
    }

    // Price filter (Labor Rate)
    if (priceFilter !== 'ALL') {
      const levels = priceFilter.length; // '$' = 1, '$$' = 2, '$$$' = 3
      filtered = filtered.filter(shop => {
        if (levels === 3) return shop.labor_rate > 150;
        if (levels === 2) return shop.labor_rate > 100 && shop.labor_rate <= 150;
        return shop.labor_rate <= 100;
      });
    }

    setFilteredShops(filtered);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      <div className="max-w-7xl mx-auto px-8 py-10 space-y-12">

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
              onClick={() => setIsAddShopOpen(true)}
              className="bg-blue-600 text-white h-auto px-8 py-4.5 rounded-[1.5rem] flex items-center gap-3 font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 active:scale-95"
            >
              <Plus className="w-5 h-5" /> Integrate Shop
            </Button>
          </div>
        </div>

        {/* Search & Global Filter Bar */}
        <div className="flex flex-col lg:flex-row items-center gap-6">
          <div className="relative flex-1 group w-full">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
            <Input
              ref={searchInputRef}
              type="text"
              placeholder="Search or find location..."
              className="w-full pl-16 pr-8 py-6 bg-white border border-slate-100 rounded-[2.5rem] text-sm font-black text-slate-900 outline-none shadow-sm focus-visible:ring-4 focus-visible:ring-blue-500/5 focus-visible:border-blue-500 transition-all h-auto"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" className="flex items-center gap-3 px-8 py-6 bg-white border border-slate-100 rounded-[2.5rem] text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-blue-600 hover:border-blue-100 transition-all shadow-sm h-auto">
            <Filter className="w-4 h-4" /> Apply Filters
          </Button>
        </div>

        {/* Dark Filter Console */}
        <div className="bg-[#0F172A] rounded-[3rem] p-10 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:opacity-40 transition-opacity">
            <Sparkles className="w-20 h-20 text-blue-400" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
            {/* Network Tier */}
            <div className="space-y-5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Network Tier</label>
              <div className="flex bg-slate-800/50 p-1.5 rounded-2xl border border-slate-700">
                {['ALL', 'PREFERRED', 'STANDARD', 'WARNING'].map(t => (
                  <button
                    key={t}
                    onClick={() => setTierFilter(t)}
                    className={`flex-1 py-2.5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${tierFilter === t ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-slate-200'
                      }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Minimum Audit */}
            <div className="space-y-5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Minimum Performance Audit</label>
              <div className="flex bg-slate-800/50 p-1.5 rounded-2xl border border-slate-700">
                {['ALL', '3+ STARS', '4+ STARS', '4.5+ STARS'].map(s => (
                  <button
                    key={s}
                    onClick={() => setAuditFilter(s)}
                    className={`flex-1 py-2.5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${auditFilter === s ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-slate-200'
                      }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Pricing Strategy */}
            <div className="space-y-5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Pricing Strategy</label>
              <div className="flex bg-slate-800/50 p-1.5 rounded-2xl border border-slate-700">
                {['ALL', '$', '$$', '$$$'].map(p => (
                  <button
                    key={p}
                    onClick={() => setPriceFilter(p)}
                    className={`flex-1 py-2.5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${priceFilter === p ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-slate-200'
                      }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="pt-4">
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
                <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border border-slate-100">
                  <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No shops match your criteria</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-sm overflow-hidden min-h-[600px] relative">
              <ShopMap shops={filteredShops} center={mapCenter} />
            </div>
          )}
        </div>

      </div>

      <AddShopDialog
        open={isAddShopOpen}
        onOpenChange={setIsAddShopOpen}
        onShopAdded={loadShops}
      />
    </div>
  );
};

export default ShopsPage;
