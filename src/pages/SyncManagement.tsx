
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SyncDashboard from "@/components/sync/SyncDashboard";
import DriverManager from "@/components/DriverManager";
import VehicleManager from "@/components/VehicleManager";

const SyncManagement = () => {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Motive Integration</h1>
        <p className="text-gray-600">Synchronize and manage entities between your system and Motive TMS</p>
      </div>
      
      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Sync Dashboard</TabsTrigger>
          <TabsTrigger value="drivers">Drivers</TabsTrigger>
          <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
          <TabsTrigger value="logs">Sync Logs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="space-y-6">
          <SyncDashboard />
        </TabsContent>
        
        <TabsContent value="drivers" className="space-y-6">
          <DriverManager />
        </TabsContent>
        
        <TabsContent value="vehicles" className="space-y-6">
          <VehicleManager />
        </TabsContent>
        
        <TabsContent value="logs" className="space-y-6">
          {/* This will show detailed logs - could be enhanced further */}
          <div className="text-center py-12 text-gray-500">
            Detailed sync logs and monitoring coming soon...
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SyncManagement;
