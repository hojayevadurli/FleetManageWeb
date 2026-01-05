
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
// import { supabase } from "@/integrations/supabase/client"; // Removed - using backend API

interface MotiveConnectionTestProps {
  motiveConnected: boolean;
  setMotiveConnected: (connected: boolean) => void;
}

const MotiveConnectionTest = ({ motiveConnected, setMotiveConnected }: MotiveConnectionTestProps) => {
  const [testing, setTesting] = useState(false);

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      toast.info("Testing Motive connection...");
      
      const { data, error } = await supabase.functions.invoke('motive-integration', {
        body: {
          action: 'test_connection'
        }
      });

      if (error) throw error;

      if (data.success) {
        setMotiveConnected(true);
        toast.success(`Motive connection successful! Found ${data.vehicleCount} vehicles.`);
      } else {
        setMotiveConnected(false);
        toast.error(`Connection failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Connection test error:', error);
      setMotiveConnected(false);
      toast.error("Failed to test Motive connection");
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="flex items-center justify-between pt-2">
      <div className="flex items-center gap-2">
        {motiveConnected ? (
          <CheckCircle className="h-4 w-4 text-green-600" />
        ) : (
          <XCircle className="h-4 w-4 text-gray-400" />
        )}
        <span className="text-sm">
          {motiveConnected ? "Connected" : "Not connected"}
        </span>
      </div>
      <Button 
        type="button" 
        variant="outline" 
        size="sm"
        onClick={handleTestConnection}
        disabled={testing}
        className="flex items-center gap-2"
      >
        {testing ? (
          <RefreshCw className="h-4 w-4 animate-spin" />
        ) : (
          <CheckCircle className="h-4 w-4" />
        )}
        {testing ? "Testing..." : "Test Connection"}
      </Button>
    </div>
  );
};

export default MotiveConnectionTest;
