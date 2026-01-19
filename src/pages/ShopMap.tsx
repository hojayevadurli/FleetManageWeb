
import { useEffect, useRef, useState, useMemo } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { Shop, VENDOR_PREFERENCE_CONFIG } from "@/components/shops/types/ShopTypes";
import { Locate, MapPin, Star, Phone, Navigation2, AlertCircle } from "lucide-react";

interface ShopMapProps {
  shops: Shop[];
  center?: { lat: number; lng: number };
}

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "AIzaSyAeI6_E9c4EMx9T4t_FjyVUGSTN38GV69c";

const ShopMap = ({ shops, center }: ShopMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Computed stats for the map
  const mapStats = useMemo(() => {
    const withCoords = shops.filter(s => s.latitude && s.longitude);
    const withoutCoords = shops.filter(s => !s.latitude || !s.longitude);
    return { withCoords, withoutCoords, total: shops.length };
  }, [shops]);

  useEffect(() => {
    initializeMap();
  }, []);

  useEffect(() => {
    if (mapInstanceRef.current) {
      console.log("ShopMap: Updating markers with shops:", shops);
      updateMarkers();
    }
  }, [shops]);

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
        fullscreenControl: true,
      });

      mapInstanceRef.current = map;
      infoWindowRef.current = new window.google.maps.InfoWindow();
      setLoading(false);
      updateMarkers();
    } catch (error) {
      console.error('Error loading Google Maps:', error);
      setLoading(false);
    }
  };

  const centerOnUser = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
          setUserLocation(loc);
          if (mapInstanceRef.current) {
            mapInstanceRef.current.panTo(loc);
            mapInstanceRef.current.setZoom(10);

            // Add user location marker
            new window.google.maps.Marker({
              position: loc,
              map: mapInstanceRef.current,
              title: "Your Location",
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: "#3b82f6",
                fillOpacity: 1,
                strokeColor: "#ffffff",
                strokeWeight: 3,
              },
            });
          }
        },
        (error) => console.log("Location error:", error)
      );
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
      if (shop.latitude && shop.longitude) {
        validShops++;
        const pos = { lat: shop.latitude, lng: shop.longitude };
        const tierConfig = VENDOR_PREFERENCE_CONFIG[shop.vendor_preference] || VENDOR_PREFERENCE_CONFIG.STANDARD;
        const icon = getMarkerIcon(shop.vendor_preference);

        const marker = new window.google.maps.Marker({
          position: pos,
          map: mapInstanceRef.current,
          title: shop.shop_name,
          icon: icon,
          animation: google.maps.Animation.DROP,
        });

        // Enhanced info window content
        const infoContent = `
          <div style="min-width: 280px; font-family: 'Inter', sans-serif;">
            <div style="padding: 16px;">
              <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                 <div style="width: 40px; height: 40px; background: #f1f5f9; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 900; color: #cbd5e1; font-size: 14px;">
                    ${shop.shop_name.substring(0, 2).toUpperCase()}
                 </div>
                 <div>
                    <h3 style="font-size: 16px; font-weight: 800; color: #0f172a; margin: 0 0 2px 0; line-height: 1.2;">${shop.shop_name}</h3>
                    <p style="font-size: 13px; color: #64748b; margin: 0;">${shop.address}</p>
                 </div>
              </div>
              
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
                <span style="font-size: 14px; font-weight: 700; color: #0f172a;">$${shop.labor_rate}/hr</span>
                <span style="padding: 4px 8px; border-radius: 6px; background: ${tierConfig.bgColor}; color: ${tierConfig.textColor.replace('text-', '') === 'violet-700' ? '#6d28d9' : tierConfig.textColor.replace('text-', '') === 'blue-700' ? '#1d4ed8' : tierConfig.textColor.replace('text-', '') === 'emerald-700' ? '#047857' : tierConfig.textColor.replace('text-', '') === 'orange-700' ? '#c2410c' : '#be123c'}; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
                  ${tierConfig.label}
                </span>
                ${shop.average_rating ? `
                  <span style="display: flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 600; color: #f59e0b; margin-left: auto;">
                    ★ ${shop.average_rating.toFixed(1)}
                  </span>
                ` : ''}
              </div>
              
              <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 16px;">
                ${shop.specialties?.slice(0, 3).map(s => `<span style="padding: 4px 8px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 10px; font-weight: 600; color: #64748b; text-transform: uppercase;">${s}</span>`).join('') || ''}
              </div>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; border-top: 1px solid #f1f5f9; padding-top: 16px;">
                <a href="/app/shops/${shop.id}" style="display: flex; align-items: center; justify-content: center; height: 36px; background: #0f172a; color: white; text-decoration: none; border-radius: 8px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; grid-column: 1 / -1;">
                   View Detail
                </a>
                ${shop.phone ? `
                  <a href="tel:${shop.phone}" style="display: flex; align-items: center; justify-content: center; height: 36px; background: #f1f5f9; color: #0f172a; text-decoration: none; border-radius: 8px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; border: 1px solid #e2e8f0;">
                     Call Shop
                  </a>
                ` : ''}
                <a href="https://www.google.com/maps/dir/?api=1&destination=${shop.latitude},${shop.longitude}" target="_blank" style="display: flex; align-items: center; justify-content: center; height: 36px; background: #3b82f6; color: white; text-decoration: none; border-radius: 8px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">
                   Directions
                </a>
              </div>
            </div>
          </div>
        `;

        marker.addListener("click", () => {
          if (infoWindowRef.current) {
            infoWindowRef.current.setContent(infoContent);
            infoWindowRef.current.open({
              anchor: marker,
              map: mapInstanceRef.current,
            });
          }
        });

        markersRef.current.push(marker);
        bounds.extend(pos);
        hasPoints = true;
      } else {
        console.warn(`ShopMap: Skipping shop "${shop.shop_name}" (ID: ${shop.id}) - Missing coordinates.`);
      }
    });

    console.log(`ShopMap: Added ${validShops} markers. Skipped ${shops.length - validShops} shops.`);

    if (hasPoints && !center) {
      mapInstanceRef.current.fitBounds(bounds);
      // Don't zoom in too much
      const listener = google.maps.event.addListener(mapInstanceRef.current, "idle", () => {
        if (mapInstanceRef.current!.getZoom()! > 14) {
          mapInstanceRef.current!.setZoom(14);
        }
        google.maps.event.removeListener(listener);
      });
    }
  };

  return (
    <div className="w-full h-full relative">
      {loading && (
        <div className="absolute inset-0 bg-slate-100 flex items-center justify-center z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            <span className="text-sm font-bold text-slate-400">Loading map...</span>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div ref={mapRef} className="w-full h-full min-h-[500px]" />

      {/* Legend */}
      <div className="absolute bottom-6 left-6 bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200 p-4 z-10">
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Legend</div>
        <div className="flex flex-col gap-2">
          {Object.entries(VENDOR_PREFERENCE_CONFIG).map(([key, config]) => (
            <div key={key} className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: config.mapColor }} />
              <span className="text-xs font-semibold text-slate-600">{config.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Center on Me Button */}
      <button
        onClick={centerOnUser}
        className="absolute bottom-6 right-6 bg-white hover:bg-slate-50 shadow-lg border border-slate-200 rounded-2xl p-4 z-10 transition-all active:scale-95"
        title="Center on my location"
      >
        <Locate className="w-5 h-5 text-blue-600" />
      </button>

      {/* Missing Coordinates Warning */}
      {mapStats.withoutCoords.length > 0 && !loading && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 rounded-xl shadow-lg z-10 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span className="text-xs font-bold">
            {mapStats.withoutCoords.length} vendor{mapStats.withoutCoords.length > 1 ? 's' : ''} missing location data
          </span>
        </div>
      )}
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

const getMarkerIcon = (category: string) => {
  const config = VENDOR_PREFERENCE_CONFIG[category as keyof typeof VENDOR_PREFERENCE_CONFIG] || VENDOR_PREFERENCE_CONFIG.STANDARD;
  const color = config.mapColor;

  return {
    path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
    fillColor: color,
    fillOpacity: 1,
    strokeWeight: 2,
    strokeColor: "#FFFFFF",
    scale: 1.8,
    anchor: new google.maps.Point(12, 22),
    labelOrigin: new google.maps.Point(12, -10),
  };
};

export default ShopMap;
