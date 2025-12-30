
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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

interface ServiceRecord {
  id: string;
  vehicle_id: string;
  vehicle_type: 'truck' | 'trailer';
  service_date: string;
  work_completed: string;
  labor_hours?: number;
  total_cost?: number;
  mileage?: number;
  invoice_url?: string;
  shops?: {
    shop_name: string;
    address: string;
    shop_id: string;
    labor_rate: number;
    rate_category: string;
  };
}

interface ServiceHistoryListProps {
  serviceRecords: ServiceRecord[];
  onViewDetails: (record: ServiceRecord) => void;
  onEditRecord: (record: ServiceRecord) => void;
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
  const getRateColor = (category: string) => {
    switch (category) {
      case "green": return "bg-green-100 text-green-800";
      case "orange": return "bg-orange-100 text-orange-800";
      case "red": return "bg-red-100 text-red-800";
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
                    <span className="truncate">{record.vehicle_id} - Service Record</span>
                  </CardTitle>
                  <CardDescription className="mt-1 line-clamp-2">
                    {record.work_completed}
                  </CardDescription>
                </div>
              </div>
              <div className="flex gap-2 items-center flex-wrap">
                <Badge variant="outline" className="capitalize whitespace-nowrap">
                  {record.vehicle_type}
                </Badge>
                {record.shops && (
                  <Badge className={`${getRateColor(record.shops.rate_category)} whitespace-nowrap`}>
                    ${record.shops.labor_rate}/hr
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Mobile-optimized grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm text-gray-600">Service Date</p>
                  <p className="font-semibold truncate">{formatDate(record.service_date)}</p>
                </div>
              </div>
              
              {record.shops && (
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm text-gray-600">Shop</p>
                    <p className="font-semibold truncate">{record.shops.shop_name}</p>
                    <p className="text-xs text-gray-500 truncate">{record.shops.shop_id}</p>
                  </div>
                </div>
              )}

              {record.total_cost && (
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-600">Total Cost</p>
                    <p className="font-semibold">${record.total_cost.toFixed(2)}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Secondary info - mobile responsive */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {record.labor_hours && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-600">Labor Hours</p>
                    <p className="font-semibold">{record.labor_hours}h</p>
                  </div>
                </div>
              )}

              {record.mileage && (
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-600">Mileage</p>
                    <p className="font-semibold">{record.mileage.toLocaleString()} mi</p>
                  </div>
                </div>
              )}

              {record.shops && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm text-gray-600">Location</p>
                    <p className="font-semibold text-sm truncate">{record.shops.address}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Actions - mobile responsive */}
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onViewDetails(record)}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">View Details</span>
                <span className="sm:hidden">Details</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onEditRecord(record)}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                <span className="hidden sm:inline">Edit</span>
              </Button>
              {record.invoice_url && (
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Download Invoice</span>
                  <span className="sm:hidden">Invoice</span>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ServiceHistoryList;
