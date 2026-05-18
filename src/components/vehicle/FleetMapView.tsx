import { getGoogleMapsApiKey } from "@/lib/mapsConfig";
import { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Truck,
  Navigation,
  Signal,
  Search,
  Loader2,
  Compass,
  X,
  Droplets,
  Pencil,
  Check,
} from "lucide-react";
import { Loader } from "@googlemaps/js-api-loader";
import { toast } from "sonner";
import api from "@/lib/Api";

type MotiveStatus = 'driving' | 'idle' | 'parked' | 'in shop' | 'offline';

interface Vehicle {
  id: string;
  vehicle_id: string;
  unitNumber?: string;
  make: string;
  model: string;
  year: number;
  status: MotiveStatus;
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

const STATUS_CONFIG: Record<MotiveStatus, { color: string; label: string; badge: string; dot: string }> = {
  driving: { color: '#10B981', label: 'Driving',  badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  idle:    { color: '#F59E0B', label: 'Idling',   badge: 'bg-amber-100 text-amber-700 border-amber-200',       dot: 'bg-amber-500'   },
  parked:  { color: '#8B5CF6', label: 'Parked',   badge: 'bg-violet-100 text-violet-700 border-violet-200',    dot: 'bg-violet-500'  },
  'in shop': { color: '#F97316', label: 'In Shop', badge: 'bg-orange-100 text-orange-700 border-orange-200',   dot: 'bg-orange-500'  },
  offline: { color: '#94A3B8', label: 'Offline',  badge: 'bg-slate-100 text-slate-500 border-slate-200',       dot: 'bg-slate-400'   },
};

const getStatusConfig = (status: string) =>
  STATUS_CONFIG[status as MotiveStatus] ?? STATUS_CONFIG.offline;

const FleetMapView = ({ vehicles }: FleetMapViewProps) => {
  const [mapLoading, setMapLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<MotiveStatus | 'all'>('all');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [fuelEdit, setFuelEdit] = useState<{ vehicleId: string; value: string } | null>(null);
  const [localFuelLevels, setLocalFuelLevels] = useState<Record<string, number>>({});

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Record<string, google.maps.Marker>>({});

  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch = (v.vehicle_id || v.unitNumber || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
      const apiKey = await getGoogleMapsApiKey();
      const loader = new Loader({ apiKey, version: "weekly" });
      await loader.load();

      const map = new window.google.maps.Map(mapRef.current, {
        zoom: 4,
        center: { lat: 39.8283, lng: -98.5795 },
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
              url: getMarkerIcon(v),
              scaledSize: new window.google.maps.Size(48, 48),
              anchor: new window.google.maps.Point(24, 24),
            },
          });

          marker.addListener('click', () => {
            setSelectedVehicleId(v.id);
            mapInstanceRef.current?.panTo(pos);
            mapInstanceRef.current?.setZoom(12);
          });

          markersRef.current[v.id] = marker;
        } else {
          markersRef.current[v.id].setPosition(pos);
          markersRef.current[v.id].setIcon({
            url: getMarkerIcon(v),
            scaledSize: new window.google.maps.Size(48, 48),
            anchor: new window.google.maps.Point(24, 24),
          });
        }

        bounds.extend(pos);
        hasPoints = true;
      }
    });

    if (hasPoints && !selectedVehicleId) {
      mapInstanceRef.current.fitBounds(bounds, 50);
    }
  };

  const getMarkerIcon = (v: Vehicle): string => {
    const cfg = getStatusConfig(v.status);
    const color = cfg.color;
    const unitNum = (v.vehicle_id || v.unitNumber || '').toString().slice(0, 5);
    const isDriving = v.status === 'driving';
    const isOffline = v.status === 'offline';

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
      ${isDriving ? `<circle cx="24" cy="24" r="23" fill="${color}" opacity="0.18"/>` : ''}
      <circle cx="24" cy="24" r="20" fill="${isOffline ? '#F8FAFC' : 'white'}" stroke="${color}" stroke-width="${isDriving ? 3 : 2}"/>
      ${isDriving ? `
        <polygon points="24,6 28,13 20,13" fill="${color}"/>
      ` : ''}
      ${v.type === 'truck' ? `
        <path d="M13 22h22l2 4v7h-5v-2H16v2h-5v-7l2-4z" fill="${color}" opacity="${isOffline ? '0.35' : '0.9'}"/>
        <circle cx="18" cy="33" r="2.5" fill="${isOffline ? '#CBD5E1' : 'white'}"/>
        <circle cx="30" cy="33" r="2.5" fill="${isOffline ? '#CBD5E1' : 'white'}"/>
      ` : `
        <rect x="14" y="18" width="20" height="14" rx="2" fill="${color}" opacity="${isOffline ? '0.35' : '0.9'}"/>
        <circle cx="18" cy="33" r="2" fill="${isOffline ? '#CBD5E1' : 'white'}"/>
        <circle cx="30" cy="33" r="2" fill="${isOffline ? '#CBD5E1' : 'white'}"/>
      `}
      ${unitNum ? `<text x="24" y="17" text-anchor="middle" font-size="7" font-family="Arial,sans-serif" font-weight="800" fill="${color}" opacity="0.8">${unitNum}</text>` : ''}
    </svg>`;

    return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
  };

  const saveFuelLevel = async (vehicleId: string) => {
    if (!fuelEdit) return;
    const pct = parseFloat(fuelEdit.value);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      toast.error("Enter a number between 0 and 100");
      return;
    }
    try {
      await api.patch(`/equipment/${vehicleId}/fuel-level`, { fuelLevelPercent: pct });
      setLocalFuelLevels(prev => ({ ...prev, [vehicleId]: pct }));
      toast.success(`Fuel level set to ${Math.round(pct)}%`);
    } catch {
      toast.error("Failed to save fuel level");
    }
    setFuelEdit(null);
  };

  const focusVehicle = (v: Vehicle) => {
    setSelectedVehicleId(v.id);
    if (v.current_location?.latitude && v.current_location?.longitude && mapInstanceRef.current) {
      mapInstanceRef.current.panTo({ lat: v.current_location.latitude, lng: v.current_location.longitude });
      mapInstanceRef.current.setZoom(14);
    } else {
      toast.error("No real-time location available for this asset.");
    }
  };

  const statusCounts = vehicles.reduce<Record<string, number>>((acc, v) => {
    acc[v.status] = (acc[v.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="flex h-full w-full relative overflow-hidden bg-slate-50">
      {/* Sidebar */}
      <div className="w-80 h-full border-r border-slate-200 bg-white shadow-xl z-20 flex flex-col">
        {/* Search */}
        <div className="p-4 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              placeholder="Find asset..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Status filter pills */}
        <div className="px-4 py-3 border-b border-slate-100 flex gap-1.5 flex-wrap">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${statusFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
          >
            All ({vehicles.length})
          </button>
          {(Object.keys(STATUS_CONFIG) as MotiveStatus[]).filter(s => statusCounts[s]).map(s => {
            const cfg = STATUS_CONFIG[s];
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border ${statusFilter === s ? cfg.badge + ' ring-1' : 'bg-slate-50 text-slate-400 border-transparent hover:bg-slate-100'}`}
              >
                <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${cfg.dot}`} />
                {cfg.label} ({statusCounts[s]})
              </button>
            );
          })}
        </div>

        {/* Vehicle list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredVehicles.length === 0 && (
            <div className="text-center py-10 text-xs font-bold text-slate-400 uppercase tracking-widest">
              No assets match
            </div>
          )}
          {filteredVehicles.map(v => {
            const cfg = getStatusConfig(v.status);
            return (
              <div
                key={v.id}
                onClick={() => focusVehicle(v)}
                className={`p-3.5 rounded-2xl cursor-pointer transition-all border ${selectedVehicleId === v.id ? 'bg-blue-50 border-blue-200 shadow-sm' : 'hover:bg-slate-50 border-transparent'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: cfg.color + '22', border: `1.5px solid ${cfg.color}44` }}
                    >
                      <Truck className="w-3.5 h-3.5" style={{ color: cfg.color }} />
                    </div>
                    <span className="text-sm font-black text-slate-900 tracking-tight">{v.vehicle_id || v.unitNumber}</span>
                  </div>
                  <Badge className={`text-[9px] font-black uppercase tracking-widest border ${cfg.badge}`}>
                    <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${cfg.dot} ${v.status === 'driving' ? 'animate-pulse' : ''}`} />
                    {cfg.label}
                  </Badge>
                </div>
                {v.driver_assigned && (
                  <div className="text-[10px] font-bold text-slate-500 mb-1.5">{v.driver_assigned}</div>
                )}
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span className="line-clamp-1">{v.current_location?.address || 'Awaiting signal...'}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom status panel */}
        <div className="p-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2 mb-3">
            <Signal className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Fleet Status</span>
          </div>
          {/* Legend */}
          <div className="grid grid-cols-2 gap-1.5 mb-3">
            {(Object.keys(STATUS_CONFIG) as MotiveStatus[]).map(s => {
              const cfg = STATUS_CONFIG[s];
              const count = statusCounts[s] || 0;
              return (
                <div key={s} className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
                  <span className="text-[9px] font-bold text-slate-400">{cfg.label}</span>
                  <span className="text-[9px] font-black text-white ml-auto">{count}</span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between items-center border-t border-slate-800 pt-3">
            <div className="text-xl font-black">{vehicles.length}<span className="text-xs text-slate-400 ml-1">Assets</span></div>
            <div className="text-xs font-bold text-emerald-400">{statusCounts['driving'] || 0} Moving</div>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 h-full relative">
        {mapLoading && (
          <div className="absolute inset-0 bg-slate-100 flex flex-col items-center justify-center z-10">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Loading Satellite Grid...</p>
          </div>
        )}
        <div ref={mapRef} className="w-full h-full" />

        {/* Map controls */}
        <div className="absolute top-6 right-6 flex flex-col gap-3">
          <button
            onClick={() => {
              const bounds = new window.google.maps.LatLngBounds();
              let has = false;
              filteredVehicles.forEach(v => {
                if (v.current_location?.latitude && v.current_location?.longitude) {
                  bounds.extend({ lat: v.current_location.latitude, lng: v.current_location.longitude });
                  has = true;
                }
              });
              if (has) mapInstanceRef.current?.fitBounds(bounds, 50);
            }}
            className="bg-white/90 backdrop-blur p-3.5 rounded-2xl shadow-xl border border-slate-200 text-slate-600 hover:text-blue-600 transition-all font-black text-[10px] uppercase tracking-widest flex items-center gap-2"
          >
            <Navigation className="w-4 h-4" /> Recenter
          </button>
          <button className="bg-white/90 backdrop-blur p-3.5 rounded-2xl shadow-xl border border-slate-200 text-slate-600 hover:text-blue-600 transition-all font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
            <Compass className="w-4 h-4" /> Satellite
          </button>
        </div>

        {/* Selected asset card */}
        {selectedVehicleId && (() => {
          const v = vehicles.find(x => x.id === selectedVehicleId);
          if (!v) return null;
          const cfg = getStatusConfig(v.status);
          return (
            <div className="absolute bottom-6 left-6 right-6 animate-in slide-in-from-bottom duration-500">
              <div className="bg-white/95 backdrop-blur rounded-[2.5rem] p-5 shadow-2xl border border-white max-w-2xl mx-auto flex items-center gap-6">
                <div
                  className="w-16 h-16 rounded-[1.5rem] flex flex-col items-center justify-center shrink-0"
                  style={{ backgroundColor: cfg.color + '15', border: `2px solid ${cfg.color}40` }}
                >
                  <div className="text-[9px] font-black uppercase mb-0.5" style={{ color: cfg.color }}>Unit</div>
                  <div className="text-lg font-black text-slate-900">{v.vehicle_id || v.unitNumber}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-base font-black text-slate-900 truncate">{v.year} {v.make} {v.model}</h4>
                    <Badge className={`text-[9px] font-black uppercase border shrink-0 ${cfg.badge}`}>
                      <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${cfg.dot} ${v.status === 'driving' ? 'animate-pulse' : ''}`} />
                      {cfg.label}
                    </Badge>
                  </div>
                  {v.driver_assigned && (
                    <p className="text-xs font-bold text-slate-500 mb-1 truncate">{v.driver_assigned}</p>
                  )}
                  <p className="text-xs font-bold text-slate-400 truncate">{v.current_location?.address || 'Unknown Region'}</p>
                  <div className="flex items-center gap-4 mt-2">
                    {(() => {
                      const fuelPct = localFuelLevels[v.id] ?? v.fuel_level;
                      const isEditing = fuelEdit?.vehicleId === v.id;
                      return (
                        <div className="flex items-center gap-2 flex-1">
                          <Droplets className={`w-3.5 h-3.5 shrink-0 ${fuelPct == null ? 'text-slate-300' : fuelPct < 25 ? 'text-red-500' : fuelPct < 50 ? 'text-amber-500' : 'text-blue-500'}`} />
                          {isEditing ? (
                            <div className="flex items-center gap-1.5 flex-1">
                              <input
                                autoFocus
                                type="number"
                                min={0}
                                max={100}
                                value={fuelEdit.value}
                                onChange={e => setFuelEdit({ vehicleId: v.id, value: e.target.value })}
                                onKeyDown={e => { if (e.key === 'Enter') saveFuelLevel(v.id); if (e.key === 'Escape') setFuelEdit(null); }}
                                className="w-16 text-xs font-black text-slate-900 border border-blue-300 rounded-lg px-2 py-0.5 outline-none focus:ring-2 focus:ring-blue-400/30"
                              />
                              <span className="text-xs text-slate-400 font-bold">%</span>
                              <button onClick={() => saveFuelLevel(v.id)} className="p-1 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors">
                                <Check className="w-3 h-3" />
                              </button>
                              <button onClick={() => setFuelEdit(null)} className="p-1 rounded-lg bg-slate-100 text-slate-400 hover:bg-slate-200 transition-colors">
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : fuelPct != null ? (
                            <div className="flex-1">
                              <div className="flex justify-between mb-0.5 items-center">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wide">Fuel</span>
                                <div className="flex items-center gap-1">
                                  <span className={`text-[10px] font-black ${fuelPct < 25 ? 'text-red-600' : fuelPct < 50 ? 'text-amber-600' : 'text-slate-900'}`}>
                                    {Math.round(fuelPct)}%
                                  </span>
                                  <button onClick={() => setFuelEdit({ vehicleId: v.id, value: String(Math.round(fuelPct)) })} className="p-0.5 rounded hover:bg-slate-100 text-slate-300 hover:text-slate-500 transition-colors">
                                    <Pencil className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              </div>
                              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${fuelPct < 25 ? 'bg-red-500' : fuelPct < 50 ? 'bg-amber-500' : 'bg-blue-500'}`}
                                  style={{ width: `${fuelPct}%` }}
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 flex-1">
                              <span className="text-xs font-bold text-slate-400">Fuel N/A</span>
                              <button onClick={() => setFuelEdit({ vehicleId: v.id, value: '' })} className="p-0.5 rounded hover:bg-slate-100 text-slate-300 hover:text-slate-500 transition-colors">
                                <Pencil className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <button className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-lg hover:bg-slate-800 transition-all">
                    <Navigation className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSelectedVehicleId(null)}
                    className="bg-slate-100 text-slate-400 p-3.5 rounded-2xl hover:bg-rose-50 hover:text-rose-500 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

const mapStyle = [
  { featureType: "administrative", elementType: "labels.text.fill", stylers: [{ color: "#444444" }] },
  { featureType: "landscape", elementType: "all", stylers: [{ color: "#f2f2f2" }] },
  { featureType: "poi", elementType: "all", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "all", stylers: [{ saturation: -100 }, { lightness: 45 }] },
  { featureType: "road.highway", elementType: "all", stylers: [{ visibility: "simplified" }] },
  { featureType: "road.arterial", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { featureType: "transit", elementType: "all", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "all", stylers: [{ color: "#cbd5e1" }, { visibility: "on" }] },
];

export default FleetMapView;
