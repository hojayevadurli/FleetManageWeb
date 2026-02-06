import { useRef, useEffect, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Check, CheckCircle2 } from "lucide-react";

export interface ParsedAddress {
    street: string;
    city: string;
    state: string;
    zip: string;
    raw: google.maps.places.PlaceResult;
}

interface AddressAutocompleteProps {
    value: string;
    onChange: (value: string) => void;
    onSelect: (address: ParsedAddress) => void;
    placeholder?: string;
    className?: string;
    id?: string;
}

export function AddressAutocomplete({
    value,
    onChange,
    onSelect,
    placeholder = "Start typing usage...",
    className,
    id
}: AddressAutocompleteProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
    const [isVerified, setIsVerified] = useState(false);

    // Reset verification when user types manually
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setIsVerified(false);
        onChange(e.target.value);
    };

    useEffect(() => {
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "AIzaSyCCej-dqJ3vLFfiXyVC8JvNOdzNuYOpczI";
        if (!apiKey) return;

        const init = async () => {
            const loader = new Loader({ apiKey, version: "weekly", libraries: ["places"] });
            await loader.load();

            if (inputRef.current && !autocompleteRef.current) {
                autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
                    types: ["address"],
                    componentRestrictions: { country: "us" },
                    fields: ["address_components", "geometry", "formatted_address"],
                });

                autocompleteRef.current.addListener("place_changed", () => {
                    const place = autocompleteRef.current?.getPlace();
                    if (place) {
                        const parsed = parsePlace(place);
                        onSelect(parsed);
                        setIsVerified(true);
                    }
                });
            }
        };

        init();
    }, [onSelect]);

    const parsePlace = (place: google.maps.places.PlaceResult): ParsedAddress => {
        let streetNumber = "";
        let route = "";
        let city = "";
        let state = "";
        let zip = "";

        if (place.address_components) {
            for (const component of place.address_components) {
                if (component.types.includes("street_number")) streetNumber = component.long_name;
                if (component.types.includes("route")) route = component.long_name;
                // City can be locality or sublocality
                if (component.types.includes("locality")) city = component.long_name;
                if (!city && component.types.includes("sublocality")) city = component.long_name;
                if (component.types.includes("administrative_area_level_1")) state = component.short_name;
                if (component.types.includes("postal_code")) zip = component.long_name;
            }
        }

        const street = `${streetNumber} ${route}`.trim() || place.formatted_address?.split(',')[0] || valFromInput();

        return {
            street,
            city,
            state,
            zip,
            raw: place
        };
    };

    const valFromInput = () => inputRef.current?.value || "";

    return (
        <div className="relative">
            <Input
                id={id}
                ref={inputRef}
                value={value}
                onChange={handleInputChange}
                placeholder={placeholder}
                className={cn(className, isVerified && "pr-8 border-green-500/50 focus-visible:ring-green-500/20")}
                autoComplete="off"
            />
            {isVerified && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600 animate-in zoom-in spin-in-90 duration-300">
                    <CheckCircle2 className="h-4 w-4" />
                </div>
            )}
            {isVerified && (
                <div className="absolute -bottom-5 right-0 text-[10px] font-medium text-green-600 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                    <Check className="h-3 w-3" /> Address Verified via Maps
                </div>
            )}
            {!isVerified && value.length > 3 && (
                <div className="absolute -bottom-5 right-0 text-[10px] text-gray-400 animate-in fade-in">
                    Start typing to see suggestions...
                </div>
            )}
        </div>
    );
}
