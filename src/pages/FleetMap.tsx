
import { useEffect, useState, useCallback, useRef } from "react";
import FleetMapView from "@/components/vehicle/FleetMapView";
import api from "@/lib/Api";
import { toast } from "sonner";
import { Loader2, RefreshCw } from "lucide-react";
import { integrationService } from "@/services/integrationService";

// Sync every 2 min — Motive's location endpoint is a single API call for all vehicles.
// With 2-min windows, a moving vehicle's Motive timestamp will always have changed
// since our last snapshot, giving us reliable driving detection without speed data.
const SYNC_INTERVAL_MS = 2 * 60 * 1000;
const MOVE_THRESHOLD_DEG = 0.0003; // ≈ 33 m

interface LocSnap { lat: number; lng: number; at: string | null; }

// ── Status derivation ─────────────────────────────────────────────────────────
//
// Priority order:
//   1. Speed field from backend  (instant, accurate)
//   2. Motive timestamp + coordinate delta vs previous sync snapshot
//      - Motive pings moving vehicles every 30–60 s, so a changed `lastLocationAt`
//        between our 2-min snapshots means the vehicle was active.
//   3. Location-age heuristic   (first load only, no previous snapshot yet)
//
const deriveStatus = (e: any, prev: LocSnap | undefined): string => {
    if (e.operationalStatus === 2) return 'in shop';
    if (e.lastLatitude == null || e.lastLongitude == null) return 'offline';

    // ── 1. Speed field (backend exposes this once implemented) ───────────────
    const speed =
        e.telematicsSpeedMph ?? e.lastSpeed ?? e.telematicsSpeed ?? e.speed ?? null;
    if (speed != null) {
        if (speed > 2) return 'driving';
        if (speed > 0) return 'idle';
        return 'parked';
    }

    // ── 2. Snapshot comparison ───────────────────────────────────────────────
    if (prev) {
        const timestampChanged = e.lastLocationAt !== prev.at;
        if (!timestampChanged) return 'parked'; // Motive sent nothing new = stationary

        // Motive sent a new ping — was the vehicle actually moving?
        const delta = Math.hypot(e.lastLatitude - prev.lat, e.lastLongitude - prev.lng);
        if (delta > MOVE_THRESHOLD_DEG) return 'driving';
        return 'idle'; // timestamp updated but barely moved = engine on / idling
    }

    // ── 3. First-load fallback (no snapshot yet) ─────────────────────────────
    if (!e.lastLocationAt) return 'parked';
    const ageMin = (Date.now() - new Date(e.lastLocationAt).getTime()) / 60000;
    if (ageMin < 3)  return 'driving';
    if (ageMin < 10) return 'idle';
    return 'parked';
};

const buildVehicle = (e: any, prev: LocSnap | undefined) => ({
    id: e.id,
    vehicle_id: e.unitNumber,
    unitNumber: e.unitNumber,
    make: e.make || 'Unknown Make',
    model: e.model || 'Unknown Model',
    year: e.year || new Date().getFullYear(),
    status: deriveStatus(e, prev),
    current_location: e.lastLatitude != null && e.lastLongitude != null ? {
        latitude: e.lastLatitude,
        longitude: e.lastLongitude,
        address: e.lastLocationAt
            ? `Last located at ${new Date(e.lastLocationAt).toLocaleString()}`
            : 'Unknown Location',
    } : undefined,
    last_location_update: e.lastLocationAt,
    fuel_level: e.telematicsFuelLevel ?? e.fuelLevel ?? e.fuelLevelPercent ?? undefined,
    driver_assigned: e.assignedOperatorName,
    type: (e.equipmentTypeName || '').toLowerCase().includes('trailer') ? 'trailer' : 'truck',
});

// ── Component ─────────────────────────────────────────────────────────────────
const FleetMap = () => {
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [loading, setLoading]   = useState(true);
    const [syncing, setSyncing]   = useState(false);
    const [lastSynced, setLastSynced] = useState<Date | null>(null);

    // In-memory snapshot of previous sync positions — keyed by equipment id.
    // Lives in a ref so it persists across renders without causing re-renders.
    const prevSnapRef = useRef<Map<string, LocSnap>>(new Map());
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const syncingRef  = useRef(false); // guard against overlapping requests

    const syncAndRefresh = useCallback(async (showToast = false) => {
        if (syncingRef.current) return; // skip if previous sync still running
        syncingRef.current = true;
        setSyncing(true);

        try {
            // Fuel is synced inside syncMotive() — no separate fuel call needed
            const [motiveResult] = await Promise.allSettled([
                integrationService.syncMotive(),
            ]);

            const locationSyncOk = motiveResult.status === 'fulfilled';
            if (!locationSyncOk) {
                console.warn("Location sync failed:", (motiveResult as PromiseRejectedResult).reason);
            }

            const { data } = await api.get("/equipment");
            const equipmentList: any[] = data || [];

            // Build vehicles using the previous snapshot for comparison
            const mapped = equipmentList.map(e =>
                buildVehicle(e, prevSnapRef.current.get(e.id))
            );

            // Only advance the snapshot when the sync actually pushed fresh data.
            // If we advanced on a failed sync, we'd compare stale-vs-stale next time
            // and always see zero movement.
            if (locationSyncOk) {
                const nextSnap = new Map<string, LocSnap>();
                equipmentList.forEach(e => {
                    nextSnap.set(e.id, {
                        lat: e.lastLatitude,
                        lng: e.lastLongitude,
                        at:  e.lastLocationAt ?? null,
                    });
                });
                prevSnapRef.current = nextSnap;
            }

            setVehicles(mapped);
            setLastSynced(new Date());
            if (showToast) {
                if (locationSyncOk) toast.success("Vehicle locations updated");
                else toast.warning("Sync error — showing last known positions");
            }
        } catch (err) {
            console.error("Data fetch failed:", err);
            // Show stale DB data without touching the snapshot
            try {
                const { data } = await api.get("/equipment");
                const equipmentList: any[] = data || [];
                setVehicles(equipmentList.map(e =>
                    buildVehicle(e, prevSnapRef.current.get(e.id))
                ));
            } catch { /* keep whatever is on screen */ }
        } finally {
            syncingRef.current = false;
            setSyncing(false);
        }
    }, []);

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            await syncAndRefresh();
            setLoading(false);
        };

        init();
        intervalRef.current = setInterval(() => syncAndRefresh(), SYNC_INTERVAL_MS);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [syncAndRefresh]);

    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-500 h-[calc(100vh-80px)] flex flex-col">
            <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Fleet Command</h1>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">
                        Live Asset Geospatial Monitoring · syncs every 2 min
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {lastSynced && (
                        <span className="text-xs text-slate-400">
                            Updated {lastSynced.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    )}
                    <button
                        onClick={() => syncAndRefresh(true)}
                        disabled={syncing}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 disabled:opacity-50 transition-colors"
                    >
                        <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                        {syncing ? 'Syncing...' : 'Sync Now'}
                    </button>
                </div>
            </div>

            <div className="flex-1 min-h-0 bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                    </div>
                ) : (
                    <FleetMapView vehicles={vehicles} />
                )}
            </div>
        </div>
    );
};

export default FleetMap;
