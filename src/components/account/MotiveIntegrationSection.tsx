
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Truck } from "lucide-react";
import MotiveConnectionTest from "./MotiveConnectionTest";

interface MotiveIntegrationSectionProps {
  motiveEnabled: boolean;
  setMotiveEnabled: (value: boolean) => void;
  motiveApiKey: string;
  setMotiveApiKey: (value: string) => void;
  motiveBaseUrl: string;
  setMotiveBaseUrl: (value: string) => void;
  motiveConnected: boolean;
  setMotiveConnected: (value: boolean) => void;
}

const MotiveIntegrationSection = ({
  motiveEnabled,
  setMotiveEnabled,
  motiveApiKey,
  setMotiveApiKey,
  motiveBaseUrl,
  setMotiveBaseUrl,
  motiveConnected,
  setMotiveConnected,
}: MotiveIntegrationSectionProps) => {
  const handleSaveMotiveSettings = () => {
    console.log("Saving Motive settings:", {
      enabled: motiveEnabled,
      baseUrl: motiveBaseUrl,
      apiKey: "***"
    });
    toast.success("Motive integration settings saved!");
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium flex items-center gap-2">
        <Truck className="h-5 w-5" />
        Motive Integration
      </h3>
      <div className="p-4 border rounded-lg space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Enable Motive Integration</p>
            <p className="text-sm text-gray-600">Connect your Motive fleet management system</p>
          </div>
          <Switch
            checked={motiveEnabled}
            onCheckedChange={setMotiveEnabled}
          />
        </div>

        {motiveEnabled && (
          <div className="space-y-4 pt-4 border-t">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="motiveApiKey">API Key</Label>
                <Input
                  id="motiveApiKey"
                  type="password"
                  placeholder="Enter your Motive API key"
                  value={motiveApiKey}
                  onChange={(e) => setMotiveApiKey(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="motiveBaseUrl">Base URL</Label>
                <Input
                  id="motiveBaseUrl"
                  value={motiveBaseUrl}
                  onChange={(e) => setMotiveBaseUrl(e.target.value)}
                />
              </div>
            </div>

            <MotiveConnectionTest 
              motiveConnected={motiveConnected}
              setMotiveConnected={setMotiveConnected}
            />

            <div className="pt-2">
              <Button 
                type="button" 
                size="sm"
                onClick={handleSaveMotiveSettings}
              >
                Save Settings
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MotiveIntegrationSection;
