
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Settings } from "lucide-react";

interface PreferencesSectionProps {
  timeZone: string;
  setTimeZone: (value: string) => void;
}

const PreferencesSection = ({
  timeZone,
  setTimeZone,
}: PreferencesSectionProps) => {
  const timeZones = [
    { value: "America/New_York", label: "Eastern Time (UTC-5)" },
    { value: "America/Chicago", label: "Central Time (UTC-6)" },
    { value: "America/Denver", label: "Mountain Time (UTC-7)" },
    { value: "America/Los_Angeles", label: "Pacific Time (UTC-8)" },
  ];

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden w-full">
      <div className="p-6 border-b border-slate-100">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
          <Settings className="w-5 h-5 text-slate-400" />
          Preferences
        </h2>
        <p className="text-sm font-medium text-slate-500 mt-2 ml-9">
          Customize your experience
        </p>
      </div>

      <div className="p-6 space-y-8">
        <div className="space-y-3 max-w-md">
          <Label htmlFor="timezone" className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Time Zone</Label>
          <Select value={timeZone} onValueChange={setTimeZone}>
            <SelectTrigger className="w-full px-6 py-6 rounded-2xl border-slate-200 font-bold text-slate-900 focus:ring-blue-500/10 transition-all">
              <SelectValue placeholder="Select time zone" />
            </SelectTrigger>
            <SelectContent>
              {timeZones.map((tz) => (
                <SelectItem key={tz.value} value={tz.value} className="font-medium">
                  {tz.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h3 className="font-bold text-slate-900">Email Notifications</h3>
          <div className="space-y-4">
            {[
              { label: "Billing & payment updates", defaultChecked: true },
              { label: "Maintenance alerts", defaultChecked: true },
              { label: "Service order updates", defaultChecked: true }
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between group">
                <span className="text-sm font-bold text-slate-700">{item.label}</span>
                <Switch defaultChecked={item.defaultChecked} />
              </div>
            ))}
            {[
              { label: "Weekly summary report", defaultChecked: false },
              { label: "Marketing emails", defaultChecked: false }
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between group opacity-80 hover:opacity-100 transition-opacity">
                <span className="text-sm font-bold text-slate-500">{item.label}</span>
                <Switch defaultChecked={item.defaultChecked} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreferencesSection;
