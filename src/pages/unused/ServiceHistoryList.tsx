
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { WorkOrder } from "@/lib/types";
import {
  Wrench,
  Calendar,
  DollarSign,
  FileText,
  Clock,
  Truck,
  MapPin,
  Building2,
  Download,
  Edit
} from "lucide-react";
interface ServiceHistoryListProps {
  serviceRecords: WorkOrder[];
  onViewDetails: (record: WorkOrder) => void;
  onEditRecord: (record: WorkOrder) => void;
  selectedRecords?: string[];
  onSelectRecord?: (recordId: string) => void;
  showBulkSelect?: boolean;
}

const ServiceHistoryList = ({
  serviceRecords,
  onViewDetails,
  onEditRecord,
  selectedRecords = [],
  onSelectRecord,
  showBulkSelect = false
}: ServiceHistoryListProps) => {
  const getRateColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed": return "bg-green-100 text-green-800";
      case "pending": return "bg-orange-100 text-orange-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (serviceRecords.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Service Records Found</h3>
            <p className="text-gray-600">No service history matches your current filters.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {serviceRecords.map((record) => (
        <Card key={record.id} className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start gap-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                {showBulkSelect && onSelectRecord && (
                  <Checkbox
                    checked={selectedRecords.includes(record.id)}
                    onCheckedChange={() => onSelectRecord(record.id)}
                    className="mt-1"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg flex items-center gap-2 flex-wrap">
                    <Wrench className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <span className="truncate">{record.woNumber} - {record.title || 'Service Record'}</span>
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(record.date || new Date()).toLocaleDateString()}
                    <span className="text-gray-300">•</span>
                    <Clock className="h-4 w-4" />
                    {new Date(record.date || new Date()).toLocaleTimeString()}
                  </CardDescription>
                </div>
              </div>
              <Badge className={getRateColor(record.status as string)} variant="secondary">
                {record.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Service Info */}
              <div className="space-y-3">
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <FileText className="h-4 w-4 mt-0.5 text-gray-400" />
                  <div>
                    <span className="font-medium text-gray-900 block">Work Description</span>
                    <span className="line-clamp-2">{record.description || "No description provided"}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Truck className="h-4 w-4 text-gray-400" />
                  <span className="font-medium text-gray-900">Vehicle:</span>
                  <span>{record.equipmentId || "N/A"}</span>
                </div>
                {record.odometer && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Truck className="h-4 w-4 text-gray-400" />
                    <span className="font-medium text-gray-900">Odometer:</span>
                    <span>{record.odometer.toLocaleString()} mi</span>
                  </div>
                )}
              </div>

              {/* Shop Info */}
              <div className="space-y-3">
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <Building2 className="h-4 w-4 mt-0.5 text-gray-400" />
                  <div>
                    <span className="font-medium text-gray-900 block">Service Provider</span>
                    <span>{record.vendor}</span>
                  </div>
                </div>
              </div>

              {/* Cost Info */}
              <div className="flex flex-col justify-between h-full space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  <span className="font-medium text-gray-900">Total Cost:</span>
                  <span className="text-lg font-bold text-gray-900">
                    ${(record.totalCost || 0).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Button variant="outline" size="sm" className="w-full flex-1" onClick={() => onViewDetails(record)}>
                    <FileText className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onEditRecord(record)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ServiceHistoryList;
