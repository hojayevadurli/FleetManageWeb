
import { useEffect, useState } from "react";
import FleetMapView from "@/components/vehicle/FleetMapView";
import api from "@/lib/Api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const FleetMap = () => {
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLocations = async () => {
            try {
                const [trucksRes, trailersRes] = await Promise.all([
                    api.get("/trucks"),
                    api.get("/trailers")
                ]);

                const trucks = (trucksRes.data || []).map((t: any) => ({
                    ...t,
                    vehicle_id: t.number,
                    type: 'truck'
                }));

                const trailers = (trailersRes.data || []).map((t: any) => ({
                    ...t,
                    vehicle_id: t.number,
                    type: 'trailer'
                }));

                setVehicles([...trucks, ...trailers]);
            } catch (error) {
                console.error("Failed to fetch fleet locations:", error);
                toast.error("Failed to load vehicle locations");
            } finally {
                setLoading(false);
            }
        };

        fetchLocations();
    }, []);

    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-500 h-[calc(100vh-80px)] flex flex-col">
            <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Fleet Command</h1>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Live Asset Geospatial Monitoring</p>
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
