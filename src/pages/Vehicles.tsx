import { useEffect, useState } from "react";
import { listVehicles, Vehicle } from "@/Service/Vehicles";

export default function Vehicles() {
    const [items, setItems] = useState<Vehicle[]>([]); const [err, setErr] = useState("");
    useEffect(() => { listVehicles().then(setItems).catch(e => setErr(e?.response?.data || "Load failed")); }, []);
    if (err) return <div style={{ color: "crimson" }}>{err}</div>;
    return (
        <div className="p-6">
            <h1>Vehicles</h1>
            <ul>{items.map(v => <li key={v.id}>{v.unitNumber} — {v.make} {v.model} ({v.year})</li>)}</ul>
        </div>
    );
}
