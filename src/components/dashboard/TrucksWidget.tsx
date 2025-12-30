
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Truck } from "lucide-react";
import { Link } from "react-router-dom";
//import { supabase } from "@/integrations/supabase/client";

const TrucksWidget = () => {
//  const [truckStats, setTruckStats] = useState({
//    active: 0,
//    inactive: 0,
//    total: 0
//  });

//  useEffect(() => {
//    const fetchTruckStats = async () => {
//      try {
//        const { data, error } = await supabase
//          .from('vehicles')
//          .select('status');

//        if (error) {
//          console.error('Error fetching truck stats:', error);
//          return;
//        }

//        const active = data.filter(vehicle => vehicle.status === 'active').length;
//        const inactive = data.filter(vehicle => vehicle.status === 'inactive').length;
//        const total = data.length;

//        setTruckStats({
//          active,
//          inactive,
//          total
//        });
//      } catch (error) {
//        console.error('Error fetching truck stats:', error);
//      }
//    };

//    fetchTruckStats();
//  }, []);

//  return (
//    <Card className="hover:shadow-lg transition-shadow">
//      <CardHeader className="pb-3">
//        <CardTitle className="flex items-center justify-between">
//          <div className="flex items-center gap-2">
//            <Truck className="h-5 w-5 text-blue-600" />
//            Trucks
//          </div>
//          <Badge variant="outline">{truckStats.total}</Badge>
//        </CardTitle>
//        <CardDescription>Fleet truck management</CardDescription>
//      </CardHeader>
//      <CardContent className="space-y-3">
//        <div className="grid grid-cols-2 gap-2 text-sm">
//          <div className="text-center">
//            <div className="font-semibold text-green-600">{truckStats.active}</div>
//            <div className="text-gray-500">Active</div>
//          </div>
//          <div className="text-center">
//            <div className="font-semibold text-gray-600">{truckStats.inactive}</div>
//            <div className="text-gray-500">Inactive</div>
//          </div>
//        </div>
//        <Button asChild variant="outline" size="sm" className="w-full">
//          <Link to="/trucks">Manage Trucks</Link>
//        </Button>
//      </CardContent>
//    </Card>
//  );
};

export default TrucksWidget;
