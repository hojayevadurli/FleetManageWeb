import { getGoogleMapsApiKey } from "@/lib/mapsConfig";
import React, { useEffect, useRef } from 'react';
import { Loader } from "@googlemaps/js-api-loader";

interface LocationPreviewProps {
    latitude: number;
    longitude: number;
    height?: string;
}

const LocationPreview: React.FC<LocationPreviewProps> = ({ latitude, longitude, height = '100%' }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<google.maps.Map | null>(null);
    const markerRef = useRef<google.maps.Marker | null>(null);

    useEffect(() => {
        const initMap = async () => {
            if (!mapRef.current) return;

            const apiKey = await getGoogleMapsApiKey();
            const loader = new Loader({ apiKey, version: "weekly", libraries: ["places"] });

            try {
                await loader.load();

                if (!mapInstanceRef.current) {
                    mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
                        center: { lat: latitude, lng: longitude },
                        zoom: 15,
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

                    markerRef.current = new window.google.maps.Marker({
                        position: { lat: latitude, lng: longitude },
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
                } else {
                    // Update existing map
                    const pos = { lat: latitude, lng: longitude };
                    mapInstanceRef.current.panTo(pos);
                    if (markerRef.current) {
                        markerRef.current.setPosition(pos);
                    }
                }
            } catch (error) {
                console.error("Error initializing map:", error);
            }
        };

        initMap();
    }, [latitude, longitude]);

    return <div ref={mapRef} style={{ width: '100%', height }} className="rounded-2xl" />;
};

export default LocationPreview;
