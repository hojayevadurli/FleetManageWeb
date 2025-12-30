
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface VehicleSyncButtonProps {
  vehicleId: string;
  motiveVehicleId: string;
  onSyncComplete?: () => void;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
}

const VehicleSyncButton = ({ 
  vehicleId, 
  motiveVehicleId, 
  onSyncComplete,
  variant = "outline",
  size = "sm"
}: VehicleSyncButtonProps) => {
  const [syncing, setSyncing] = useState(false);
  const [lastSyncStatus, setLastSyncStatus] = useState<'success' | 'error' | null>(null);

  const handleSync = async () => {
    if (!motiveVehicleId) {
      toast.error("No Motive Vehicle ID configured");
      return;
    }

    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('motive-integration', {
        body: {
          action: 'sync_vehicle_data',
          vehicleId,
          motiveVehicleId
        }
      });

      if (error) throw error;

      if (data.success) {
        toast.success("Vehicle data synced successfully");
        setLastSyncStatus('success');
      } else {
        toast.warning(data.message || "Sync completed with warnings");
        setLastSyncStatus('error');
      }

      if (onSyncComplete) {
        onSyncComplete();
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast.error("Failed to sync vehicle data");
      setLastSyncStatus('error');
    } finally {
      setSyncing(false);
    }
  };

  const getIcon = () => {
    if (syncing) return <RefreshCw className="h-4 w-4 animate-spin" />;
    if (lastSyncStatus === 'success') return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (lastSyncStatus === 'error') return <AlertCircle className="h-4 w-4 text-red-500" />;
    return <RefreshCw className="h-4 w-4" />;
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleSync}
      disabled={syncing}
      className="flex items-center gap-2"
    >
      {getIcon()}
      {syncing ? "Syncing..." : "Sync"}
    </Button>
  );
};

export default VehicleSyncButton;
