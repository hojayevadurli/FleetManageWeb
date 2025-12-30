
import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Search,
  Navigation,
  Phone,
  Star,
  Filter,
  Locate
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Shop } from "./types/ShopTypes";
import { Loader } from "@googlemaps/js-api-loader";

// Declare global google types to avoid TypeScript errors
declare global {
  interface Window {
    google: typeof google;
  }
}

const ShopMap = () => {
  const [shops, setShops] = useState<Shop[]>([]);
  const [filteredShops, setFilteredShops] = useState<Shop[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [mapLoading, setMapLoading] = useState(true);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  const GOOGLE_MAPS_API_KEY = "AIzaSyBsdzNMDKKScjkXlS08hSCN7KuQOg43tiw";

  useEffect(() => {
    loadShops();
    getUserLocation();
    initializeMap();
  }, []);

  useEffect(() => {
    filterShops();
  }, [shops, searchTerm]);

  useEffect(() => {
    if (mapInstanceRef.current && filteredShops.length > 0) {
      updateMapMarkers();
    }
  }, [filteredShops]);

  const initializeMap = async () => {
    if (!mapRef.current) return;

    try {
      const loader = new Loader({
        apiKey: GOOGLE_MAPS_API_KEY,
        version: "weekly",
        libraries: ["places"]
      });

      await loader.load();

      // Now we can safely use google.maps
      const map = new window.google.maps.Map(mapRef.current, {
        zoom: 10,
        center: { lat: 33.7490, lng: -84.3880 }, // Default to Atlanta
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });

      mapInstanceRef.current = map;
      infoWindowRef.current = new window.google.maps.InfoWindow();
      setMapLoading(false);
    } catch (error) {
      console.error('Error loading Google Maps:', error);
      setMapLoading(false);
    }
  };

  const loadShops = async () => {
    try {
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .order('shop_name');

      if (error) throw error;

      // Type cast the data to ensure rate_category is properly typed
      const typedShops = (data || []).map(shop => ({
        ...shop,
        rate_category: shop.rate_category as 'green' | 'orange' | 'red',
        hours_of_operation: shop.hours_of_operation as Record<string, string>,
        specialties: shop.specialties as string[]
      }));

      setShops(typedShops);
    } catch (error) {
      console.error('Error loading shops:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);

          // Center map on user location if map is loaded
          if (mapInstanceRef.current && window.google) {
            mapInstanceRef.current.setCenter(location);
            mapInstanceRef.current.setZoom(12);

            // Add user location marker
            new window.google.maps.Marker({
              position: location,
              map: mapInstanceRef.current,
              title: "Your Location",
              icon: {
                url: 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="%234285F4"%3E%3Ccircle cx="12" cy="12" r="8"/%3E%3Ccircle cx="12" cy="12" r="3" fill="white"/%3E%3C/svg%3E',
                scaledSize: new window.google.maps.Size(24, 24)
              }
            });
          }
        },
        (error) => {
          console.log('Error getting user location:', error);
        }
      );
    }
  };

  const updateMapMarkers = () => {
    if (!mapInstanceRef.current || !window.google) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Add new markers for filtered shops
    filteredShops.forEach(shop => {
      if (shop.latitude && shop.longitude && mapInstanceRef.current) {
        const marker = new window.google.maps.Marker({
          position: { lat: Number(shop.latitude), lng: Number(shop.longitude) },
          map: mapInstanceRef.current,
          title: shop.shop_name,
          icon: {
            url: getMarkerIcon(shop.rate_category),
            scaledSize: new window.google.maps.Size(32, 32)
          }
        });

        marker.addListener('click', () => {
          setSelectedShop(shop);
          showInfoWindow(marker, shop);
        });

        markersRef.current.push(marker);
      }
    });

    // Fit map to show all markers
    if (markersRef.current.length > 0 && window.google) {
      const bounds = new window.google.maps.LatLngBounds();
      markersRef.current.forEach(marker => {
        const position = marker.getPosition();
        if (position) bounds.extend(position);
      });

      // Include user location in bounds if available
      if (userLocation) {
        bounds.extend(userLocation);
      }

      if (mapInstanceRef.current) {
        mapInstanceRef.current.fitBounds(bounds);
      }
    }
  };

  const getMarkerIcon = (category: string) => {
    const color = category === 'green' ? '%2322c55e' :
      category === 'orange' ? '%23f97316' :
        category === 'red' ? '%23ef4444' : '%236b7280';

    return `data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="${color}"%3E%3Cpath d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/%3E%3C/svg%3E`;
  };

  const showInfoWindow = (marker: google.maps.Marker, shop: Shop) => {
    if (!infoWindowRef.current) return;

    const distance = userLocation && shop.latitude && shop.longitude
      ? calculateDistance(userLocation.lat, userLocation.lng, shop.latitude, shop.longitude)
      : null;

    const content = `
      <div style="max-width: 250px; padding: 8px;">
        <h3 style="margin: 0 0 8px 0; font-weight: bold;">${shop.shop_name}</h3>
        <p style="margin: 0 0 4px 0; font-size: 12px; color: #666;">${shop.shop_id}</p>
        <p style="margin: 0 0 8px 0; font-size: 14px;">${shop.address}</p>
        ${distance ? `<p style="margin: 0 0 4px 0; font-size: 12px; color: #666;">${distance.toFixed(1)} miles away</p>` : ''}
        <div style="display: flex; align-items: center; gap: 8px; margin: 8px 0;">
          <span style="font-weight: bold;">$${shop.labor_rate}/hr</span>
          <span style="padding: 2px 8px; border-radius: 12px; font-size: 11px; background: ${shop.rate_category === 'green' ? '#dcfce7; color: #166534' : shop.rate_category === 'orange' ? '#fed7aa; color: #9a3412' : '#fecaca; color: #991b1b'};">${shop.rate_category}</span>
        </div>
        ${shop.phone ? `<p style="margin: 4px 0; font-size: 12px;"><strong>Phone:</strong> ${shop.phone}</p>` : ''}
      </div>
    `;

    infoWindowRef.current.setContent(content);
    infoWindowRef.current.open(mapInstanceRef.current, marker);
  };

  const filterShops = () => {
    let filtered = shops;

    if (searchTerm) {
      filtered = filtered.filter(shop =>
        shop.shop_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shop.address.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredShops(filtered);
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const getRateColor = (category: string) => {
    switch (category) {
      case "green": return "bg-green-100 text-green-800";
      case "orange": return "bg-orange-100 text-orange-800";
      case "red": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
          }`}
      />
    ));
  };

  const openGoogleMaps = (shop: Shop) => {
    if (shop.latitude && shop.longitude) {
      const url = userLocation
        ? `https://www.google.com/maps/dir/${userLocation.lat},${userLocation.lng}/${shop.latitude},${shop.longitude}`
        : `https://www.google.com/maps/search/?api=1&query=${shop.latitude},${shop.longitude}`;
      window.open(url, '_blank');
    }
  };

  return (
    <div className="relative w-full h-[600px]">
      {mapLoading && (
        <div className="absolute inset-0 bg-slate-50 flex items-center justify-center z-10 font-black text-slate-300 uppercase tracking-widest text-xs">
          Loading Service Reach...
        </div>
      )}
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
};

export default ShopMap;
