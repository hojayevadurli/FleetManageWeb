
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

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

interface UpcomingMaintenanceCalendarProps {
  maintenanceItems: MaintenanceItem[];
  onRefresh: () => void;
}

const UpcomingMaintenanceCalendar = ({ maintenanceItems }: UpcomingMaintenanceCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-500";
      case "high": return "bg-orange-500";
      case "medium": return "bg-yellow-500";
      case "low": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  const getMonthDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getItemsForDate = (date: Date) => {
    return maintenanceItems.filter(item => {
      if (!item.due_date) return false;
      const itemDate = new Date(item.due_date);
      return itemDate.toDateString() === date.toDateString();
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const monthDays = getMonthDays(currentDate);
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {monthName}
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1">
          {/* Day headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-3 text-center text-sm font-medium text-gray-500 border-b">
              {day}
            </div>
          ))}
          
          {/* Calendar days */}
          {monthDays.map((day, index) => {
            if (!day) {
              return <div key={index} className="p-3 min-h-[100px]" />;
            }
            
            const itemsForDay = getItemsForDate(day);
            const isToday = day.toDateString() === new Date().toDateString();
            const isPast = day < new Date() && !isToday;
            
            return (
              <div
                key={index}
                className={`p-2 min-h-[100px] border border-gray-200 ${
                  isToday ? 'bg-blue-50 border-blue-300' : isPast ? 'bg-gray-50' : 'bg-white'
                }`}
              >
                <div className={`text-sm font-medium mb-2 ${
                  isToday ? 'text-blue-600' : isPast ? 'text-gray-400' : 'text-gray-900'
                }`}>
                  {day.getDate()}
                </div>
                
                <div className="space-y-1">
                  {itemsForDay.slice(0, 3).map(item => (
                    <div
                      key={item.id}
                      className={`text-xs p-1 rounded text-white truncate ${getPriorityColor(item.priority)}`}
                      title={`${item.vehicle_id} - ${item.title}`}
                    >
                      {item.vehicle_id}
                    </div>
                  ))}
                  {itemsForDay.length > 3 && (
                    <div className="text-xs text-gray-500">
                      +{itemsForDay.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Legend */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Priority Legend</h4>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span className="text-xs text-gray-600">Urgent</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded"></div>
              <span className="text-xs text-gray-600">High</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
              <span className="text-xs text-gray-600">Medium</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-xs text-gray-600">Low</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UpcomingMaintenanceCalendar;
