export const AppLogo = () => {
  return (
    <div className="text-center mb-8">
      <div className="flex items-center justify-center space-x-3 mb-4">
        <img
          src="/app-logo-dark.png"
          alt="Fleetmanage.ai Logo"
          className="h-12 w-12 rounded-xl object-cover"
        />
        <div>
          <h1 className="text-3xl font-bold text-white">Fleetmanage.ai</h1>
          <p className="text-blue-200 text-sm">AI-Powered Fleet Management</p>
        </div>
      </div>
    </div>
  );
};
