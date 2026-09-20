import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { truckOwnersApi, TruckOwner } from "@/lib/truckOwnersApi";
import { Plus, Loader2 } from "lucide-react";

interface Props {
  value: string;
  onChange: (id: string) => void;
}

const TruckOwnerPicker = ({ value, onChange }: Props) => {
  const { toast } = useToast();
  const [owners, setOwners] = useState<TruckOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [mcNumber, setMcNumber] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const list = await truckOwnersApi.list({ activeOnly: true });
      setOwners(list);
    } catch {
      toast({ title: "Failed to load vendors", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!companyName.trim()) {
      toast({ title: "Vendor name is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const owner = await truckOwnersApi.create({
        companyName: companyName.trim(),
        mcNumber: mcNumber.trim() || undefined,
        isActive: true,
      });
      setOwners(prev => [...prev, owner].sort((a, b) => a.companyName.localeCompare(b.companyName)));
      onChange(owner.id);
      setShowCreate(false);
      setCompanyName("");
      setMcNumber("");
      toast({ title: "Vendor added", description: owner.companyName });
    } catch (err: any) {
      toast({ title: "Failed to add vendor", description: err?.response?.data?.error, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="flex gap-2">
        <Select value={value} onValueChange={(v) => v === "__new__" ? setShowCreate(true) : onChange(v)}>
          <SelectTrigger className="h-10 bg-white border-slate-200">
            <SelectValue placeholder={loading ? "Loading..." : "Select vendor..."} />
          </SelectTrigger>
          <SelectContent>
            {owners.map(o => (
              <SelectItem key={o.id} value={o.id}>
                {o.companyName}{o.mcNumber ? ` · MC ${o.mcNumber}` : ""}
              </SelectItem>
            ))}
            <SelectItem value="__new__">
              <span className="flex items-center gap-1.5 text-blue-600 font-bold">
                <Plus className="w-3.5 h-3.5" /> Add new vendor...
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="font-black">Add Vendor (Truck Owner)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-1">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Company Name *</Label>
              <Input
                className="h-10 bg-white border-slate-200"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                placeholder="e.g. Vernum Veris Inc #120"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">MC Number</Label>
              <Input
                className="h-10 bg-white border-slate-200"
                value={mcNumber}
                onChange={e => setMcNumber(e.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>
          <DialogFooter className="mt-4 gap-2">
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving} className="bg-blue-600 text-white hover:bg-blue-700 font-bold">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Vendor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TruckOwnerPicker;
