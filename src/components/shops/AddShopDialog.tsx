
import { useState, useEffect } from "react";
import {
  Globe, Search, ChevronRight, X, Tag, CheckCircle2, Loader2, ShieldCheck,
  MapPin, Phone, Star
} from "lucide-react";
import { ShopFormData } from "./types/ShopTypes";
import { searchVendorSuggestions, fetchDetailedVendorInfo } from "@/lib/gemini";
import { useToast } from "@/hooks/use-toast";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface AddShopDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onShopAdded: () => void;
}

const SERVICE_SPECIALTIES = [
  "Engine", "Transmission", "Brakes", "Tires", "Electrical", "Diagnostics", "Body Work", "Trailer Repair", "Mobile Service"
];

const AddShopDialog = ({ open, onOpenChange, onShopAdded }: AddShopDialogProps) => {
  const [searchMode, setSearchMode] = useState<'name' | 'address'>('name');
  const [importQuery, setImportQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [isSearchingGrounding, setIsSearchingGrounding] = useState(false);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const { toast } = useToast();

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
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setUserLocation({ lat: 32.7767, lng: -96.7970 })
    );
  }, []);

  // AI Suggestions search effect
  useEffect(() => {
    if (!importQuery || importQuery.length < 3 || isManualEntry) {
      setSuggestions([]);
      return;
    }

    console.log('🔍 Searching for:', importQuery);
    setSearchError(null); // Clear any previous errors
    const timer = setTimeout(async () => {
      setIsSearchingGrounding(true);
      try {
        console.log('📡 Calling AI with location:', userLocation);
        const res = await searchVendorSuggestions(importQuery, userLocation ? { latitude: userLocation.lat, longitude: userLocation.lng } : undefined);
        console.log('✅ AI Response:', res);
        if (res && res.length > 0) {
          setSuggestions(res);
          setSearchError(null);
        } else {
          setSuggestions([]);
          setSearchError('No businesses found. Try a different search term or add manually.');
        }
      } catch (error) {
        console.error('❌ AI Search Error:', error);
        setSuggestions([]);
        const errorMessage = error instanceof Error ? error.message : 'AI search failed';
        if (errorMessage.includes('API key')) {
          setSearchError('⚠️ Gemini API key not configured. Please set VITE_GEMINI_API_KEY in your .env file.');
        } else {
          setSearchError('AI search temporarily unavailable. Please add shop manually.');
        }
      } finally {
        setIsSearchingGrounding(false);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [importQuery, isManualEntry]);

  const handleSelectSuggestion = async (s: any) => {
    setIsFetchingDetails(true);
    setImportQuery(s.title);
    setSuggestions([]);

    const details = await fetchDetailedVendorInfo(s.title, s.address);
    if (details) {
      setFormData({
        shop_name: details.name,
        address: `${details.street}, ${details.city}, ${details.state} ${details.zip}`,
        phone: details.phone || "",
        website: details.website || "",
        contact_name: "",
        labor_rate: "",
        rate_category: "green",
        comment: "",
        email: "",
        hours_of_operation: {},
        specialties: details.types || [],
        latitude: "",
        longitude: ""
      });
      setIsManualEntry(true);
    }
    setIsFetchingDetails(false);
  };

  const toggleSpecialty = (specialty: string) => {
    const current = formData.specialties || [];
    if (current.includes(specialty)) {
      setFormData({ ...formData, specialties: current.filter(s => s !== specialty) });
    } else {
      setFormData({ ...formData, specialties: [...current, specialty] });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {

      const shopData = {
        shopName: formData.shop_name,
        address: formData.address,
        contactName: formData.contact_name || null,
        laborRate: formData.labor_rate ? parseFloat(formData.labor_rate) : null,
        rateCategory: formData.rate_category,
        comment: formData.comment || null,
        phone: formData.phone || null,
        email: formData.email || null,
        website: formData.website || null,
        hoursOfOperation: Object.keys(formData.hours_of_operation).length > 0 ? formData.hours_of_operation : null,
        specialties: formData.specialties.length > 0 ? formData.specialties : null,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null
      };

      const response = await fetch(`${API_BASE_URL}/shops`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(shopData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to add shop' }));
        throw new Error(errorData.message || 'Failed to add shop');
      }

      toast({
        title: "Success",
        description: `${formData.shop_name} added to your trusted network.`,
      });

      onShopAdded();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error adding shop:', error);
      toast({
        title: "Error",
        description: "Failed to add shop. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
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
    setIsManualEntry(false);
    setImportQuery('');
    setSuggestions([]);
    setSearchMode('name');
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 sm:p-10 bg-slate-900/60 backdrop-blur-md overflow-hidden animate-in fade-in duration-300">
      <div className="bg-white rounded-[3.5rem] w-full max-w-4xl shadow-2xl h-full max-h-[85vh] flex flex-col relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-50"></div>

        <div className="p-10 md:p-14 border-b border-slate-50 flex items-center justify-between shrink-0 relative z-10">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 bg-blue-600 rounded-[1.25rem] flex items-center justify-center shadow-2xl shadow-blue-500/20">
              <Globe className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Add Service Partner to Network</h2>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">VERIFY SHOP INFORMATION VIA GOOGLE GROUNDING</p>
            </div>
          </div>
          <button onClick={() => onOpenChange(false)} className="w-12 h-12 rounded-full hover:bg-slate-50 flex items-center justify-center transition-all text-slate-400 hover:text-slate-900">
            <X className="w-8 h-8" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-10 md:p-14 custom-scrollbar relative z-10">
          {!isManualEntry ? (
            <div className="space-y-10">
              <div className="flex p-1 bg-slate-50/50 rounded-2xl border border-slate-100 max-w-2xl mx-auto">
                <button
                  onClick={() => setSearchMode('name')}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${searchMode === 'name' ? 'bg-white text-blue-600 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Search by Business Name
                </button>
                <button
                  onClick={() => setSearchMode('address')}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${searchMode === 'address' ? 'bg-white text-blue-600 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Search by Address
                </button>
              </div>

              <div className="space-y-6 max-w-3xl mx-auto">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Search for business name...</label>
                  <div className="relative group">
                    <Search className={`absolute left-8 top-1/2 -translate-y-1/2 w-6 h-6 ${isSearchingGrounding ? 'text-blue-500 animate-pulse' : 'text-slate-300'}`} />
                    <input
                      type="text"
                      placeholder="e.g. Springfield Heavy Duty Repair"
                      className="w-full pl-24 pr-10 py-8 bg-slate-50/30 border border-slate-100 rounded-[2.5rem] font-black text-xl text-slate-400/70 outline-none focus:border-blue-500 transition-all shadow-inner"
                      value={importQuery}
                      onChange={e => setImportQuery(e.target.value)}
                      autoFocus
                    />
                  </div>
                </div>
                <div className="h-px bg-slate-50 w-full" />
                <button type="button" onClick={() => setIsManualEntry(true)} className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline flex items-center gap-2">
                  Can't find your vendor? Add manually <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {suggestions.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-bottom-4">
                  {suggestions.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectSuggestion(s)}
                      className="group text-left p-8 bg-white border border-slate-100 rounded-[2.5rem] hover:border-blue-500 hover:shadow-2xl transition-all relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Globe className="w-12 h-12" />
                      </div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 rounded-lg text-amber-600 font-black text-[10px]">
                          <Star className="w-3.5 h-3.5 fill-amber-500" /> {s.rating || '4.8'}
                        </div>
                        <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Google Suggestion</span>
                      </div>
                      <p className="text-xl font-black text-slate-900 group-hover:text-blue-600 transition-colors uppercase leading-tight mb-2">{s.title}</p>
                      <p className="text-[10px] font-bold text-slate-400 line-clamp-1">{s.address}</p>
                    </button>
                  ))}
                </div>
              )}

              {!isSearchingGrounding && importQuery.length >= 3 && suggestions.length === 0 && (
                <div className="p-14 bg-slate-50 rounded-[3rem] text-center border-2 border-dashed border-slate-200">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                    <Search className="w-8 h-8 text-slate-200" />
                  </div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">No verified matches found</h4>
                  {searchError && (
                    <p className="text-xs text-slate-500 mt-2 max-w-md mx-auto">{searchError}</p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-10 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Business Identity *</label>
                  <input required type="text" className="w-full px-8 py-6 bg-slate-50/50 border border-slate-100 rounded-2xl font-black text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/5 transition-all shadow-inner" value={formData.shop_name} onChange={e => setFormData({ ...formData, shop_name: e.target.value })} />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Service Address *</label>
                  <input required type="text" className="w-full px-8 py-6 bg-slate-50/50 border border-slate-100 rounded-2xl font-black text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/5 transition-all shadow-inner" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact Phone</label>
                  <input type="text" className="w-full px-8 py-6 bg-slate-50/50 border border-slate-100 rounded-2xl font-black text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/5 transition-all shadow-inner" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Web Presence</label>
                  <input type="text" className="w-full px-8 py-6 bg-slate-50/50 border border-slate-100 rounded-2xl font-black text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/5 transition-all shadow-inner" value={formData.website} onChange={e => setFormData({ ...formData, website: e.target.value })} />
                </div>

                {/* Metadata Section - Card Style */}
                <div className="md:col-span-2 bg-slate-50/30 p-10 rounded-[2.5rem] border border-slate-100 shadow-inner grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Preferred Contact Person</label>
                    <input type="text" placeholder="e.g. Mike - Shop Foreman" className="w-full px-8 py-6 bg-white border border-slate-100 rounded-2xl font-black text-slate-600 outline-none focus:ring-4 focus:ring-blue-500/5 transition-all shadow-sm" value={formData.contact_name} onChange={e => setFormData({ ...formData, contact_name: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Labor Rate ($/hour)</label>
                    <input type="number" step="0.01" placeholder="e.g. 120.00" className="w-full px-8 py-6 bg-white border border-slate-100 rounded-2xl font-black text-slate-600 outline-none focus:ring-4 focus:ring-blue-500/5 transition-all shadow-sm" value={formData.labor_rate} onChange={e => setFormData({ ...formData, labor_rate: e.target.value })} />
                  </div>
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Internal Performance Notes</label>
                    <textarea rows={4} placeholder="Any internal notes about this vendor..." className="w-full px-8 py-6 bg-white border border-slate-100 rounded-[2rem] font-medium text-slate-600 outline-none focus:ring-4 focus:ring-blue-500/5 transition-all shadow-sm resize-none" value={formData.comment} onChange={e => setFormData({ ...formData, comment: e.target.value })} />
                  </div>
                </div>

                <div className="md:col-span-2 space-y-5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Service Specializations</label>
                  <div className="flex flex-wrap gap-3">
                    {SERVICE_SPECIALTIES.map(s => (
                      <button key={s} onClick={() => toggleSpecialty(s)} type="button" className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${formData.specialties?.includes(s) ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-400 hover:text-slate-600 border border-slate-100'}`}>
                        <Tag className={`w-3.5 h-3.5 inline mr-2 ${formData.specialties?.includes(s) ? 'text-blue-400' : 'text-slate-200'}`} /> {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-10 md:p-14 border-t border-slate-50 flex flex-col md:flex-row items-center justify-end gap-6 shrink-0 bg-slate-50/50">
          <button onClick={() => { if (isManualEntry) { setIsManualEntry(false); } else { onOpenChange(false); resetForm(); } }} type="button" className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 px-6">
            {isManualEntry ? 'Back to Search' : 'Cancel'}
          </button>
          {isManualEntry && (
            <button
              onClick={handleSubmit}
              disabled={!formData.shop_name || !formData.address || isLoading}
              className="w-full md:w-auto bg-slate-900 text-white px-16 py-6 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50 disabled:pointer-events-none"
            >
              {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle2 className="w-6 h-6" />}
              Integrate into Network
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddShopDialog;
