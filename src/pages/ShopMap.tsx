
import { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { Shop } from "@/components/shops/types/ShopTypes";

interface ShopMapProps {
  shops: Shop[];
  center?: { lat: number; lng: number };
}

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "AIzaSyCCej-dqJ3vLFfiXyVC8JvNOdzNuYOpczI";

const ShopMap = ({ shops, center }: ShopMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeMap();
  }, []);

  useEffect(() => {
    if (mapInstanceRef.current) {
      console.log("ShopMap: Updating markers with shops:", shops);
      updateMarkers();
    }
  }, [shops]);

  // ... (existing code)

  const initializeMap = async () => {
    if (!mapRef.current) return;

    try {
      const loader = new Loader({
        apiKey: GOOGLE_MAPS_API_KEY,
        version: "weekly",
        libraries: ["places"],
      });

      await loader.load();

      const map = new window.google.maps.Map(mapRef.current, {
        zoom: 4,
        center: center || { lat: 41.8781, lng: -87.6298 }, // Chicago
        styles: mapStyle,
        disableDefaultUI: false,
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
      });

      mapInstanceRef.current = map;
      setLoading(false);
      updateMarkers();
    } catch (error) {
      console.error('Error loading Google Maps:', error);
      setLoading(false);
    }
  };

  const updateMarkers = () => {
    if (!mapInstanceRef.current || !window.google) return;

    console.log(`ShopMap: Processing ${shops.length} shops for markers.`);

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    const bounds = new window.google.maps.LatLngBounds();
    let hasPoints = false;
    let validShops = 0;

    shops.forEach(shop => {
      // Typically shops have lat/long. If not, we might need to geocode or skip.
      // Assuming shop has latitude and longitude for now as per ShopCreatePayload
      if (shop.latitude && shop.longitude) {
        validShops++;
        const pos = { lat: shop.latitude, lng: shop.longitude };
        const icon = getMarkerIcon(shop.rate_category);

        const marker = new window.google.maps.Marker({
          position: pos,
          map: mapInstanceRef.current,
          title: shop.shop_name,
          icon: icon,
        });

        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 8px;">
              <h3 style="font-weight: bold; margin-bottom: 4px;">${shop.shop_name}</h3>
              <p style="font-size: 12px; color: #666;">${shop.address}</p>
              <p style="font-size: 12px; color: #666;">${shop.phone || ''}</p>
              <span style="font-size: 10px; font-weight: bold; color: ${icon.fillColor}; text-transform: uppercase;">
                ${shop.rate_category === 'green' ? 'Preferred' : shop.rate_category === 'orange' ? 'Standard' : 'Restricted'}
              </span>
            </div>
          `
        });

        marker.addListener("click", () => {
          infoWindow.open({
            anchor: marker,
            map: mapInstanceRef.current,
          });
        });

        markersRef.current.push(marker);
        bounds.extend(pos);
        hasPoints = true;
      } else {
        console.warn(`ShopMap: Skipping shop "${shop.shop_name}" (ID: ${shop.id}) - Missing coordinates.`, { lat: shop.latitude, lng: shop.longitude, address: shop.address });
      }
    });

    console.log(`ShopMap: Added ${validShops} markers. Skipped ${shops.length - validShops} shops.`);

    if (hasPoints && !center) {
      mapInstanceRef.current.fitBounds(bounds);
    }
  };



  return (
    <div className="w-full h-full relative">
      {loading && (
        <div className="absolute inset-0 bg-slate-100 flex items-center justify-center z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
      <div ref={mapRef} className="w-full h-full min-h-[500px]" />
    </div>
  );
};

const mapStyle = [
  {
    "featureType": "administrative",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#444444" }]
  },
  {
    "featureType": "landscape",
    "elementType": "all",
    "stylers": [{ "color": "#f2f2f2" }]
  },
  {
    "featureType": "poi",
    "elementType": "all",
    "stylers": [{ "visibility": "off" }]
  },
  {
    "featureType": "road",
    "elementType": "all",
    "stylers": [{ "saturation": -100 }, { "lightness": 45 }]
  },
  {
    "featureType": "road.highway",
    "elementType": "all",
    "stylers": [{ "visibility": "simplified" }]
  },
  {
    "featureType": "water",
    "elementType": "all",
    "stylers": [{ "color": "#cbd5e1" }, { "visibility": "on" }]
  }
];

const getMarkerIcon = (category: 'green' | 'orange' | 'red') => {
  const colors = {
    green: "#10B981", // Emerald 500
    orange: "#F97316", // Orange 500
    red: "#F43F5E",    // Rose 500
  };

  const color = colors[category] || colors.orange; // Default to orange

  return {
    path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
    fillColor: color,
    fillOpacity: 1,
    strokeWeight: 1,
    strokeColor: "#FFFFFF",
    scale: 1.5,
    anchor: new google.maps.Point(12, 22), // Bottom tip of the pin
    labelOrigin: new google.maps.Point(12, -10),
  };
};

export default ShopMap;
