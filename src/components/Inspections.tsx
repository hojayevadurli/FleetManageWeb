
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  FileCheck,
  User,
  Wrench,
  Calendar,
  Eye,
  Plus,
  FileText,
  Download
} from "lucide-react";
import NewInspectionDialog from "./NewInspectionDialog";
import InspectionTemplateDialog from "./inspections/InspectionTemplateDialog";
import { useInspections } from "@/hooks/useInspections";
import { format } from "date-fns";

const Inspections = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("create");
  const { templates, inspections, templatesLoading, inspectionsLoading, createDefaultTemplates } = useInspections();

  // Set active tab based on URL parameter
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'create' || tab === 'inspections' || tab === 'templates') {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pass": return "bg-green-100 text-green-800";
      case "pass_with_issues": return "bg-yellow-100 text-yellow-800";
      case "fail": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pass": return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "pass_with_issues": return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "fail": return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <CheckCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Vehicle Inspections</h2>
          <p className="text-gray-600">Create and manage vehicle inspection records</p>
        </div>
      </div>

      {/* Inspection Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 bg-white border">
          <TabsTrigger value="create" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create New Inspection
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Templates ({templates.length})
          </TabsTrigger>
          <TabsTrigger value="inspections" className="flex items-center gap-2">
            <FileCheck className="h-4 w-4" />
            History ({inspections.length})
          </TabsTrigger>
        </TabsList>

        {/* Create Inspection Tab */}
        <TabsContent value="create" className="space-y-4">
          <Card className="p-8">
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Plus className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Create New Inspection</h3>
                <p className="text-gray-600">Start a new vehicle inspection with photos and videos</p>
              </div>
              <NewInspectionDialog />
            </div>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Inspection Templates</h3>
            <div className="flex gap-2">
              {templates.length === 0 && (
                <Button 
                  variant="outline" 
                  onClick={createDefaultTemplates}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Load Default Templates
                </Button>
              )}
              <InspectionTemplateDialog />
            </div>
          </div>
          
          {templatesLoading ? (
            <Card className="p-8 text-center">
              <div className="text-gray-500">Loading templates...</div>
            </Card>
          ) : templates.length === 0 ? (
            <Card className="p-8 text-center space-y-4">
              <div className="text-gray-500">
                No templates found. Load default templates or create your first custom template.
              </div>
              <div className="flex justify-center gap-2">
                <Button onClick={createDefaultTemplates} className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Load Default Templates
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid gap-4">
              {templates.map((template) => (
                <Card key={template.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <FileText className="h-5 w-5 text-blue-600" />
                          {template.name}
                        </CardTitle>
                        <CardDescription>{template.description}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={template.is_pti ? "default" : "secondary"}>
                          {template.is_pti ? "PTI" : "Custom"}
                        </Badge>
                        <Badge variant="outline">{template.vehicle_type}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Categories</p>
                        <p className="font-semibold">{template.fields?.length || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Vehicle Type</p>
                        <p className="font-semibold capitalize">{template.vehicle_type}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      <Button variant="outline" size="sm">Edit</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Inspections History Tab */}
        <TabsContent value="inspections" className="space-y-4">
          {inspectionsLoading ? (
            <Card className="p-8 text-center">
              <div className="text-gray-500">Loading inspections...</div>
            </Card>
          ) : inspections.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="text-gray-500">
                No inspections found. Create your first inspection to get started.
              </div>
            </Card>
          ) : (
            inspections.map((inspection) => (
              <Card key={inspection.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Wrench className="h-5 w-5 text-blue-600" />
                        {inspection.inspection_name}
                      </CardTitle>
                      <CardDescription>
                        Vehicle: {inspection.vehicle_id} - {inspection.vehicle_type}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {inspection.overall_result && getStatusIcon(inspection.overall_result)}
                      <Badge className={inspection.overall_result ? getStatusColor(inspection.overall_result) : getStatusColor(inspection.status)}>
                        {inspection.overall_result || inspection.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-600">Inspection Date</p>
                        <p className="font-semibold">
                          {format(new Date(inspection.inspection_date), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <p className="font-semibold capitalize">{inspection.status.replace('_', ' ')}</p>
                    </div>
                  </div>

                  {inspection.notes && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-2">Notes:</p>
                      <p className="text-sm bg-gray-50 p-3 rounded">{inspection.notes}</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View Full Report
                    </Button>
                    <Button variant="outline" size="sm">Download PDF</Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Inspections;
