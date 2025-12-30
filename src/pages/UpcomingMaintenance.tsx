
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, AlertTriangle, Plus, Filter, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthContext";
import { toast } from "sonner";
import UpcomingMaintenanceFilters from "@/components/maintenance/UpcomingMaintenanceFilters";
import UpcomingMaintenanceCalendar from "@/components/maintenance/UpcomingMaintenanceCalendar";
import UpcomingMaintenanceList from "@/components/maintenance/UpcomingMaintenanceList";

interface MaintenanceItem {
  id: string;
  work_order_number: string;
  vehicle_id: string;
  vehicle_type: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  due_date: string | null;
  estimated_hours: number | null;
  estimated_cost: number | null;
  created_at: string;
}

const UpcomingMaintenance = () => {
  const { user } = useAuth();
  const [maintenanceItems, setMaintenanceItems] = useState<MaintenanceItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MaintenanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("list");
  const [vehicleFilter, setVehicleFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [dateRangeFilter, setDateRangeFilter] = useState("30days");

  useEffect(() => {
    if (user) {
      fetchUpcomingMaintenance();
    }
  }, [user]);

  useEffect(() => {
    filterMaintenanceItems();
  }, [maintenanceItems, vehicleFilter, priorityFilter, dateRangeFilter]);

  const fetchUpcomingMaintenance = async () => {
    try {
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + 90); // Get items due in next 90 days

      const { data, error } = await supabase
        .from('work_orders')
        .select('*')
        .in('status', ['open', 'scheduled'])
        .gte('due_date', today.toISOString())
        .lte('due_date', futureDate.toISOString())
        .order('due_date', { ascending: true });

      if (error) throw error;

      const transformedData: MaintenanceItem[] = (data || []).map(item => ({
        id: item.id,
        work_order_number: item.work_order_number,
        vehicle_id: item.vehicle_id,
        vehicle_type: item.vehicle_type,
        title: item.title,
        description: item.description,
        priority: item.priority,
        status: item.status,
        due_date: item.due_date,
        estimated_hours: item.estimated_hours,
        estimated_cost: item.estimated_cost,
        created_at: item.created_at
      }));

      setMaintenanceItems(transformedData);
    } catch (error) {
      console.error('Error fetching upcoming maintenance:', error);
      toast.error('Failed to fetch upcoming maintenance');
    } finally {
      setLoading(false);
    }
  };

  const filterMaintenanceItems = () => {
    let filtered = maintenanceItems;

    if (vehicleFilter !== "all") {
      filtered = filtered.filter(item => item.vehicle_type === vehicleFilter);
    }

    if (priorityFilter !== "all") {
      filtered = filtered.filter(item => item.priority === priorityFilter);
    }

    if (dateRangeFilter !== "all") {
      const today = new Date();
      let endDate = new Date();
      
      switch (dateRangeFilter) {
        case "7days":
          endDate.setDate(today.getDate() + 7);
          break;
        case "30days":
          endDate.setDate(today.getDate() + 30);
          break;
        case "90days":
          endDate.setDate(today.getDate() + 90);
          break;
      }

      filtered = filtered.filter(item => {
        if (!item.due_date) return false;
        const dueDate = new Date(item.due_date);
        return dueDate >= today && dueDate <= endDate;
      });
    }

    setFilteredItems(filtered);
  };

  const getOverdueItems = () => {
    const today = new Date();
    return maintenanceItems.filter(item => {
      if (!item.due_date) return false;
      return new Date(item.due_date) < today;
    });
  };

  const getDueSoonItems = () => {
    const today = new Date();
    const weekFromNow = new Date();
    weekFromNow.setDate(today.getDate() + 7);
    
    return maintenanceItems.filter(item => {
      if (!item.due_date) return false;
      const dueDate = new Date(item.due_date);
      return dueDate >= today && dueDate <= weekFromNow;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const overdueItems = getOverdueItems();
  const dueSoonItems = getDueSoonItems();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Upcoming Maintenance</h1>
          <p className="text-gray-600">Schedule and track preventive maintenance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchUpcomingMaintenance} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Schedule Maintenance
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Overdue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overdueItems.length}</div>
            <p className="text-sm text-gray-600">Items past due date</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              Due Soon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{dueSoonItems.length}</div>
            <p className="text-sm text-gray-600">Due within 7 days</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Total Scheduled
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{maintenanceItems.length}</div>
            <p className="text-sm text-gray-600">Next 90 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <UpcomingMaintenanceFilters
        vehicleFilter={vehicleFilter}
        onVehicleChange={setVehicleFilter}
        priorityFilter={priorityFilter}
        onPriorityChange={setPriorityFilter}
        dateRangeFilter={dateRangeFilter}
        onDateRangeChange={setDateRangeFilter}
      />

      {/* Maintenance Views */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 bg-white border">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            List View
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Calendar View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <UpcomingMaintenanceList
            maintenanceItems={filteredItems}
            onRefresh={fetchUpcomingMaintenance}
          />
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <UpcomingMaintenanceCalendar
            maintenanceItems={filteredItems}
            onRefresh={fetchUpcomingMaintenance}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UpcomingMaintenance;
