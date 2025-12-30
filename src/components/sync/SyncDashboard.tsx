
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  RefreshCw, 
  Users, 
  Truck, 
  Database, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Activity
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import SyncLogsTable from "./SyncLogsTable";

interface SyncStats {
  lastDriverSync?: string;
  lastVehicleSync?: string;
  totalDrivers: number;
  totalVehicles: number;
  recentSyncLogs: any[];
}

const SyncDashboard = () => {
  const [syncing, setSyncing] = useState<string | null>(null);
  const [stats, setStats] = useState<SyncStats>({
    totalDrivers: 0,
    totalVehicles: 0,
    recentSyncLogs: []
  });
  const { toast } = useToast();

  const fetchStats = async () => {
    try {
      // Get driver count
      const { count: driverCount } = await supabase
        .from('drivers')
        .select('*', { count: 'exact', head: true });

      // Get vehicle count
      const { count: vehicleCount } = await supabase
        .from('vehicles')
        .select('*', { count: 'exact', head: true });

      // Get recent sync logs
      const { data: syncLogs } = await supabase
        .from('sync_logs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(10);

      // Get last sync times
      const lastDriverSync = syncLogs?.find(log => log.sync_type === 'drivers' && log.status === 'success')?.completed_at;
      const lastVehicleSync = syncLogs?.find(log => log.sync_type === 'vehicles' && log.status === 'success')?.completed_at;

      setStats({
        totalDrivers: driverCount || 0,
        totalVehicles: vehicleCount || 0,
        recentSyncLogs: syncLogs || [],
        lastDriverSync,
        lastVehicleSync
      });
    } catch (error) {
      console.error('Error fetching sync stats:', error);
      toast({
        title: "Error",
        description: "Failed to fetch sync statistics",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleSync = async (syncType: 'drivers' | 'vehicles' | 'all_entities') => {
    setSyncing(syncType);
    try {
      toast({
        title: "Sync Started",
        description: `Starting ${syncType.replace('_', ' ')} synchronization...`
      });

      const { data, error } = await supabase.functions.invoke('motive-integration', {
        body: { action: `sync_${syncType}` }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Sync Completed",
          description: data.message
        });
        await fetchStats(); // Refresh stats
      } else {
        throw new Error(data.error || 'Sync failed');
      }
    } catch (error) {
      console.error(`${syncType} sync error:`, error);
      toast({
        title: "Sync Failed",
        description: error.message || `Failed to sync ${syncType}`,
        variant: "destructive"
      });
    } finally {
      setSyncing(null);
    }
  };

  const formatLastSync = (timestamp?: string) => {
    if (!timestamp) return "Never";
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Motive Integration Sync</h2>
          <p className="text-gray-600">Synchronize drivers and vehicles with Motive TMS</p>
        </div>
        <Button 
          variant="outline" 
          onClick={fetchStats}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Stats
        </Button>
      </div>

      {/* Sync Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium">Drivers Synced</CardTitle>
            <Users className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDrivers}</div>
            <p className="text-xs text-gray-600 mt-1">
              Last sync: {formatLastSync(stats.lastDriverSync)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium">Vehicles Synced</CardTitle>
            <Truck className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVehicles}</div>
            <p className="text-xs text-gray-600 mt-1">
              Last sync: {formatLastSync(stats.lastVehicleSync)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium">Total Entities</CardTitle>
            <Database className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDrivers + stats.totalVehicles}</div>
            <p className="text-xs text-gray-600 mt-1">
              Drivers + Vehicles
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sync Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Synchronization Actions</CardTitle>
          <CardDescription>
            Sync entities between your system and Motive TMS
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={() => handleSync('drivers')}
              disabled={syncing !== null}
              className="flex items-center gap-2 h-12"
              variant="outline"
            >
              {syncing === 'drivers' ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Users className="h-4 w-4" />
              )}
              {syncing === 'drivers' ? 'Syncing Drivers...' : 'Sync Drivers'}
            </Button>

            <Button
              onClick={() => handleSync('vehicles')}
              disabled={syncing !== null}
              className="flex items-center gap-2 h-12"
              variant="outline"
            >
              {syncing === 'vehicles' ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Truck className="h-4 w-4" />
              )}
              {syncing === 'vehicles' ? 'Syncing Vehicles...' : 'Sync Vehicles'}
            </Button>

            <Button
              onClick={() => handleSync('all_entities')}
              disabled={syncing !== null}
              className="flex items-center gap-2 h-12"
            >
              {syncing === 'all_entities' ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Database className="h-4 w-4" />
              )}
              {syncing === 'all_entities' ? 'Syncing All...' : 'Sync All Entities'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Sync Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sync Activity</CardTitle>
          <CardDescription>
            View the latest synchronization logs and status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats.recentSyncLogs.length > 0 ? (
            <div className="space-y-3">
              {stats.recentSyncLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(log.status)}
                    <div>
                      <div className="font-medium capitalize">
                        {log.sync_type.replace('_', ' ')} Sync
                      </div>
                      <div className="text-sm text-gray-600">
                        {log.records_processed} records processed, {log.records_successful} successful
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={log.status === 'success' ? 'default' : log.status === 'error' ? 'destructive' : 'secondary'}>
                      {log.status}
                    </Badge>
                    <div className="text-xs text-gray-500 mt-1">
                      {formatLastSync(log.started_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No sync activity yet. Start your first sync above.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Sync Logs Table */}
      <SyncLogsTable logs={stats.recentSyncLogs} />
    </div>
  );
};

export default SyncDashboard;
