import { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  RefreshCw,
  Truck,
  Navigation,
  Signal,
  Search,
  Filter,
  ChevronRight,
  Loader2,
  Activity,
  Compass,
  X,
  Droplets
} from "lucide-react";
import { Loader } from "@googlemaps/js-api-loader";
import { toast } from "sonner";

interface Vehicle {
  id: string;
  vehicle_id: string;
  unitNumber?: string;
  make: string;
  model: string;
  year: number;
  status: 'active' | 'inactive' | 'in shop' | 'moving';
  current_location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  last_location_update?: string;
  fuel_level?: number;
  driver_assigned?: string;
  type: 'truck' | 'trailer';
}

interface FleetMapViewProps {
  vehicles: Vehicle[];
}

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "AIzaSyCCej-dqJ3vLFfiXyVC8JvNOdzNuYOpczI";

const FleetMapView = ({ vehicles }: FleetMapViewProps) => {
  const [loading, setLoading] = useState(false);
  const [mapLoading, setMapLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Record<string, google.maps.Marker>>({});

  const filteredVehicles = vehicles.filter(v =>
    (v.vehicle_id || v.unitNumber || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    initializeMap();
  }, []);

  useEffect(() => {
    if (mapInstanceRef.current) {
      updateMarkers();
    }
  }, [vehicles, filteredVehicles]);

  const initializeMap = async () => {
    if (!mapRef.current) return;

    try {
      const loader = new Loader({
        apiKey: GOOGLE_MAPS_API_KEY,
        version: "weekly",
      });

      await loader.load();

      const map = new window.google.maps.Map(mapRef.current, {
        zoom: 4,
        center: { lat: 39.8283, lng: -98.5795 }, // Center of US
        styles: mapStyle,
        disableDefaultUI: true,
        zoomControl: true,
      });

      mapInstanceRef.current = map;
      setMapLoading(false);
      updateMarkers();
    } catch (error) {
      console.error('Error loading Google Maps:', error);
      setMapLoading(false);
    }
  };

  const updateMarkers = () => {
    if (!mapInstanceRef.current || !window.google) return;

    // Clear markers that are no longer in the filtered list
    const filteredIds = new Set(filteredVehicles.map(v => v.id));
    Object.keys(markersRef.current).forEach(id => {
      if (!filteredIds.has(id)) {
        markersRef.current[id].setMap(null);
        delete markersRef.current[id];
      }
    });

    const bounds = new window.google.maps.LatLngBounds();
    let hasPoints = false;

    filteredVehicles.forEach(v => {
      if (v.current_location?.latitude && v.current_location?.longitude) {
        const pos = { lat: v.current_location.latitude, lng: v.current_location.longitude };

        if (!markersRef.current[v.id]) {
          const marker = new window.google.maps.Marker({
            position: pos,
            map: mapInstanceRef.current,
            title: v.vehicle_id,
            icon: {
              url: getIcon(v),
              scaledSize: new window.google.maps.Size(40, 40),
              anchor: new window.google.maps.Point(20, 20)
            }
          });

          marker.addListener('click', () => {
            setSelectedVehicleId(v.id);
            mapInstanceRef.current?.panTo(pos);
            mapInstanceRef.current?.setZoom(12);
          });

          markersRef.current[v.id] = marker;
        } else {
          markersRef.current[v.id].setPosition(pos);
        }

        bounds.extend(pos);
        hasPoints = true;
      }
    });

    if (hasPoints && !selectedVehicleId) {
      mapInstanceRef.current.fitBounds(bounds, 50);
    }
  };

  const getIcon = (v: Vehicle) => {
    const color = v.status === 'moving' ? '#3B82F6' : v.status === 'active' ? '#10B981' : '#64748B';
    const svg = v.type === 'truck' ?
      `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
                <circle cx="20" cy="20" r="18" fill="white" stroke="${color}" stroke-width="2" />
                <path d="M10 20h20v6h-20z" fill="${color}" opacity="0.2"/>
                <path d="M12 18h16l2 4v8h-4v-2h-12v2h-4v-8l2-4z" fill="${color}" />
                <circle cx="16" cy="30" r="2" fill="${color}" />
                <circle cx="24" cy="30" r="2" fill="${color}" />
            </svg>` :
      `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
                <circle cx="20" cy="20" r="18" fill="white" stroke="${color}" stroke-width="2" />
                <rect x="12" y="15" width="16" height="15" rx="2" fill="${color}" />
            </svg>`;

    return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
  };

  const focusVehicle = (v: Vehicle) => {
    setSelectedVehicleId(v.id);
    if (v.current_location?.latitude && v.current_location?.longitude && mapInstanceRef.current) {
      mapInstanceRef.current.panTo({
        lat: v.current_location.latitude,
        lng: v.current_location.longitude
      });
      mapInstanceRef.current.setZoom(14);
    } else {
      toast.error("No real-time location available for this asset.");
    }
  };

  return (
    <div className="flex h-full w-full relative overflow-hidden bg-slate-50">
      {/* Sidebar Controls */}
      <div className="w-80 h-full border-r border-slate-200 bg-white shadow-xl z-20 flex flex-col">
        <div className="p-6 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              placeholder="Find asset..."
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredVehicles.map(v => (
            <div
              key={v.id}
              onClick={() => focusVehicle(v)}
              className={`p-4 rounded-2xl cursor-pointer transition-all border ${selectedVehicleId === v.id ? 'bg-blue-50 border-blue-200 shadow-sm' : 'hover:bg-slate-50 border-transparent'
                }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${v.type === 'truck' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    <Truck className="w-3 h-3" />
                  </div>
                  <span className="text-sm font-black text-slate-900 tracking-tight">{v.vehicle_id || v.unitNumber}</span>
                </div>
                <Badge className={`text-[9px] font-black uppercase tracking-widest ${v.status === 'moving' ? 'bg-blue-100 text-blue-600' : v.status === 'active' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'
                  }`}>
                  {v.status}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                <MapPin className="w-3 h-3" />
                <span className="line-clamp-1">{v.current_location?.address || 'Syncing coordinates...'}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 bg-slate-900 text-white">
          <div className="flex items-center gap-3 mb-4">
            <Signal className="w-4 h-4 text-blue-400 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">System Status</span>
          </div>
          <div className="flex justify-between items-end">
            <div className="text-2xl font-black">{vehicles.length}<span className="text-xs text-slate-400 ml-1">Assets Linked</span></div>
            <button className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 h-full relative">
        {mapLoading && (
          <div className="absolute inset-0 bg-slate-100 flex flex-col items-center justify-center z-10">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Loading Satellite Grid...</p>
          </div>
        )}
        <div ref={mapRef} className="w-full h-full" />

        {/* Floating Map Overlay Controls */}
        <div className="absolute top-6 right-6 flex flex-col gap-3">
          <button className="bg-white/90 backdrop-blur p-4 rounded-2xl shadow-xl border border-slate-200 text-slate-600 hover:text-blue-600 transition-all font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
            <Navigation className="w-4 h-4" /> Recenter
          </button>
          <button className="bg-white/90 backdrop-blur p-4 rounded-2xl shadow-xl border border-slate-200 text-slate-600 hover:text-blue-600 transition-all font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
            <Compass className="w-4 h-4" /> Satellite
          </button>
        </div>

        {/* Selected Asset Mini-Card Overlay */}
        {selectedVehicleId && (
          <div className="absolute bottom-6 left-6 right-6 animate-in slide-in-from-bottom duration-500">
            <div className="bg-white/95 backdrop-blur rounded-[2.5rem] p-6 shadow-2xl border border-white max-w-2xl mx-auto flex items-center gap-8">
              {(() => {
                const v = vehicles.find(x => x.id === selectedVehicleId);
                if (!v) return null;
                return (
                  <>
                    <div className="w-20 h-20 bg-slate-900 rounded-[1.5rem] flex flex-col items-center justify-center text-white shrink-0">
                      <div className="text-[10px] font-black uppercase text-blue-400 mb-1">Unit</div>
                      <div className="text-xl font-black">{v.vehicle_id || v.unitNumber}</div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-black text-slate-900">{v.year} {v.make} {v.model}</h4>
                        <Badge className="bg-blue-600 text-white px-3">Live</Badge>
                      </div>
                      <p className="text-sm font-bold text-slate-500 mb-4">{v.current_location?.address || 'Unknown Region'}</p>
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4 text-emerald-500" />
                          <span className="text-xs font-black text-slate-900 tracking-tight">88% Health</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Droplets className="w-4 h-4 text-blue-500" />
                          <span className="text-xs font-black text-slate-900 tracking-tight">{v.fuel_level || '--'}% Fuel</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      <button className="bg-slate-900 text-white p-4 rounded-2xl shadow-lg hover:bg-slate-800 transition-all">
                        <Navigation className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setSelectedVehicleId(null)}
                        className="bg-slate-100 text-slate-400 p-4 rounded-2xl hover:bg-rose-50 hover:text-rose-500 transition-all"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>
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
    "featureType": "road.arterial",
    "elementType": "labels.icon",
    "stylers": [{ "visibility": "off" }]
  },
  {
    "featureType": "transit",
    "elementType": "all",
    "stylers": [{ "visibility": "off" }]
  },
  {
    "featureType": "water",
    "elementType": "all",
    "stylers": [{ "color": "#cbd5e1" }, { "visibility": "on" }]
  }
];

export default FleetMapView;
