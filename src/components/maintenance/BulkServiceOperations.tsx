
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Download, Trash2, MoreVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ServiceRecord {
  id: string;
  vehicle_id: string;
  vehicle_type: string;
  service_date: string;
  work_completed: string;
  total_cost?: number;
  labor_hours?: number;
  mileage?: number;
  shops?: {
    shop_name: string;
  };
}

interface BulkServiceOperationsProps {
  records: ServiceRecord[];
  selectedRecords: string[];
  onSelectRecord: (recordId: string) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onDeleteSelected: (recordIds: string[]) => void;
}

const BulkServiceOperations = ({
  records,
  selectedRecords,
  onSelectRecord,
  onSelectAll,
  onClearSelection,
  onDeleteSelected
}: BulkServiceOperationsProps) => {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const selectedRecordData = records.filter(record => selectedRecords.includes(record.id));
  const allSelected = records.length > 0 && selectedRecords.length === records.length;
  const someSelected = selectedRecords.length > 0;

  const exportToCSV = async () => {
    setIsExporting(true);
    try {
      const dataToExport = selectedRecordData.length > 0 ? selectedRecordData : records;
      
      const headers = [
        'Vehicle ID',
        'Vehicle Type', 
        'Service Date',
        'Work Completed',
        'Shop Name',
        'Total Cost',
        'Labor Hours',
        'Mileage'
      ];

      const csvData = dataToExport.map(record => [
        record.vehicle_id,
        record.vehicle_type,
        record.service_date,
        record.work_completed.replace(/,/g, ';'), // Replace commas to avoid CSV issues
        record.shops?.shop_name || '',
        record.total_cost?.toString() || '',
        record.labor_hours?.toString() || '',
        record.mileage?.toString() || ''
      ]);

      const csvContent = [headers, ...csvData]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `service-history-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export successful",
        description: `Exported ${dataToExport.length} service records to CSV.`
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "There was an error exporting the data.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedRecords.length === 0) return;
    
    if (confirm(`Are you sure you want to delete ${selectedRecords.length} selected service records?`)) {
      onDeleteSelected(selectedRecords);
    }
  };

  if (records.length === 0) return null;

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
      <div className="flex items-center gap-2">
        <Checkbox
          checked={allSelected}
          onCheckedChange={allSelected ? onClearSelection : onSelectAll}
          className="h-4 w-4"
        />
        <span className="text-sm text-gray-600">
          {someSelected ? `${selectedRecords.length} selected` : "Select all"}
        </span>
      </div>

      {someSelected && (
        <div className="flex items-center gap-2 ml-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={exportToCSV}
            disabled={isExporting}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {isExporting ? "Exporting..." : "Export Selected"}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleDeleteSelected} className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected ({selectedRecords.length})
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="text-gray-500"
          >
            Clear
          </Button>
        </div>
      )}

      {!someSelected && (
        <Button
          variant="outline"
          size="sm"
          onClick={exportToCSV}
          disabled={isExporting}
          className="flex items-center gap-2 ml-auto"
        >
          <Download className="h-4 w-4" />
          {isExporting ? "Exporting..." : "Export All"}
        </Button>
      )}
    </div>
  );
};

export default BulkServiceOperations;
