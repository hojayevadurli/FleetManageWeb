
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Calendar,
  DollarSign,
  Clock,
  Truck,
  MapPin,
  Building2,
  FileText,
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
    phone?: string;
    email?: string;
  };
}

interface ServiceDetailsModalProps {
  record: ServiceRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (record: ServiceRecord) => void;
}

const ServiceDetailsModal = ({ record, open, onOpenChange, onEdit }: ServiceDetailsModalProps) => {
  if (!record) return null;

  const getRateColor = (category: string) => {
    switch (category) {
      case "green": return "bg-green-100 text-green-800";
      case "orange": return "bg-orange-100 text-orange-800";
      case "red": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Service Record Details - {record.vehicle_id}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Info */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="capitalize">
              {record.vehicle_type}
            </Badge>
            {record.shops && (
              <Badge className={getRateColor(record.shops.rate_category)}>
                ${record.shops.labor_rate}/hr
              </Badge>
            )}
          </div>

          {/* Service Details */}
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">Work Completed</h3>
              <p className="text-gray-700 whitespace-pre-line">{record.work_completed}</p>
            </div>

            {/* Service Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600">Service Date</p>
                  <p className="font-semibold">{formatDate(record.service_date)}</p>
                </div>
              </div>

              {record.total_cost && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <DollarSign className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-600">Total Cost</p>
                    <p className="font-semibold">${record.total_cost.toFixed(2)}</p>
                  </div>
                </div>
              )}

              {record.labor_hours && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Clock className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-sm text-gray-600">Labor Hours</p>
                    <p className="font-semibold">{record.labor_hours}h</p>
                  </div>
                </div>
              )}

              {record.mileage && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Truck className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="text-sm text-gray-600">Mileage</p>
                    <p className="font-semibold">{record.mileage.toLocaleString()} mi</p>
                  </div>
                </div>
              )}
            </div>

            {/* Shop Information */}
            {record.shops && (
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Shop Information</h3>
                <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="font-semibold">{record.shops.shop_name}</p>
                      <p className="text-sm text-gray-600">{record.shops.shop_id}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-gray-500" />
                    <p className="text-gray-700">{record.shops.address}</p>
                  </div>

                  {(record.shops.phone || record.shops.email) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2">
                      {record.shops.phone && (
                        <p className="text-sm text-gray-600">Phone: {record.shops.phone}</p>
                      )}
                      {record.shops.email && (
                        <p className="text-sm text-gray-600">Email: {record.shops.email}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button onClick={() => onEdit(record)} className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Edit Record
            </Button>
            {record.invoice_url && (
              <Button variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Download Invoice
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ServiceDetailsModal;
