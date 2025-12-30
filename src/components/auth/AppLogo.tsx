
export const AppLogo = () => {
  return (
    <div className="text-center mb-8">
      <div className="flex items-center justify-center space-x-3 mb-4">
        <img 
          src="https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=100&h=100&fit=crop&q=80" 
          alt="Fleetmanage.ai Logo" 
          className="h-12 w-12 rounded-full"
        />
        <div>
          <h1 className="text-3xl font-bold text-white">Fleetmanage.ai</h1>
          <p className="text-blue-200 text-sm">AI-Powered Fleet Management</p>
        </div>
      </div>
    </div>
  );
};
