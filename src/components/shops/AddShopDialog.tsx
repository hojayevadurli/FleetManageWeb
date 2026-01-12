import { useState, useEffect, useRef } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import {
  Globe, Search, ChevronRight, X, Tag, CheckCircle2, Loader2, ShieldCheck,
  MapPin, Phone, Star, Building2, User, Sparkles
} from "lucide-react";
import { Shop, ShopFormData } from "./types/ShopTypes";
import { searchVendorSuggestions, fetchDetailedVendorInfo } from "@/lib/gemini";
import { useToast } from "@/hooks/use-toast";
import { shopsApi } from "@/lib/shopsApi";

interface AddShopDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onShopAdded: () => void;
  shopToEdit?: Shop | null;
  existingShops?: Shop[]; // For duplicate detection
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

const AddShopDialog = ({ open, onOpenChange, onShopAdded, shopToEdit, existingShops = [] }: AddShopDialogProps) => {
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
    longitude: "",
    city: "",
    state: "",
    zip: ""
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [autoFilledName, setAutoFilledName] = useState(false); // New state for visual indicator

  const validate = (data: ShopFormData) => {
    const newErrors: Record<string, string> = {};

    if (!data.shop_name.trim()) newErrors.shop_name = "Shop name is required";
    if (!data.address.trim()) newErrors.address = "Address is required";
    if (!data.city.trim()) newErrors.city = "City is required";
    if (!data.state.trim()) newErrors.state = "State is required";
    if (!data.zip?.trim()) newErrors.zip = "Zip code is required";

    // Phone validation (North American format roughly: (XXX) XXX-XXXX or XXX-XXX-XXXX or XXXXXXXXXX)
    const phoneRegex = /^(\+?1[-.]?)?\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
    if (data.phone && !phoneRegex.test(data.phone)) {
      newErrors.phone = "Invalid phone format. Ex: (555) 123-4567";
    }

    return newErrors;
  };

  useEffect(() => {
    if (selectedMethod === "manual" || step === "details") {
      setErrors(validate(formData));
    }
    console.log("AddShopDialog: formData updated:", formData);
  }, [formData, selectedMethod, step]);

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const { toast } = useToast();

  // Reset state when dialog closes or shopToEdit changes
  useEffect(() => {
    console.log("AddShopDialog: Initialization Effect Triggered. Open:", open, "ShopToEdit:", shopToEdit?.id);
    if (open) {
      if (shopToEdit) {
        // ... (existing logic)
        setFormData({
          shop_name: shopToEdit.shop_name,
          address: shopToEdit.address,
          contact_name: shopToEdit.contact_name || "",
          labor_rate: shopToEdit.labor_rate?.toString() || "",
          rate_category: shopToEdit.rate_category,
          comment: shopToEdit.comment || "",
          phone: shopToEdit.phone || "",
          email: shopToEdit.email || "",
          website: shopToEdit.website || "",
          hours_of_operation: shopToEdit.hours_of_operation || {},
          specialties: shopToEdit.specialties || [],
          latitude: shopToEdit.latitude?.toString() || "",
          longitude: shopToEdit.longitude?.toString() || "",
          city: shopToEdit.city || "",
          state: shopToEdit.state || "",
          zip: shopToEdit.zip || ""
        });
      } else {
        console.log("AddShopDialog: Opening directly to manual entry form");
        setStep("details"); // Skip the selection step
        setSelectedMethod("manual"); // Set to manual entry
        setSearchTerm("");
        setSuggestions([]);
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
          longitude: "",
          city: "",
          state: "",
          zip: ""
        });
      }
    }
  }, [open, shopToEdit]);

  useEffect(() => {
    console.log("AddShopDialog: Latitude changed to:", formData.latitude);
  }, [formData.latitude]);

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
        longitude: details.longitude?.toString() || "",
        city: details.city || "",
        state: details.state || "",
        zip: details.zip || ""
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

    // Final validation check
    const validationErrors = validate(formData);
    setErrors(validationErrors);
    setTouched({
      shop_name: true,
      address: true,
      city: true,
      state: true,
      phone: true
    });

    if (Object.keys(validationErrors).length > 0) {
      toast({
        title: "Please fix form errors",
        description: "Some required fields are missing or invalid.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    // Check for duplicates (only when adding, not editing)
    if (!shopToEdit) {
      const normalizedName = formData.shop_name.toLowerCase().trim();
      const normalizedAddress = formData.address.toLowerCase().trim();

      const duplicate = existingShops.find(shop =>
        shop.shop_name.toLowerCase().trim() === normalizedName ||
        shop.address.toLowerCase().trim() === normalizedAddress
      );

      if (duplicate) {
        setIsSubmitting(false);
        toast({
          title: "Duplicate Shop Detected",
          description: `A shop with this ${duplicate.shop_name.toLowerCase() === normalizedName ? 'name' : 'address'} already exists.`,
          variant: "destructive"
        });
        return;
      }
    }

    try {
      const shopData: any = {
        name: formData.shop_name,
        address1: formData.address,
        city: formData.city || "Unknown",
        state: formData.state || "Unknown",
        postalCode: formData.zip,
        country: "USA", // Default to USA
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

      console.log('Submitting shop data:', shopData); // Debug log

      if (shopToEdit) {
        await shopsApi.update(shopToEdit.id, shopData);
        // No success screen for edit, just toast
        toast({
          title: "Shop updated",
          description: `${formData.shop_name} has been updated.`
        });
        onShopAdded();
        onOpenChange(false);
      } else {
        await shopsApi.create(shopData);
        setShowSuccess(true);
        // Delay closing to show success animation
        setTimeout(() => {
          onShopAdded();
          onOpenChange(false);
          setShowSuccess(false); // Reset
        }, 2000);
      }
    } catch (error: any) {
      // ... existing error handling
      console.error('Error saving shop:', error);
      setIsSubmitting(false); // Only reset if error
      const errorMessage = error?.response?.data?.title || error?.response?.data?.message || error?.message || "Please try again.";
      // ... rest of error handling logic needs to be preserved or re-implemented since we are replacing the block
      const validationErrors = error?.response?.data?.errors;

      let description = errorMessage;
      if (validationErrors) {
        description = Object.entries(validationErrors)
          .map(([key, msgs]: [string, any]) => `${key}: ${msgs.join(', ')}`)
          .join('\n');
      }

      toast({
        title: `Error ${shopToEdit ? 'updating' : 'adding'} shop`,
        description: description,
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

  // Google Maps Autocomplete
  const addressInputRef = useRef<HTMLInputElement>(null);
  const shopNameInputRef = useRef<HTMLInputElement>(null); // New ref for shop name
  const addressAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const shopNameAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null); // New ref

  useEffect(() => {
    console.log("AddShopDialog: Autocomplete effect triggered", { selectedMethod, step });
    if (selectedMethod === "manual" && step === "details") {
      // Increased delay to ensure the input is mounted
      const timer = setTimeout(() => {
        console.log("AddShopDialog: Calling initializeAutocomplete after delay");
        initializeAutocomplete();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [selectedMethod, step]);

  const extractPlaceDetails = (place: google.maps.places.PlaceResult) => {
    const lat = place.geometry?.location?.lat()?.toString() || (place.geometry?.location as any)?.lat?.toString() || "";
    const lng = place.geometry?.location?.lng()?.toString() || (place.geometry?.location as any)?.lng?.toString() || "";

    let streetNumber = "";
    let route = "";
    let city = "";
    let state = "";
    let zip = "";

    if (place.address_components) {
      for (const component of place.address_components) {
        if (component.types.includes("street_number")) streetNumber = component.long_name;
        if (component.types.includes("route")) route = component.long_name;
        if (component.types.includes("locality")) city = component.long_name;
        if (component.types.includes("administrative_area_level_1")) state = component.short_name;
        if (component.types.includes("postal_code")) zip = component.long_name;
      }
    }

    // Build street address only (e.g., "301 W Gerri Ln")
    const streetAddress = [streetNumber, route].filter(Boolean).join(" ");

    return {
      name: place.name || "",
      address: streetAddress || place.formatted_address || "",
      city,
      state,
      zip,
      latitude: lat,
      longitude: lng,
      phone: place.formatted_phone_number || "",
      website: place.website || "",
    };
  };

  const initializeAutocomplete = async () => {
    console.log("AddShopDialog: initializeAutocomplete called");
    console.log("AddShopDialog: shopNameInputRef.current:", shopNameInputRef.current);
    console.log("AddShopDialog: addressInputRef.current:", addressInputRef.current);

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "AIzaSyCCej-dqJ3vLFfiXyVC8JvNOdzNuYOpczI";
    if (!apiKey) {
      console.error("AddShopDialog: No API key!");
      return;
    }

    try {
      const loader = new Loader({ apiKey, version: "weekly", libraries: ["places"] });
      await loader.load();
      console.log("AddShopDialog: Google Maps loaded");

      // Helper to update form with place details
      const handlePlaceSelect = (instance: google.maps.places.Autocomplete, isShopName: boolean) => {
        const place = instance.getPlace();
        console.log("AddShopDialog: handlePlaceSelect called, place:", place);
        if (!place) return;

        const details = extractPlaceDetails(place);
        console.log("AddShopDialog: Place selected:", details);

        setFormData(prev => ({
          ...prev,
          ...(isShopName ? { shop_name: details.name } : {}),
          // Always update address and location when a place is selected
          address: details.address || prev.address,
          city: details.city || prev.city,
          state: details.state || prev.state,
          zip: details.zip || prev.zip,
          latitude: details.latitude || prev.latitude,
          longitude: details.longitude || prev.longitude,
          phone: details.phone || prev.phone,
          website: details.website || prev.website
        }));
      };

      if (addressInputRef.current) {
        console.log("AddShopDialog: Setting up ADDRESS autocomplete");
        addressAutocompleteRef.current = new window.google.maps.places.Autocomplete(addressInputRef.current, {
          types: ["address"],
          fields: ["address_components", "geometry", "formatted_address"],
        });
        addressAutocompleteRef.current.addListener("place_changed", () =>
          handlePlaceSelect(addressAutocompleteRef.current!, false));
      } else {
        console.error("AddShopDialog: addressInputRef.current is NULL!");
      }

      if (shopNameInputRef.current) {
        console.log("AddShopDialog: Setting up SHOP NAME autocomplete");
        shopNameAutocompleteRef.current = new window.google.maps.places.Autocomplete(shopNameInputRef.current, {
          types: ["establishment"],
          fields: ["name", "formatted_address", "address_components", "geometry", "formatted_phone_number", "website"],
        });
        shopNameAutocompleteRef.current.addListener("place_changed", () =>
          handlePlaceSelect(shopNameAutocompleteRef.current!, true));
      } else {
        console.error("AddShopDialog: shopNameInputRef.current is NULL!");
      }

    } catch (e) {
      console.error("Failed to load Google Maps Autocomplete", e);
    }
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
              {shopToEdit ? "Edit Vendor" : "Add Vendor"}
            </h2>
            <p className="text-blue-100 font-medium opacity-90 mt-2 ml-1">
              {shopToEdit ? "Update partner details" : "Grow your trusted service network"}
            </p>
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
                    {suggestions.length === 0 && !isSearching && searchTerm && (
                      <div className="text-center py-10">
                        <p className="text-slate-400 font-medium">No shops found matching "{searchTerm}"</p>
                        <button
                          onClick={() => {
                            setSelectedMethod("manual");
                            setStep("details");
                          }}
                          className="mt-4 text-blue-600 font-bold text-sm hover:underline"
                        >
                          Enter manually instead
                        </button>
                      </div>
                    )}

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
            <form onSubmit={handleSubmit} className="p-8 space-y-8 relative">
              {isSubmitting && (
                <div className="absolute inset-0 bg-white/80 z-20 flex items-center justify-center rounded-[2.5rem]">
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                    <p className="font-bold text-slate-500 animate-pulse">Saving Shop...</p>
                  </div>
                </div>
              )}

              {showSuccess && (
                <div className="absolute inset-0 bg-green-500 z-30 flex items-center justify-center rounded-[2.5rem] animate-in fade-in duration-300">
                  <div className="flex flex-col items-center gap-6 text-white text-center p-8">
                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center animate-bounce">
                      <CheckCircle2 className="w-12 h-12 text-green-500" />
                    </div>
                    <h3 className="text-3xl font-black">Success!</h3>
                    <p className="text-lg font-medium opacity-90">{formData.shop_name} has been added.</p>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3 col-span-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                      Shop Name <span className="text-red-500">*</span>
                      {autoFilledName && (
                        <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full animate-in zoom-in">
                          <Sparkles className="w-3 h-3" />
                          <span className="text-[9px]">Auto-filled</span>
                        </span>
                      )}
                    </label>
                    {touched.shop_name && errors.shop_name && <span className="text-xs font-bold text-red-500">{errors.shop_name}</span>}
                  </div>
                  <div className="relative">
                    <Globe className={`absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 ${touched.shop_name && errors.shop_name ? "text-red-400" : "text-slate-400"}`} />
                    <input
                      ref={shopNameInputRef}
                      required
                      className={`w-full pl-14 pr-6 py-5 bg-slate-50 border-2 rounded-[2rem] font-bold text-slate-900 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all ${touched.shop_name && errors.shop_name ? "border-red-200 focus:border-red-500" : "border-transparent focus:border-blue-500"}`}
                      placeholder="Enter shop name or search..."
                      defaultValue={formData.shop_name}
                      onChange={e => {
                        const val = e.target.value;
                        setFormData(prev => ({ ...prev, shop_name: val }));
                        if (autoFilledName) setAutoFilledName(false);
                      }}
                      onBlur={() => handleBlur('shop_name')}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-3 col-span-2">
                  <div className="flex justify-between">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Address <span className="text-red-500">*</span></label>
                    {touched.address && errors.address && <span className="text-xs font-bold text-red-500">{errors.address}</span>}
                  </div>
                  <div className="relative">
                    <MapPin className={`absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 ${touched.address && errors.address ? "text-red-400" : "text-slate-400"}`} />
                    {formData.latitude && formData.longitude && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500 animate-in zoom-in">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                    )}

                    <input
                      ref={addressInputRef}
                      required
                      className={`w-full pl-14 pr-6 py-5 bg-slate-50 border-2 rounded-[2rem] font-bold text-slate-900 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all ${touched.address && errors.address ? "border-red-200 focus:border-red-500" : "border-transparent focus:border-blue-500"}`}
                      placeholder="Start typing to search address..."
                      defaultValue={formData.address}
                      onChange={e => {
                        const val = e.target.value;
                        setFormData(prev => ({ ...prev, address: val }));
                      }}
                      onBlur={() => handleBlur('address')}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-6 gap-4 col-span-2">
                  <div className="col-span-3 space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">City <span className="text-red-500">*</span></label>
                    <input
                      required
                      className={`w-full px-6 py-5 bg-slate-50 border-2 rounded-[2rem] font-bold text-slate-900 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all ${touched.city && errors.city ? "border-red-200 focus:border-red-500" : "border-transparent focus:border-blue-500"}`}
                      placeholder="City"
                      value={formData.city || ""}
                      onChange={e => {
                        const val = e.target.value;
                        setFormData(prev => ({ ...prev, city: val }));
                      }}
                      onBlur={() => handleBlur('city')}
                    />
                  </div>
                  <div className="col-span-1 space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">State <span className="text-red-500">*</span></label>
                    <input
                      required
                      className={`w-full px-6 py-5 bg-slate-50 border-2 rounded-[2rem] font-bold text-slate-900 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all ${touched.state && errors.state ? "border-red-200 focus:border-red-500" : "border-transparent focus:border-blue-500"}`}
                      placeholder="State"
                      value={formData.state || ""}
                      onChange={e => {
                        const val = e.target.value;
                        setFormData(prev => ({ ...prev, state: val }));
                      }}
                      onBlur={() => handleBlur('state')}
                    />
                  </div>
                  <div className="col-span-2 space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Zip <span className="text-red-500">*</span></label>
                    <input
                      className={`w-full px-6 py-5 bg-slate-50 border-2 rounded-[2rem] font-bold text-slate-900 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all ${touched.zip && errors.zip ? "border-red-200 focus:border-red-500" : "border-transparent focus:border-blue-500"}`}
                      placeholder="Zip"
                      value={formData.zip || ""}
                      onChange={e => {
                        const val = e.target.value;
                        setFormData(prev => ({ ...prev, zip: val }));
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone</label>
                    {touched.phone && errors.phone && <span className="text-xs font-bold text-red-500">{errors.phone}</span>}
                  </div>
                  <div className="relative">
                    <Phone className={`absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 ${touched.phone && errors.phone ? "text-red-400" : "text-slate-400"}`} />
                    <input
                      className={`w-full pl-14 pr-6 py-5 bg-slate-50 border-2 rounded-[2rem] font-bold text-slate-900 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all ${touched.phone && errors.phone ? "border-red-200 focus:border-red-500" : "border-transparent focus:border-blue-500"}`}
                      placeholder="(555) 123-4567"
                      value={formData.phone}
                      onChange={e => {
                        const val = e.target.value;
                        setFormData(prev => ({ ...prev, phone: val }));
                      }}
                      onBlur={() => handleBlur('phone')}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Hourly Labor Rate</label>
                  <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-black">$</span>
                    <input
                      type="number"
                      className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-transparent rounded-[2rem] font-bold text-slate-900 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all focus:border-blue-500"
                      placeholder="0.00"
                      value={formData.labor_rate}
                      onChange={e => {
                        const val = e.target.value;
                        setFormData(prev => ({ ...prev, labor_rate: val }));
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-3 col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Vendor Preference</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                    {[
                      { id: "purple", label: "New", desc: "Trial stage", color: "bg-violet-50 text-violet-700 border-violet-200" },
                      { id: "blue", label: "Partner", desc: "Contracted rates", color: "bg-blue-50 text-blue-700 border-blue-200" },
                      { id: "green", label: "Preferred", desc: "Top rated", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
                      { id: "orange", label: "Standard", desc: "General use", color: "bg-orange-50 text-orange-700 border-orange-200" },
                      { id: "red", label: "Restricted", desc: "Avoid use", color: "bg-rose-50 text-rose-700 border-rose-200" }
                    ].map(tier => (
                      <button
                        key={tier.id}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, rate_category: tier.id as any }))}
                        className={`py-3 px-3 rounded-xl border-2 transition-all text-left ${formData.rate_category === tier.id
                          ? tier.color + " ring-4 ring-blue-500/10"
                          : "bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100"
                          }`}
                      >
                        <div className="font-black uppercase tracking-wide text-[10px]">{tier.label}</div>
                        <div className={`text-[9px] mt-0.5 font-medium ${formData.rate_category === tier.id ? "opacity-70" : "opacity-50"}`}>{tier.desc}</div>
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
                {!shopToEdit && (
                  <button
                    type="button"
                    onClick={() => setStep("search")}
                    className="px-8 py-4 rounded-2xl font-black text-slate-400 uppercase tracking-widest text-xs hover:bg-slate-50 transition-colors"
                  >
                    Back
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting || Object.keys(errors).length > 0}
                  className="flex-1 bg-slate-900 text-white px-8 py-5 rounded-[2rem] font-black uppercase tracking-widest text-sm hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 disabled:active:scale-100"
                >
                  {shopToEdit ? "Save Changes" : "Confirm & Add Shop"} <ChevronRight className="w-5 h-5" />
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
