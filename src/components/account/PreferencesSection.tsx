
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PreferencesSectionProps {
  timeZone: string;
  setTimeZone: (value: string) => void;
  unitSystem: string;
  setUnitSystem: (value: string) => void;
}

const PreferencesSection = ({
  timeZone,
  setTimeZone,
  unitSystem,
  setUnitSystem,
}: PreferencesSectionProps) => {
  const timeZones = [
    { value: "America/New_York", label: "Eastern Time (UTC-5)" },
    { value: "America/Chicago", label: "Central Time (UTC-6)" },
    { value: "America/Denver", label: "Mountain Time (UTC-7)" },
    { value: "America/Los_Angeles", label: "Pacific Time (UTC-8)" },
    { value: "UTC", label: "UTC" },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Preferences</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="timezone">Time Zone</Label>
          <Select value={timeZone} onValueChange={setTimeZone}>
            <SelectTrigger>
              <SelectValue placeholder="Select time zone" />
            </SelectTrigger>
            <SelectContent>
              {timeZones.map((tz) => (
                <SelectItem key={tz.value} value={tz.value}>
                  {tz.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="units">Unit System</Label>
          <Select value={unitSystem} onValueChange={setUnitSystem}>
            <SelectTrigger>
              <SelectValue placeholder="Select unit system" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="imperial">Imperial (mph, miles, °F)</SelectItem>
              <SelectItem value="metric">Metric (km/h, km, °C)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default PreferencesSection;
