
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Truck } from "lucide-react";
import { Link } from "react-router-dom";
//import { supabase } from "@/integrations/supabase/client";

const TrailersWidget = () => {
  const [trailerStats, setTrailerStats] = useState({
    active: 0,
    inactive: 0,
    total: 0
  });

  //useEffect(() => {
  //  const fetchTrailerStats = async () => {
  //    try {
  //      const { data, error } = await supabase
  //        .from('trailers')
  //        .select('status');

  //      if (error) {
  //        console.error('Error fetching trailer stats:', error);
  //        return;
  //      }

  //      const active = data.filter(trailer => trailer.status === 'active').length;
  //      const inactive = data.filter(trailer => trailer.status === 'inactive').length;
  //      const total = data.length;

  //      setTrailerStats({
  //        active,
  //        inactive,
  //        total
  //      });
  //    } catch (error) {
  //      console.error('Error fetching trailer stats:', error);
  //    }
  //  };

  //  fetchTrailerStats();
  //}, []);

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-green-600" />
            Trailers
          </div>
          <Badge variant="outline">{trailerStats.total}</Badge>
        </CardTitle>
        <CardDescription>Trailer fleet status</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="text-center">
            <div className="font-semibold text-green-600">{trailerStats.active}</div>
            <div className="text-gray-500">Active</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-gray-600">{trailerStats.inactive}</div>
            <div className="text-gray-500">Inactive</div>
          </div>
        </div>
        <Button asChild variant="outline" size="sm" className="w-full">
          <Link to="/trailers">Manage Trailers</Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default TrailersWidget;
