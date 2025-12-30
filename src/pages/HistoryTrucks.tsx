
import VehicleManager from "@/components/VehicleManager";

const HistoryTrucks = () => {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Trucks History</h1>
        <p className="text-gray-600">Historical data and records for your truck fleet</p>
      </div>
      <VehicleManager />
    </div>
  );
};

export default HistoryTrucks;
