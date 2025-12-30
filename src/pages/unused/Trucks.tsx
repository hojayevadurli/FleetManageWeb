import VehicleManager from "@/components/VehicleManager";

const Trucks = () => {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Trucks Management
        </h1>
        <p className="text-gray-600">
          Manage and monitor your truck fleet
        </p>
      </div>
      <VehicleManager />
    </div>
  );
};

export default Trucks;
