import { useState, useEffect, useRef, useCallback } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import {
    Globe, MapPin, CheckCircle2, Loader2, Sparkles, X, Star, DollarSign
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { shopsApi } from "@/lib/shopsApi";
import { Shop, ShopFormData, PREFERENCE_TO_RATE_CATEGORY } from "./types/ShopTypes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Helper to parse address
const parseAddressComponents = (addressString: string) => {
    if (!addressString) return { city: '', state: '', zip: '' };

    // Pattern 1: "435 W US-6 Valparaiso IN 46385"
    const pattern1 = /([A-Za-z\s]+?)\s+([A-Z]{2})\s*(\d{5})?$/;

    // Pattern 2: "435 W US-6 Valparaiso IN" (no zip)
    const pattern2 = /([A-Za-z\s]+?)\s+([A-Z]{2})$/;

    let match = addressString.match(pattern1);
    if (match) {
        return {
            city: match[1].trim(),
            state: match[2].trim(),
            zip: match[3] || ''
        };
    }

    match = addressString.match(pattern2);
    if (match) {
        return {
            city: match[1].trim(),
            state: match[2].trim(),
            zip: ''
        };
    }

    // Try to find state abbreviation and work backwards
    const stateMatch = addressString.match(/\b([A-Z]{2})\b/);
    if (stateMatch) {
        const state = stateMatch[1];
        const beforeState = addressString.substring(0, stateMatch.index).trim();
        const words = beforeState.split(/\s+/);
        const city = words.slice(-2).join(' '); // Take last 1-2 words as city

        return {
            city: city,
            state: state,
            zip: ''
        };
    }

    return { city: '', state: '', zip: '' };
};

const geocodeAddress = async (address: string) => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "AIzaSyCCej-dqJ3vLFfiXyVC8JvNOdzNuYOpczI"; // Use fallback

    try {
        const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
        );

        const data = await response.json();

        if (data.status === 'OK' && data.results.length > 0) {
            const result = data.results[0];
            const location = result.geometry.location;

            // Extract city, state, zip from address components
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const components = result.address_components as any[];
            const city = components.find(c => c.types.includes('locality'))?.long_name || '';
            const state = components.find(c => c.types.includes('administrative_area_level_1'))?.short_name || '';
            const zip = components.find(c => c.types.includes('postal_code'))?.long_name || '';

            return {
                lat: location.lat,
                lng: location.lng,
                city,
                state,
                zip
            };
        }
    } catch (error) {
        console.error('Geocoding error:', error);
    }
    return null;
};

interface InlineAddShopFormProps {
    initialData?: Partial<ShopFormData>;
    onSuccess: (shop: Shop) => void;
    onCancel: () => void;
}

export default function InlineAddShopForm({ initialData, onSuccess, onCancel }: InlineAddShopFormProps) {
    const { toast } = useToast();
    const [formData, setFormData] = useState<ShopFormData>({
        shop_name: "",
        address: "",
        contact_name: "",
        labor_rate: "",
        rate_category: "green",
        vendor_preference: "NEW", // Default
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

    // Refs for Google Maps
    const addressInputRef = useRef<HTMLInputElement>(null);
    const addressAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
    const shopNameInputRef = useRef<HTMLInputElement>(null);
    const shopNameAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<google.maps.Map | null>(null);
    const markerRef = useRef<google.maps.Marker | null>(null);

    // Initialize with Props
    useEffect(() => {
        if (initialData) {
            const parsed = parseAddressComponents(initialData.address || "");

            setFormData(prev => ({
                ...prev,
                shop_name: initialData.shop_name || "",
                address: initialData.address || "",
                city: initialData.city || parsed.city || "",
                state: initialData.state || parsed.state || "",
                zip: initialData.zip || parsed.zip || "",
                phone: initialData.phone || "",
                latitude: initialData.latitude || "",
                longitude: initialData.longitude || "",
                vendor_preference: "NEW"
            }));

            // If we have address but no coords, geocode
            if (initialData.address && (!initialData.latitude || !initialData.longitude)) {
                geocodeAddress(initialData.address).then(result => {
                    if (result) {
                        setFormData(prev => ({
                            ...prev,
                            latitude: result.lat.toString(),
                            longitude: result.lng.toString(),
                            city: prev.city || result.city || "",
                            state: prev.state || result.state || "",
                            zip: prev.zip || result.zip || ""
                        }));
                    }
                });
            }
        }
    }, [initialData]);

    // Validation
    const validate = (data: ShopFormData) => {
        const newErrors: Record<string, string> = {};
        if (!data.shop_name.trim()) newErrors.shop_name = "Required";
        if (!data.address.trim()) newErrors.address = "Required";
        return newErrors;
    };

    useEffect(() => {
        setErrors(validate(formData));
    }, [formData]);

    // Google Maps Logic
    const updateMap = useCallback(() => {
        if (!mapInstanceRef.current || !formData.latitude || !formData.longitude) return;
        const lat = parseFloat(formData.latitude);
        const lng = parseFloat(formData.longitude);
        if (isNaN(lat) || isNaN(lng)) return;

        const pos = { lat, lng };
        mapInstanceRef.current.panTo(pos);
        mapInstanceRef.current.setZoom(15);

        if (!markerRef.current) {
            markerRef.current = new window.google.maps.Marker({
                map: mapInstanceRef.current,
                position: pos
            });
        } else {
            markerRef.current.setPosition(pos);
        }
    }, [formData.latitude, formData.longitude]);

    useEffect(() => {
        const initMaps = async () => {
            const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "AIzaSyCCej-dqJ3vLFfiXyVC8JvNOdzNuYOpczI";
            if (!apiKey) return;

            const loader = new Loader({ apiKey, version: "weekly", libraries: ["places"] });
            await loader.load();


            // Address Autocomplete
            if (addressInputRef.current && !addressAutocompleteRef.current) {
                addressAutocompleteRef.current = new window.google.maps.places.Autocomplete(addressInputRef.current, {
                    types: ["address"],
                    componentRestrictions: { country: 'us' },
                    fields: ["address_components", "geometry", "formatted_address"],
                });
                addressAutocompleteRef.current.addListener("place_changed", () => {
                    const place = addressAutocompleteRef.current?.getPlace();
                    if (place) handlePlaceSelect(place);
                });
            }

            // Shop Name Autocomplete
            if (shopNameInputRef.current && !shopNameAutocompleteRef.current) {
                shopNameAutocompleteRef.current = new window.google.maps.places.Autocomplete(shopNameInputRef.current, {
                    types: ["establishment"],
                    componentRestrictions: { country: 'us' },
                    fields: ["name", "formatted_address", "address_components", "geometry", "formatted_phone_number", "website"],
                });
                shopNameAutocompleteRef.current.addListener("place_changed", () => {
                    const place = shopNameAutocompleteRef.current?.getPlace();
                    if (place) handleShopSelect(place);
                });
            }

            // Map Preview
            if (mapRef.current && !mapInstanceRef.current) {
                const defaultCenter = { lat: 39.8283, lng: -98.5795 }; // USA Center
                mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
                    center: defaultCenter,
                    zoom: 4,
                    disableDefaultUI: true,
                });
            }

            // Update map if we have coords
            updateMap();
        };

        initMaps();
    }, [updateMap]); // Run once on mount

    useEffect(() => {
        updateMap();
    }, [updateMap]);

    const handlePlaceSelect = (place: google.maps.places.PlaceResult) => {
        if (!place.address_components) return;

        const { address, city, state, zip } = parsePlaceComponents(place);

        const lat = place.geometry?.location?.lat()?.toString() || "";
        const lng = place.geometry?.location?.lng()?.toString() || "";

        setFormData(prev => ({
            ...prev,
            address: address || place.formatted_address || "",
            city,
            state,
            zip,
            latitude: lat,
            longitude: lng
        }));
    };

    const handleShopSelect = (place: google.maps.places.PlaceResult) => {
        if (!place.name) return;

        const { address, city, state, zip } = parsePlaceComponents(place);
        const lat = place.geometry?.location?.lat()?.toString() || "";
        const lng = place.geometry?.location?.lng()?.toString() || "";

        setFormData(prev => ({
            ...prev,
            shop_name: place.name || prev.shop_name,
            address: address || place.formatted_address || prev.address,
            city: city || prev.city,
            state: state || prev.state,
            zip: zip || prev.zip,
            phone: place.formatted_phone_number || prev.phone,
            website: place.website || prev.website,
            latitude: lat || prev.latitude,
            longitude: lng || prev.longitude
        }));

        toast({
            title: "Shop Found",
            description: "Auto-filled shop details from Google Maps.",
            duration: 3000
        });
    };

    const parsePlaceComponents = (place: google.maps.places.PlaceResult) => {
        if (!place.address_components) return { address: "", city: "", state: "", zip: "" };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const components = place.address_components as any[];

        const getComponent = (type: string) => {
            const comp = components.find(c => c.types.includes(type));
            return comp?.long_name || '';
        };

        const getShortComponent = (type: string) => {
            const comp = components.find(c => c.types.includes(type));
            return comp?.short_name || '';
        };

        const streetNumber = getComponent('street_number');
        const route = getComponent('route');
        const city = getComponent('locality') || getComponent('sublocality');
        const state = getShortComponent('administrative_area_level_1');
        const zip = getComponent('postal_code');

        const address = `${streetNumber} ${route}`.trim();

        return { address, city, state, zip };
    };

    const handleSubmit = async () => {
        setTouched({ shop_name: true, address: true });
        if (Object.keys(errors).length > 0) return;

        setIsSubmitting(true);
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const shopData: any = {
                name: formData.shop_name,
                address1: formData.address,
                city: formData.city || "Unknown",
                state: formData.state || "Unknown",
                postalCode: formData.zip,
                country: "USA",
                phone: formData.phone || undefined,
                laborRate: formData.labor_rate ? parseFloat(formData.labor_rate) : undefined,
                rateCategory: PREFERENCE_TO_RATE_CATEGORY[formData.vendor_preference],
                vendorPreference: formData.vendor_preference,
                specialties: formData.specialties.length > 0 ? formData.specialties : undefined,
                latitude: formData.latitude ? parseFloat(formData.latitude) : null,
                longitude: formData.longitude ? parseFloat(formData.longitude) : null
            };

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const newShop = await shopsApi.create(shopData);
            onSuccess(newShop);
        } catch (e) {
            console.error(e);
            toast({ title: "Error", description: "Failed to create shop", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const specialtiesList = ['GENERAL REPAIR', 'TIRES', 'ENGINE', 'BODY WORK', 'TOWING', 'ELECTRICAL', 'TRAILERS', 'REEFER'];

    return (
        <div className="border-2 border-blue-500 rounded-xl p-6 bg-slate-50/50 mt-4 animate-in fade-in slide-in-from-top-2">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-200">
                <div className="flex items-center gap-3">
                    <h4 className="text-sm font-black uppercase tracking-widest text-slate-900">Add New Vendor</h4>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-0 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Auto-filled from receipt
                    </Badge>
                </div>
                <Button variant="ghost" size="sm" onClick={onCancel} className="h-8 text-slate-400 hover:text-red-500">
                    <X className="w-4 h-4 mr-1" /> Cancel
                </Button>
            </div>

            <div className="space-y-4">
                {/* Name */}
                <div>
                    <Label className="text-[10px] font-black uppercase text-slate-500 mb-1.5 flex items-center gap-2">
                        Shop Name <span className="text-red-500">*</span>
                        {initialData?.shop_name && <Badge className="h-5 px-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0 text-[9px]"><CheckCircle2 className="w-3 h-3 mr-1" /> Auto-filled</Badge>}
                    </Label>
                    <Input
                        ref={shopNameInputRef}
                        value={formData.shop_name}
                        onChange={e => setFormData(p => ({ ...p, shop_name: e.target.value }))}
                        className={cn("font-bold", errors.shop_name && touched.shop_name && "border-red-300")}
                        placeholder="Shop Name (Start typing to search...)"
                    />
                </div>

                {/* Address */}
                <div>
                    <Label className="text-[10px] font-black uppercase text-slate-500 mb-1.5 flex items-center gap-2">
                        Address <span className="text-red-500">*</span>
                        {initialData?.address && <Badge className="h-5 px-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0 text-[9px]"><CheckCircle2 className="w-3 h-3 mr-1" /> Auto-filled</Badge>}
                    </Label>
                    <div className="relative">
                        <Input
                            ref={addressInputRef}
                            value={formData.address}
                            onChange={e => setFormData(p => ({ ...p, address: e.target.value }))}
                            className={cn("pl-9", errors.address && touched.address && "border-red-300")}
                            placeholder="Start typing address..."
                        />
                        <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                </div>

                {/* City State Zip Grid */}
                <div className="grid grid-cols-3 gap-3">
                    <div>
                        <Label className="text-[10px] font-black uppercase text-slate-500 mb-1.5">City</Label>
                        <Input value={formData.city} onChange={e => setFormData(p => ({ ...p, city: e.target.value }))} required />
                    </div>
                    <div>
                        <Label className="text-[10px] font-black uppercase text-slate-500 mb-1.5">State</Label>
                        <Input value={formData.state} onChange={e => setFormData(p => ({ ...p, state: e.target.value }))} required maxLength={2} />
                    </div>
                    <div>
                        <Label className="text-[10px] font-black uppercase text-slate-500 mb-1.5">Zip</Label>
                        <Input value={formData.zip} onChange={e => setFormData(p => ({ ...p, zip: e.target.value }))} required />
                    </div>
                </div>

                {/* Map Preview */}
                <div>
                    <Label className="text-[10px] font-black uppercase text-slate-500 mb-1.5">Location Preview</Label>
                    <div ref={mapRef} className="w-full h-32 bg-slate-100 rounded-lg border border-slate-200 overflow-hidden relative">
                        {!formData.latitude && <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-xs font-medium">Enter address to preview</div>}
                    </div>
                </div>

                {/* Phone & Rate */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label className="text-[10px] font-black uppercase text-slate-500 mb-1.5 flex items-center gap-2">
                            Phone
                            {initialData?.phone && <Badge className="h-5 px-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0 text-[9px]"><CheckCircle2 className="w-3 h-3 mr-1" /> Auto</Badge>}
                        </Label>
                        <Input value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} placeholder="(555) 123-4567" />
                    </div>
                    <div>
                        <Label className="text-[10px] font-black uppercase text-slate-500 mb-1.5">Hourly Rate</Label>
                        <div className="relative">
                            <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <Input className="pl-9" type="number" value={formData.labor_rate} onChange={e => setFormData(p => ({ ...p, labor_rate: e.target.value }))} placeholder="0.00" />
                        </div>
                    </div>
                </div>

                {/* Preference Buttons */}
                <div>
                    <Label className="text-[10px] font-black uppercase text-slate-500 mb-2 block">Vendor Preference</Label>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                        {['NEW', 'PARTNER', 'PREFERRED', 'STANDARD', 'RESTRICTED'].map((pref) => (
                            <button
                                key={pref}
                                type="button"
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                onClick={() => setFormData(p => ({ ...p, vendor_preference: pref as any }))}
                                className={cn(
                                    "flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-all",
                                    formData.vendor_preference === pref
                                        ? "bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500"
                                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                )}
                            >
                                <span className="text-[10px] font-black">{pref}</span>
                                <span className="text-[9px] opacity-70 font-medium">
                                    {pref === 'NEW' ? 'Trial' : pref === 'PARTNER' ? 'Contract' : pref === 'PREFERRED' ? 'Top Rated' : pref === 'RESTRICTED' ? 'Avoid' : 'General'}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Specialties */}
                <div>
                    <Label className="text-[10px] font-black uppercase text-slate-500 mb-2 block">Specialties</Label>
                    <div className="flex flex-wrap gap-2">
                        {specialtiesList.map(spec => (
                            <button
                                key={spec}
                                type="button"
                                onClick={() => {
                                    setFormData(p => ({
                                        ...p,
                                        specialties: p.specialties.includes(spec) ? p.specialties.filter(x => x !== spec) : [...p.specialties, spec]
                                    }));
                                }}
                                className={cn(
                                    "px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all",
                                    formData.specialties.includes(spec)
                                        ? "bg-slate-800 text-white border-slate-800"
                                        : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                                )}
                            >
                                {spec}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-2 border-t border-slate-200 mt-2">
                    <Button variant="ghost" onClick={onCancel}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting || !formData.shop_name || !formData.address} className="bg-blue-600 hover:bg-blue-700">
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                        Save & Continue
                    </Button>
                </div>
            </div>
        </div>
    );
}
