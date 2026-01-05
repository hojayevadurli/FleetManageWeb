import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Truck,
  Search,
  Edit,
  Calendar,
  Wrench,
  CheckCircle,
  AlertTriangle,
  Trash2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AddTrailerDialog from "./AddTrailerDialog";
import EditTrailerDialog from "./EditTrailerDialog";
import { equipmentApi, mapDtoToEquipment } from "@/lib/equipmentApi";
import { Equipment } from "@/lib/types";

const TrailerManager = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [trailers, setTrailers] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingTrailer, setEditingTrailer] = useState<Equipment | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const { toast } = useToast();

  const fetchTrailers = async () => {
    try {
      setLoading(true);
      // Fetch specifically trailers
      const data = await equipmentApi.list("trailer");
      const mapped = data.map(mapDtoToEquipment);
      // Fallback client-side filter just in case API returns all (mapped uses internal type 'truck'/'trailer')
      const filtered = mapped.filter(e => e.type?.toLowerCase() === 'trailer');
      setTrailers(filtered);
      setSelectedIds([]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch trailers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrailers();
  }, []);

  const getStatusColor = (status?: string | null) => {
    const s = status?.toLowerCase();
    switch (s) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      case "in shop":
      case "in_shop":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getConditionIcon = (status?: string | null) => {
    const s = status?.toLowerCase();
    switch (s) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "inactive":
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const filteredTrailers = trailers.filter((trailer) => {
    const search = searchTerm.toLowerCase();

    const matchesSearch =
      trailer.unitNumber.toLowerCase().includes(search) || // changed from number
      (trailer.make ?? "").toLowerCase().includes(search) ||
      (trailer.vin ?? "").toLowerCase().includes(search);

    const s = trailer.status?.toLowerCase();
    const matchesStatus =
      statusFilter === "all" || (s ?? "") === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const handleTrailerAdded = () => {
    fetchTrailers();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this trailer?")) return;
    try {
      await equipmentApi.delete(id);
      toast({
        title: "Deleted",
        description: "Trailer removed successfully",
      });
      fetchTrailers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete trailer",
        variant: "destructive",
      });
    }
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (
      !confirm(
        `Delete ${selectedIds.length} selected trailer(s)? This cannot be undone.`
      )
    )
      return;

    try {
      await equipmentApi.bulkDelete(selectedIds);
      toast({
        title: "Deleted",
        description: "Selected trailers removed successfully",
      });
      fetchTrailers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to bulk delete trailers",
        variant: "destructive",
      });
    }
  };

  const openEdit = (trailer: Equipment) => {
    setEditingTrailer(trailer);
    setEditOpen(true);
  };

  const closeEdit = () => {
    setEditOpen(false);
    setEditingTrailer(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading trailers...</div>
      </div>
    );
  }

  const activeCount = trailers.filter(
    (t) => t.status?.toLowerCase() === "active"
  ).length;
  const inactiveCount = trailers.filter(
    (t) => t.status?.toLowerCase() === "inactive"
  ).length;

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search trailers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-3">
          {selectedIds.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              className="flex items-center gap-2"
              onClick={handleBulkDelete}
            >
              <Trash2 className="h-4 w-4" />
              Delete {selectedIds.length}
            </Button>
          )}
          <AddTrailerDialog onTrailerAdded={handleTrailerAdded} />
        </div>
      </div>

      {/* Trailer Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {activeCount}
            </div>
            <div className="text-sm text-gray-500">Active Trailers</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-600">
              {inactiveCount}
            </div>
            <div className="text-sm text-gray-500">Inactive / Other</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {trailers.length}
            </div>
            <div className="text-sm text-gray-500">Total Trailers</div>
          </CardContent>
        </Card>
      </div>

      {/* Trailer Grid */}
      {filteredTrailers.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="text-gray-500">
            {trailers.length === 0
              ? "No trailers found. Add your first trailer to get started."
              : "No trailers match your search criteria."}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTrailers.map((trailer) => {
            const purchasedLabel = trailer.purchasedAt
              ? new Date(trailer.purchasedAt).toLocaleDateString()
              : "N/A";

            const isSelected = selectedIds.includes(trailer.id);

            return (
              <Card
                key={trailer.id}
                className={`hover:shadow-lg transition-shadow ${isSelected ? "ring-2 ring-red-400" : ""
                  }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelected(trailer.id)}
                        className="mt-1"
                        aria-label={`Select trailer ${trailer.unitNumber}`}
                      />
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Truck className="h-5 w-5 text-blue-600" />
                          {trailer.unitNumber}
                        </CardTitle>
                        <CardDescription>
                          {trailer.year} {trailer.make}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className={getStatusColor(trailer.status)}>
                      {trailer.status ?? "unknown"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* VIN */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">VIN:</span>
                    <span className="font-medium text-sm truncate max-w-[160px] text-right">
                      {trailer.vin}
                    </span>
                  </div>

                  {/* Type */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Type:</span>
                    <span className="font-medium text-sm">
                      {trailer.type ?? "-"}
                      {/* You might want to show trailerType if stored separately in specs or new field */}
                    </span>
                  </div>

                  {/* Length & Capacity */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Length / Capacity:</span>
                    <span className="font-medium">
                      {trailer.length ? `${trailer.length} ft` : "-"}{" "}
                      {trailer.weightCapacity
                        ? `• ${trailer.weightCapacity} lbs`
                        : ""}
                    </span>
                  </div>

                  {/* Status with Icon */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Status:</span>
                    <div className="flex items-center gap-2">
                      {getConditionIcon(trailer.status)}
                      <span className="text-sm font-medium capitalize">
                        {trailer.status ?? "unknown"}
                      </span>
                    </div>
                  </div>

                  {/* Purchased Date */}
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <div>
                      <span className="text-sm text-gray-600">
                        Purchased:{" "}
                      </span>
                      <span className="text-sm font-medium">
                        {purchasedLabel}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openEdit(trailer)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    // hook to service screen later
                    >
                      <Wrench className="h-4 w-4 mr-2" />
                      Service
                    </Button>
                  </div>

                  {/* Single Delete */}
                  <div className="pt-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full"
                      onClick={() => handleDelete(trailer.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit dialog */}
      <EditTrailerDialog
        trailer={editingTrailer}
        open={editOpen}
        onClose={closeEdit}
        onUpdated={fetchTrailers}
      />
    </div>
  );
};

export default TrailerManager;
