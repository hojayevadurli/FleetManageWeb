import { useState, useEffect, useRef, useCallback } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import {
  Globe, Search, ChevronRight, X, Tag, CheckCircle2, Loader2, ShieldCheck,
  MapPin, Phone, Star, Building2, User, Sparkles
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Shop, ShopFormData, VENDOR_PREFERENCE_CONFIG, PREFERENCE_TO_RATE_CATEGORY, SERVICE_SPECIALTIES } from "./types/ShopTypes";
import { searchVendorSuggestions, fetchDetailedVendorInfo } from "@/lib/gemini";
import { useToast } from "@/hooks/use-toast";
import { shopsApi } from "@/lib/shopsApi";
import ShopRatingInputs, { ShopRatingData } from "./ShopRatingInputs";

interface AddShopDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onShopAdded: (shop?: Shop) => void;
  shopToEdit?: Shop | null;
  existingShops?: Shop[]; // For duplicate detection
  initialData?: Partial<ShopFormData>;
}

const AddShopDialog = ({ open, onOpenChange, onShopAdded, shopToEdit, existingShops = [], initialData }: AddShopDialogProps) => {
  const [step, setStep] = useState<"search" | "details">("search");
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<"search" | "manual" | null>(null);

  const [formData, setFormData] = useState<ShopFormData>({
    shop_name: "",
    address: "",
    contact_name: "",
    labor_rate: "",
    rate_category: "green",
    vendor_preference: "NEW", // Added default
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

  const [ratingData, setRatingData] = useState<ShopRatingData>({
    mainRating: 0,
    qualityRating: 0,
    timelinessRating: 0,
    communicationRating: 0,
    valueRating: 0,
    wouldRecommend: null,
    comment: ""
  });

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
        setStep("details"); // Skip selection
        setSelectedMethod("manual"); // Enable validation/map
        setFormData({
          shop_name: shopToEdit.shop_name,
          address: shopToEdit.address,
          contact_name: shopToEdit.contact_name || "",
          labor_rate: shopToEdit.labor_rate?.toString() || "",
          rate_category: shopToEdit.rate_category,
          vendor_preference: shopToEdit.vendor_preference || "STANDARD",
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
        console.log("AddShopDialog: Opening with initialData or defaults");
        // Check if we have initial data (e.g. from receipt parse)
        if (initialData && Object.keys(initialData).length > 0) {
          setStep("details");
          setSelectedMethod("manual");
          setFormData({
            shop_name: initialData.shop_name || "",
            address: initialData.address || "",
            contact_name: initialData.contact_name || "",
            labor_rate: initialData.labor_rate || "",
            rate_category: initialData.rate_category || "green",
            vendor_preference: initialData.vendor_preference || "NEW",
            comment: initialData.comment || "",
            phone: initialData.phone || "",
            email: initialData.email || "",
            website: initialData.website || "",
            hours_of_operation: initialData.hours_of_operation || {},
            specialties: initialData.specialties || [],
            latitude: initialData.latitude || "",
            longitude: initialData.longitude || "",
            city: initialData.city || "",
            state: initialData.state || "",
            zip: initialData.zip || ""
          });
          // Auto-fill indicator
          if (initialData.shop_name) setAutoFilledName(true);
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
            vendor_preference: "NEW",
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
          // Reset rating data
          setRatingData({
            mainRating: 0,
            qualityRating: 0,
            timelinessRating: 0,
            communicationRating: 0,
            valueRating: 0,
            wouldRecommend: null,
            comment: ""
          });
        }
      }
    }
  }, [open, shopToEdit, initialData]);

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      // Parse coordinates - ensure we capture them even if they're "0"
      let parsedLat = formData.latitude ? parseFloat(formData.latitude) : null;
      let parsedLng = formData.longitude ? parseFloat(formData.longitude) : null;

      // Geocoding Fallback if coordinates are missing but address exists
      if ((!parsedLat || !parsedLng) && formData.address && formData.city && formData.state && window.google) {
        try {
          console.log("AddShopDialog: Attempting to geocode address...");
          const geocoder = new window.google.maps.Geocoder();
          const addressToGeocode = `${formData.address}, ${formData.city}, ${formData.state} ${formData.zip}`;

          const result = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
            geocoder.geocode({ address: addressToGeocode }, (results, status) => {
              if (status === 'OK' && results) resolve(results);
              else reject(status);
            });
          });

          if (result[0]?.geometry?.location) {
            parsedLat = result[0].geometry.location.lat();
            parsedLng = result[0].geometry.location.lng();
            console.log("AddShopDialog: Geocoding successful:", { parsedLat, parsedLng });
          }
        } catch (gstError) {
          console.error("AddShopDialog: Geocoding failed:", gstError);
          // Non-blocking, proceed with what we have
        }
      }

      console.log('AddShopDialog: Coordinates before submit:', {
        rawLat: formData.latitude,
        rawLng: formData.longitude,
        parsedLat,
        parsedLng
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        rateCategory: PREFERENCE_TO_RATE_CATEGORY[formData.vendor_preference], // Derive category from preference
        vendorPreference: formData.vendor_preference,
        comment: formData.comment || undefined,
        hoursOfOperation: Object.keys(formData.hours_of_operation).length > 0 ? formData.hours_of_operation : undefined,
        specialties: formData.specialties.length > 0 ? formData.specialties : undefined,
        // Always include latitude/longitude - send null if not available rather than undefined
        latitude: parsedLat !== null && !isNaN(parsedLat) ? parsedLat : null,
        longitude: parsedLng !== null && !isNaN(parsedLng) ? parsedLng : null
      };

      console.log('Submitting shop data:', shopData); // Debug log
      console.log('Submitting coordinates:', { latitude: shopData.latitude, longitude: shopData.longitude }); // Extra debug

      if (shopToEdit) {
        const updatedShop = await shopsApi.update(shopToEdit.id, shopData);
        // No success screen for edit, just toast
        toast({
          title: "Shop updated",
          description: `${formData.shop_name} has been updated.`
        });
        onShopAdded(updatedShop);
        onOpenChange(false);
      } else {
        const newShop = await shopsApi.create(shopData);

        // Handle Rating Submission if provided
        if (ratingData.mainRating > 0) {
          try {
            await shopsApi.createRating(newShop.id, {
              rating: ratingData.mainRating,
              reviewText: ratingData.comment,
              serviceDate: new Date().toISOString(),
              qualityRating: ratingData.qualityRating,
              timelinessRating: ratingData.timelinessRating,
              communicationRating: ratingData.communicationRating,
              valueRating: ratingData.valueRating,
              wouldRecommend: ratingData.wouldRecommend === true
            });
            console.log("AddShopDialog: Rating submitted successfully");
          } catch (ratingErr) {
            console.error("AddShopDialog: Failed to submit rating", ratingErr);
            toast({
              title: "Shop created, but rating failed",
              description: "The shop was saved but the rating could not be added.",
              variant: "destructive"
            });
          }
        }

        setShowSuccess(true);
        // Delay closing to show success animation
        setTimeout(() => {
          onShopAdded(newShop);
          onOpenChange(false);
          setShowSuccess(false); // Reset
        }, 2000);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  // Live Map Preview Logic
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);

  // Initialize Map
  // Update Map Location
  const updateMapLocation = useCallback(() => {
    if (!mapInstanceRef.current || !window.google) return;

    const lat = parseFloat(formData.latitude);
    const lng = parseFloat(formData.longitude);

    if (!isNaN(lat) && !isNaN(lng)) {
      const pos = { lat, lng };
      mapInstanceRef.current.panTo(pos);
      mapInstanceRef.current.setZoom(15);

      // Create marker if it doesn't exist
      if (!markerRef.current) {
        markerRef.current = new window.google.maps.Marker({
          map: mapInstanceRef.current,
          animation: google.maps.Animation.DROP,
          icon: {
            path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
            fillColor: "#3b82f6", // Blue-500
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: "#FFFFFF",
            scale: 1.5,
            anchor: new google.maps.Point(12, 22),
            labelOrigin: new google.maps.Point(12, -10),
          }
        });
      }
      markerRef.current.setPosition(pos);
      markerRef.current.setMap(mapInstanceRef.current);
    } else {
      // If no coordinates, remove marker
      markerRef.current?.setMap(null);
    }
  }, [formData.latitude, formData.longitude]);

  // Initialize Map
  useEffect(() => {
    if (step === "details" && mapRef.current && !mapInstanceRef.current) {
      // Delay to ensure container is rendered
      setTimeout(() => {
        if (!mapRef.current || mapInstanceRef.current) return;

        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "AIzaSyAeI6_E9c4EMx9T4t_FjyVUGSTN38GV69c";
        if (!apiKey) return;

        const loader = new Loader({ apiKey, version: "weekly", libraries: ["places"] });
        loader.load().then(() => {
          const defaultCenter = { lat: 41.8781, lng: -87.6298 }; // Chicago
          mapInstanceRef.current = new window.google.maps.Map(mapRef.current!, {
            center: defaultCenter,
            zoom: 10,
            disableDefaultUI: true,
            zoomControl: true,
            streetViewControl: false,
            mapTypeControl: false,
            styles: [
              {
                "featureType": "poi",
                "stylers": [{ "visibility": "off" }]
              }
            ]
          });
          // Update marker if we already have coordinates
          if (formData.latitude && formData.longitude) {
            updateMapLocation();
          }
        }).catch(e => console.error("Error loading map:", e));
      }, 500);
    }
  }, [step, updateMapLocation, formData.latitude, formData.longitude]);

  useEffect(() => {
    updateMapLocation();
  }, [updateMapLocation]);

  const extractPlaceDetails = (place: google.maps.places.PlaceResult) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lat = place.geometry?.location?.lat()?.toString() || (place.geometry?.location as any)?.lat?.toString() || "";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "AIzaSyAeI6_E9c4EMx9T4t_FjyVUGSTN38GV69c";
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
      }

    } catch (e) {
      console.error("Failed to load Google Maps Autocomplete", e);
    }
  };

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMethod, step]);

  if (!open) {
    return null;
  }

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
            <form onSubmit={handleSubmit} className="p-6 space-y-8 relative">
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
                <div className="space-y-2 col-span-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide ml-1 flex items-center gap-2">
                      Shop Name <span className="text-red-500">*</span>
                      {autoFilledName && (
                        <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full animate-in zoom-in">
                          <Sparkles className="w-3 h-3" />
                          <span className="text-[10px]">Auto-filled</span>
                        </span>
                      )}
                    </label>
                    {touched.shop_name && errors.shop_name && <span className="text-xs font-medium text-red-500">{errors.shop_name}</span>}
                  </div>
                  <div className="relative">
                    <Globe className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${touched.shop_name && errors.shop_name ? "text-red-400" : "text-gray-400"}`} />
                    <input
                      ref={shopNameInputRef}
                      required
                      className={`w-full h-12 pl-12 pr-4 py-3 bg-white border rounded-lg text-base text-gray-900 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all ${touched.shop_name && errors.shop_name ? "border-red-300 focus:border-red-500" : "border-gray-200"}`}
                      placeholder="Enter shop name or search..."
                      value={formData.shop_name}
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

                <div className="space-y-2 col-span-2">
                  <div className="flex justify-between">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide ml-1 flex items-center gap-2">
                      Address <span className="text-red-500">*</span>
                      {initialData?.address && (
                        <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full animate-in zoom-in">
                          <Sparkles className="w-3 h-3" />
                          <span className="text-[10px]">Auto-filled</span>
                        </span>
                      )}
                    </label>
                    {touched.address && errors.address && <span className="text-xs font-medium text-red-500">{errors.address}</span>}
                  </div>
                  <div className="relative">
                    <MapPin className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${touched.address && errors.address ? "text-red-400" : "text-gray-400"}`} />
                    {formData.latitude && formData.longitude && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500 animate-in zoom-in">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                    )}

                    <input
                      ref={addressInputRef}
                      required
                      className={`w-full h-12 pl-12 pr-4 py-3 bg-white border rounded-lg text-base text-gray-900 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all ${touched.address && errors.address ? "border-red-300 focus:border-red-500" : "border-gray-200"}`}
                      placeholder="Start typing to search address..."
                      value={formData.address}
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
                  <div className="col-span-3 space-y-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide ml-1">City <span className="text-red-500">*</span></label>
                    <input
                      required
                      className={`w-full h-12 px-4 py-3 bg-white border rounded-lg text-base text-gray-900 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all ${touched.city && errors.city ? "border-red-300 focus:border-red-500" : "border-gray-200"}`}
                      placeholder="City"
                      value={formData.city || ""}
                      onChange={e => {
                        const val = e.target.value;
                        setFormData(prev => ({ ...prev, city: val }));
                      }}
                      onBlur={() => handleBlur('city')}
                    />
                  </div>
                  <div className="col-span-1 space-y-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide ml-1">State <span className="text-red-500">*</span></label>
                    <input
                      required
                      className={`w-full h-12 px-2 py-3 bg-white border rounded-lg text-base text-gray-900 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-center ${touched.state && errors.state ? "border-red-300 focus:border-red-500" : "border-gray-200"}`}
                      placeholder="State"
                      value={formData.state || ""}
                      onChange={e => {
                        const val = e.target.value;
                        setFormData(prev => ({ ...prev, state: val }));
                      }}
                      onBlur={() => handleBlur('state')}
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide ml-1">Zip <span className="text-red-500">*</span></label>
                    <input
                      className={`w-full h-12 px-4 py-3 bg-white border rounded-lg text-base text-gray-900 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all ${touched.zip && errors.zip ? "border-red-300 focus:border-red-500" : "border-gray-200"}`}
                      placeholder="Zip"
                      value={formData.zip || ""}
                      onChange={e => {
                        const val = e.target.value;
                        setFormData(prev => ({ ...prev, zip: val }));
                      }}
                    />
                  </div>
                </div>

                <div className="col-span-2 space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide ml-1 flex items-center gap-2">
                      <MapPin className="w-3 h-3" /> Location Preview
                    </label>
                  </div>
                  <div className="w-full h-[250px] rounded-xl overflow-hidden border border-gray-200 relative group">
                    <div ref={mapRef} className="w-full h-full bg-slate-50" />
                    {(!formData.latitude || !formData.longitude) && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-slate-50/50 backdrop-blur-[1px] z-10">
                        <p className="text-sm font-semibold text-gray-400 bg-white/90 px-4 py-2 rounded-full shadow-sm border border-gray-100">
                          Select an address to see location
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide ml-1 flex items-center gap-2">
                      Phone
                      {initialData?.phone && (
                        <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full animate-in zoom-in">
                          <Sparkles className="w-3 h-3" />
                          <span className="text-[10px]">Auto-filled</span>
                        </span>
                      )}
                    </label>
                    {touched.phone && errors.phone && <span className="text-xs font-medium text-red-500">{errors.phone}</span>}
                  </div>
                  <div className="relative">
                    <Phone className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${touched.phone && errors.phone ? "text-red-400" : "text-gray-400"}`} />
                    <input
                      className={`w-full h-12 pl-12 pr-4 py-3 bg-white border rounded-lg text-base text-gray-900 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all ${touched.phone && errors.phone ? "border-red-300 focus:border-red-500" : "border-gray-200"}`}
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

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide ml-1">Hourly Labor Rate</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">$</span>
                    <input
                      type="number"
                      className="w-full h-12 pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-lg text-base text-gray-900 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                      placeholder="0.00"
                      value={formData.labor_rate}
                      onChange={e => {
                        const val = e.target.value;
                        setFormData(prev => ({ ...prev, labor_rate: val }));
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2 col-span-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide ml-1">Vendor Preference</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {Object.entries(VENDOR_PREFERENCE_CONFIG).map(([key, config]) => (
                      <button
                        key={key}
                        type="button"
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        onClick={() => setFormData(prev => ({ ...prev, vendor_preference: key as any }))}
                        className={`py-3 px-3 rounded-lg border-2 transition-all text-left ${formData.vendor_preference === key
                          ? config.bgColor + " " + config.textColor + " " + config.borderHex + " ring-2 ring-blue-500/10"
                          : "bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50"
                          }`}
                        style={formData.vendor_preference === key ? { borderColor: config.borderHex } : {}}
                      >
                        <div className="font-semibold uppercase tracking-wide text-[11px]">{config.label}</div>
                        <div className={`text-[10px] mt-0.5 font-medium ${formData.vendor_preference === key ? "opacity-90" : "opacity-60"}`}>{config.description}</div>
                      </button>
                    ))}
                  </div>

                  {/* Rating Inputs */}
                  <div className="space-y-2 col-span-2">
                    <Label className="text-xs font-semibold uppercase text-gray-500 mb-2 block tracking-wide">Initial Rating (Optional)</Label>
                    <ShopRatingInputs
                      data={ratingData}
                      onChange={setRatingData}
                      variant="default"
                    />
                  </div>

                  <div className="space-y-2 col-span-2">
                    <Label className="text-xs font-semibold uppercase text-gray-500 mb-2 block tracking-wide">Specialties</Label>
                    <div className="flex flex-wrap gap-2">
                      {SERVICE_SPECIALTIES.map(spec => (
                        <button
                          key={spec}
                          type="button"
                          onClick={() => toggleSpecialty(spec)}
                          className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${formData.specialties.includes(spec)
                            ? "bg-slate-800 text-white border-slate-800 shadow-md transform scale-105"
                            : "bg-white text-slate-500 border-slate-200 hover:border-blue-300 hover:text-blue-600"
                            }`}
                        >
                          {spec}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Comments */}
                  <div className="space-y-2 col-span-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide ml-1">Internal Notes</label>
                    <textarea
                      className="w-full p-4 bg-white border border-gray-200 rounded-lg font-normal text-base text-gray-800 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all resize-none min-h-[120px]"
                      placeholder="Add any internal notes about this shop..."
                      value={formData.comment}
                      onChange={e => setFormData(prev => ({ ...prev, comment: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-100 flex gap-4 mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      if (step === "details" && selectedMethod === "search") {
                        setStep("search");
                      } else {
                        onOpenChange(false);
                      }
                    }}
                    className="h-12 px-6 rounded-lg font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 h-12 px-6 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        {shopToEdit ? "Update Shop" : "Save Shop"}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddShopDialog;
