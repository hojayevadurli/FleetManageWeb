import { useState, useEffect } from "react";
import {
  Globe, Search, ChevronRight, X, Tag, CheckCircle2, Loader2, ShieldCheck,
  MapPin, Phone, Star, Building2, User
} from "lucide-react";
import { ShopFormData } from "./types/ShopTypes";
import { searchVendorSuggestions, fetchDetailedVendorInfo } from "@/lib/gemini";
import { useToast } from "@/hooks/use-toast";
import { shopsApi } from "@/lib/shopsApi";

interface AddShopDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onShopAdded: () => void;
}

const SERVICE_SPECIALTIES = [
  "General Repair",
  "Tires",
  "Engine",
  "Body Work",
  "Towing",
  "Electrical",
  "Trailers",
  "Reefer"
];

const AddShopDialog = ({ open, onOpenChange, onShopAdded }: AddShopDialogProps) => {
  const [step, setStep] = useState<"search" | "details">("search");
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<"search" | "manual" | null>(null);

  const [formData, setFormData] = useState<ShopFormData>({
    shop_name: "",
    address: "",
    contact_name: "",
    labor_rate: "",
    rate_category: "green",
    comment: "",
    phone: "",
    email: "",
    website: "",
    hours_of_operation: {},
    specialties: [],
    latitude: "",
    longitude: ""
  });

  const { toast } = useToast();

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setStep("search");
      setSearchTerm("");
      setSuggestions([]);
      setSelectedMethod(null);
    }
  }, [open]);

  const handleSearch = async () => {
    if (!searchTerm) return;
    setIsSearching(true);
    try {
      const results = await searchVendorSuggestions(searchTerm);
      setSuggestions(results);
    } catch (error) {
      toast({
        title: "Search failed",
        description: "Could not find vendor suggestions.",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectVendor = async (vendor: any) => {
    setIsSearching(true);
    try {
      const vendorName = vendor.title || vendor.name;
      const vendorAddress = vendor.address;

      const details = await fetchDetailedVendorInfo(vendorName, vendorAddress);

      const fullAddress = details.address ||
        (details.street ? `${details.street}, ${details.city}, ${details.state} ${details.zip}` : vendorAddress);

      setFormData(prev => ({
        ...prev,
        shop_name: details.name || vendorName || prev.shop_name,
        address: fullAddress || prev.address,
        phone: details.phone || prev.phone,
        email: details.email || prev.email,
        website: details.website || prev.website,
        specialties: details.types || details.services || [],
        hours_of_operation: details.hours || {},
        latitude: details.latitude?.toString() || "",
        longitude: details.longitude?.toString() || ""
      }));
      setStep("details");
    } catch (error) {
      toast({
        title: "Error fetching details",
        description: "Could not auto-fill vendor details. Please enter manually."
      });
      setStep("details");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const shopData = {
        shopName: formData.shop_name,
        address: formData.address,
        contactName: formData.contact_name || undefined,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        website: formData.website || undefined,
        laborRate: formData.labor_rate ? parseFloat(formData.labor_rate) : undefined,
        rateCategory: formData.rate_category,
        comment: formData.comment || undefined,
        hoursOfOperation: Object.keys(formData.hours_of_operation).length > 0 ? formData.hours_of_operation : undefined,
        specialties: formData.specialties.length > 0 ? formData.specialties : undefined,
        latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
        longitude: formData.longitude ? parseFloat(formData.longitude) : undefined
      };

      const data = await shopsApi.create(shopData);

      onShopAdded();
      onOpenChange(false);

      // Reset form
      setFormData({
        shop_name: "",
        address: "",
        contact_name: "",
        labor_rate: "",
        rate_category: "green",
        comment: "",
        phone: "",
        email: "",
        website: "",
        hours_of_operation: {},
        specialties: [],
        latitude: "",
        longitude: ""
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
    }
  };

  const toggleSpecialty = (specialty: string) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty]
    }));
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300"
        style={{ maxHeight: '90vh' }}
      >
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
              <ShieldCheck className="w-8 h-8" />
              Add Service Partner
            </h2>
            <p className="text-blue-100 font-medium opacity-90 mt-2 ml-1">Grow your trusted service network</p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 120px)' }}>
          {step === "search" ? (
            <div className="p-8 space-y-8">
              <div className="text-center space-y-6">
                <h3 className="text-xl font-black text-slate-800">How would you like to add this shop?</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <button
                    onClick={() => setSelectedMethod("search")}
                    className={`p-8 rounded-[2rem] border-2 text-left transition-all relative group ${selectedMethod === "search"
                      ? "border-blue-600 bg-blue-50/50 shadow-xl shadow-blue-100"
                      : "border-slate-100 hover:border-blue-200 hover:bg-slate-50"
                      }`}
                  >
                    <div className="bg-blue-100 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <Search className="w-7 h-7 text-blue-600" />
                    </div>
                    <h4 className="text-lg font-black text-slate-900">AI Search</h4>
                    <p className="text-sm font-medium text-slate-500 mt-2">Find and auto-fill details using AI</p>
                    {selectedMethod === "search" && (
                      <div className="absolute top-6 right-6">
                        <CheckCircle2 className="w-6 h-6 text-blue-600" />
                      </div>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setSelectedMethod("manual");
                      setStep("details");
                    }}
                    className="p-8 rounded-[2rem] border-2 border-slate-100 text-left hover:border-slate-200 hover:bg-slate-50 transition-all group"
                  >
                    <div className="bg-slate-100 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <Tag className="w-7 h-7 text-slate-600" />
                    </div>
                    <h4 className="text-lg font-black text-slate-900">Manual Entry</h4>
                    <p className="text-sm font-medium text-slate-500 mt-2">Enter shop details manually</p>
                  </button>
                </div>
              </div>

              {selectedMethod === "search" && (
                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search by shop name, city, or phone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      className="w-full pl-14 pr-4 py-5 bg-slate-50 border-0 rounded-[2rem] font-bold text-lg text-slate-900 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-slate-400"
                    />
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400" />
                    <button
                      onClick={handleSearch}
                      disabled={isSearching}
                      className="absolute right-3 top-3 bottom-3 bg-slate-900 text-white px-6 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-colors disabled:opacity-50"
                    >
                      {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
                    </button>
                  </div>

                  <div className="space-y-4">
                    {suggestions.map((shop, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectVendor(shop)}
                        className="w-full p-6 bg-white border border-slate-100 rounded-[2rem] hover:border-blue-500 hover:shadow-lg transition-all text-left group"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors">{shop.title || shop.name}</h4>
                            <div className="flex items-center gap-3 mt-2">
                              {shop.rating && (
                                <>
                                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                                  <span className="text-sm font-bold text-slate-700">{shop.rating}</span>
                                </>
                              )}
                              {shop.type && <span className="text-sm font-medium text-slate-400">• {shop.type}</span>}
                            </div>
                            <p className="text-sm font-medium text-slate-500 mt-2">{shop.address}</p>
                          </div>
                          <ChevronRight className="w-6 h-6 text-slate-300 group-hover:text-blue-500 transition-colors" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3 col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Shop Name</label>
                  <div className="relative">
                    <Globe className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      required
                      className="w-full pl-14 pr-6 py-5 bg-slate-50 border-0 rounded-[2rem] font-bold text-slate-900 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                      placeholder="e.g. Joe's Heavy Duty Repair"
                      value={formData.shop_name}
                      onChange={e => setFormData({ ...formData, shop_name: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-3 col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      required
                      className="w-full pl-14 pr-6 py-5 bg-slate-50 border-0 rounded-[2rem] font-bold text-slate-900 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                      placeholder="123 Truck Stop Ln, Dallas TX..."
                      value={formData.address}
                      onChange={e => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      className="w-full pl-14 pr-6 py-5 bg-slate-50 border-0 rounded-[2rem] font-bold text-slate-900 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                      placeholder="(555) 123-4567"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Hourly Labor Rate</label>
                  <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-black">$</span>
                    <input
                      type="number"
                      className="w-full pl-14 pr-6 py-5 bg-slate-50 border-0 rounded-[2rem] font-bold text-slate-900 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                      placeholder="0.00"
                      value={formData.labor_rate}
                      onChange={e => setFormData({ ...formData, labor_rate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-3 col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Priority Tier</label>
                  <div className="flex gap-4">
                    {[
                      { id: "green", label: "Preferred", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
                      { id: "orange", label: "Standard", color: "bg-orange-50 text-orange-700 border-orange-200" },
                      { id: "red", label: "Restricted", color: "bg-rose-50 text-rose-700 border-rose-200" }
                    ].map(tier => (
                      <button
                        key={tier.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, rate_category: tier.id as any })}
                        className={`flex-1 py-4 px-6 rounded-2xl border-2 transition-all font-black uppercase tracking-wide text-xs ${formData.rate_category === tier.id
                          ? tier.color + " ring-4 ring-blue-500/10"
                          : "bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100"
                          }`}
                      >
                        {tier.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Specialties</label>
                  <div className="flex flex-wrap gap-3">
                    {SERVICE_SPECIALTIES.map(specialty => (
                      <button
                        key={specialty}
                        type="button"
                        onClick={() => toggleSpecialty(specialty)}
                        className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide transition-all ${formData.specialties.includes(specialty)
                          ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20"
                          : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                          }`}
                      >
                        {specialty}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6 pt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep("search")}
                  className="px-8 py-4 rounded-2xl font-black text-slate-400 uppercase tracking-widest text-xs hover:bg-slate-50 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-slate-900 text-white px-8 py-5 rounded-[2rem] font-black uppercase tracking-widest text-sm hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 active:scale-95 flex items-center justify-center gap-3"
                >
                  Confirm & Add Shop <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddShopDialog;
