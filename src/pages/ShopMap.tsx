
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Phone, Clock, Wrench } from "lucide-react";

const ShopMap = () => {
  const shops = [
    {
      id: 1,
      name: "Main Service Center",
      address: "123 Industrial Blvd, Atlanta, GA 30309",
      phone: "(404) 555-0123",
      hours: "Mon-Fri: 6AM-8PM, Sat: 8AM-4PM",
      bays: 8,
      specialties: ["Engine Repair", "Transmission", "Electrical"],
      coordinates: { lat: 33.7490, lng: -84.3880 }
    },
    {
      id: 2,
      name: "North Point Shop",
      address: "456 Highway 85, Duluth, GA 30096",
      phone: "(770) 555-0456",
      hours: "Mon-Fri: 7AM-6PM",
      bays: 4,
      specialties: ["Brake Service", "Tire Replacement", "Oil Changes"],
      coordinates: { lat: 34.0031, lng: -84.1447 }
    },
    {
      id: 3,
      name: "South Metro Facility",
      address: "789 Commerce Dr, McDonough, GA 30253",
      phone: "(678) 555-0789",
      hours: "24/7 Emergency Service",
      bays: 6,
      specialties: ["Heavy Repairs", "Frame Work", "Welding"],
      coordinates: { lat: 33.4473, lng: -84.1469 }
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Shop Locations</h1>
        <p className="text-gray-600">Find and contact our service locations</p>
      </div>

      {/* Map Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Shop Locations Map</CardTitle>
          <CardDescription>Interactive map showing all service locations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-100 rounded-lg h-96 flex items-center justify-center">
            <div className="text-center">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Map integration would be implemented here</p>
              <p className="text-sm text-gray-500">Google Maps, Mapbox, or similar service</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shop Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {shops.map((shop) => (
          <Card key={shop.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                {shop.name}
              </CardTitle>
              <CardDescription>{shop.address}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-500" />
                <span className="text-sm">{shop.phone}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-sm">{shop.hours}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-gray-500" />
                <span className="text-sm">{shop.bays} Service Bays</span>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Specialties:</p>
                <div className="flex flex-wrap gap-1">
                  {shop.specialties.map((specialty, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ShopMap;
