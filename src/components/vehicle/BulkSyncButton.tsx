
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Truck } from "lucide-react";
import { toast } from "sonner";
//import { supabase } from "@/integrations/supabase/client";

interface BulkSyncButtonProps {
  onSyncComplete?: () => void;
}

const BulkSyncButton = ({ onSyncComplete }: BulkSyncButtonProps) => {
  const [syncing, setSyncing] = useState(false);

  //const handleBulkSync = async () => {
  //  setSyncing(true);
  //  try {
  //    toast.info("Starting bulk sync of all vehicles...");
      
  //    const { data, error } = await supabase.functions.invoke('motive-integration', {
  //      body: {
  //        action: 'sync_all_vehicles'
  //      }
  //    });

  //    if (error) throw error;

  //    if (data.success) {
  //      const successCount = data.results?.filter((r: any) => r.success).length || 0;
  //      const totalCount = data.results?.length || 0;
        
  //      toast.success(`Bulk sync completed: ${successCount}/${totalCount} vehicles synced successfully`);
        
  //      if (successCount < totalCount) {
  //        toast.warning("Some vehicles failed to sync - check individual vehicle status");
  //      }
  //    } else {
  //      toast.error(data.message || "Bulk sync failed");
  //    }

  //    if (onSyncComplete) {
  //      onSyncComplete();
  //    }
  //  } catch (error) {
  //    console.error('Bulk sync error:', error);
  //    toast.error("Failed to perform bulk sync");
  //  } finally {
  //    setSyncing(false);
  //  }
  //};

  return (
    <Button
      //onClick={handleBulkSync}
      disabled={syncing}
      className="flex items-center gap-2"
    >
      {syncing ? (
        <RefreshCw className="h-4 w-4 animate-spin" />
      ) : (
        <Truck className="h-4 w-4" />
      )}
      {syncing ? "Syncing All..." : "Sync All Vehicles"}
    </Button>
  );
};

export default BulkSyncButton;
