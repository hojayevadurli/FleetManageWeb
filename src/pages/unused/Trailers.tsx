import TrailerManager from "@/components/trailer/TrailerManager";

const Trailers = () => {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Trailers Management</h1>
        <p className="text-gray-600">Manage and monitor your trailer fleet</p>
      </div>
      <TrailerManager />
    </div>
  );
};

export default Trailers;
