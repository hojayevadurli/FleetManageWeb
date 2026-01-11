
import { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { Shop } from "@/components/shops/types/ShopTypes";

interface ShopMapProps {
  shops: Shop[];
  center?: { lat: number; lng: number };
}

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

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
      updateMarkers();
    }
  }, [shops]);

  useEffect(() => {
    if (mapInstanceRef.current && center) {
      mapInstanceRef.current.panTo(center);
      mapInstanceRef.current.setZoom(12);
    }
  }, [center]);

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
        center: center || { lat: 39.8283, lng: -98.5795 }, // Center of US
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

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    const bounds = new window.google.maps.LatLngBounds();
    let hasPoints = false;

    shops.forEach(shop => {
      // Typically shops have lat/long. If not, we might need to geocode or skip.
      // Assuming shop has latitude and longitude for now as per ShopCreatePayload
      if (shop.latitude && shop.longitude) {
        const pos = { lat: shop.latitude, lng: shop.longitude };

        const marker = new window.google.maps.Marker({
          position: pos,
          map: mapInstanceRef.current,
          title: shop.shop_name,
          // Simple custom icon or default
        });

        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 8px;">
              <h3 style="font-weight: bold; margin-bottom: 4px;">${shop.shop_name}</h3>
              <p style="font-size: 12px; color: #666;">${shop.address}</p>
              <p style="font-size: 12px; color: #666;">${shop.phone || ''}</p>
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
      }
    });

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

export default ShopMap;
