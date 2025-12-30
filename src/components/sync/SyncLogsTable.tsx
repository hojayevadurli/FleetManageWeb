
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Activity,
  Eye,
  Calendar
} from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface SyncLog {
  id: string;
  sync_type: string;
  status: string;
  started_at: string;
  completed_at?: string;
  error_message?: string;
  records_processed: number;
  records_successful: number;
  records_failed: number;
  sync_details: any;
}

interface SyncLogsTableProps {
  logs: SyncLog[];
}

const SyncLogsTable = ({ logs }: SyncLogsTableProps) => {
  const [selectedLog, setSelectedLog] = useState<SyncLog | null>(null);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatDuration = (startTime: string, endTime?: string) => {
    if (!endTime) return "In progress...";
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end.getTime() - start.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    
    if (diffSecs < 60) return `${diffSecs}s`;
    const diffMins = Math.floor(diffSecs / 60);
    return `${diffMins}m ${diffSecs % 60}s`;
  };

  const formatDateTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  if (logs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sync Logs</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8 text-gray-500">
          No sync logs available
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Detailed Sync Logs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2">Status</th>
                  <th className="text-left py-3 px-2">Type</th>
                  <th className="text-left py-3 px-2">Started</th>
                  <th className="text-left py-3 px-2">Duration</th>
                  <th className="text-left py-3 px-2">Records</th>
                  <th className="text-left py-3 px-2">Success Rate</th>
                  <th className="text-left py-3 px-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(log.status)}
                        <Badge 
                          variant={
                            log.status === 'success' ? 'default' : 
                            log.status === 'error' ? 'destructive' : 
                            'secondary'
                          }
                        >
                          {log.status}
                        </Badge>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <span className="capitalize font-medium">
                        {log.sync_type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Calendar className="h-3 w-3" />
                        {formatDateTime(log.started_at)}
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <span className="text-sm">
                        {formatDuration(log.started_at, log.completed_at)}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <span className="text-sm">
                        {log.records_processed || 0}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <span className={`text-sm font-medium ${
                        log.records_processed > 0 && log.records_successful === log.records_processed
                          ? 'text-green-600'
                          : log.records_failed > 0
                          ? 'text-red-600'
                          : 'text-gray-600'
                      }`}>
                        {log.records_processed > 0 
                          ? `${Math.round((log.records_successful / log.records_processed) * 100)}%`
                          : 'N/A'
                        }
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedLog(log)}
                        className="flex items-center gap-1"
                      >
                        <Eye className="h-3 w-3" />
                        Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Log Details Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedLog && getStatusIcon(selectedLog.status)}
              Sync Log Details
            </DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Type</label>
                  <div className="capitalize">{selectedLog.sync_type.replace('_', ' ')}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <div>
                    <Badge variant={
                      selectedLog.status === 'success' ? 'default' : 
                      selectedLog.status === 'error' ? 'destructive' : 
                      'secondary'
                    }>
                      {selectedLog.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Started At</label>
                  <div>{formatDateTime(selectedLog.started_at)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Duration</label>
                  <div>{formatDuration(selectedLog.started_at, selectedLog.completed_at)}</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Processed</label>
                  <div className="text-lg font-semibold">{selectedLog.records_processed}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Successful</label>
                  <div className="text-lg font-semibold text-green-600">{selectedLog.records_successful}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Failed</label>
                  <div className="text-lg font-semibold text-red-600">{selectedLog.records_failed}</div>
                </div>
              </div>

              {selectedLog.error_message && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Error Message</label>
                  <div className="mt-1 p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
                    {selectedLog.error_message}
                  </div>
                </div>
              )}

              {selectedLog.sync_details && Object.keys(selectedLog.sync_details).length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Additional Details</label>
                  <div className="mt-1 p-3 bg-gray-50 border rounded-md">
                    <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                      {JSON.stringify(selectedLog.sync_details, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SyncLogsTable;
