
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Clock, 
  Star, 
  Calendar,
  DollarSign,
  Navigation,
  MessageSquare
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Shop, ShopRating } from "./types/ShopTypes";

interface ShopDetailsDialogProps {
  shop: Shop | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ShopDetailsDialog = ({ shop, open, onOpenChange }: ShopDetailsDialogProps) => {
  const [ratings, setRatings] = useState<ShopRating[]>([]);
  const [newRating, setNewRating] = useState(0);
  const [newReview, setNewReview] = useState("");
  const [loadingRatings, setLoadingRatings] = useState(false);
  const [submittingRating, setSubmittingRating] = useState(false);

  useEffect(() => {
    if (shop?.id && open) {
      loadRatings();
    }
  }, [shop?.id, open]);

  const loadRatings = async () => {
    if (!shop?.id) return;
    
    setLoadingRatings(true);
    try {
      const { data, error } = await supabase
        .from('shop_ratings')
        .select('*')
        .eq('shop_id', shop.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRatings(data || []);
    } catch (error) {
      console.error('Error loading ratings:', error);
    } finally {
      setLoadingRatings(false);
    }
  };

  const submitRating = async () => {
    if (!shop?.id || newRating === 0) return;

    setSubmittingRating(true);
    try {
      const { error } = await supabase
        .from('shop_ratings')
        .insert({
          shop_id: shop.id,
          rating: newRating,
          review_text: newReview || null
        });

      if (error) throw error;
      
      setNewRating(0);
      setNewReview("");
      loadRatings();
    } catch (error) {
      console.error('Error submitting rating:', error);
    } finally {
      setSubmittingRating(false);
    }
  };

  const renderStars = (rating: number, interactive = false, onRate?: (rating: number) => void) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-5 w-5 ${
          i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
        } ${interactive ? "cursor-pointer hover:text-yellow-400" : ""}`}
        onClick={() => interactive && onRate?.(i + 1)}
      />
    ));
  };

  const getRateColor = (category: string) => {
    switch (category) {
      case "green": return "bg-green-100 text-green-800";
      case "orange": return "bg-orange-100 text-orange-800";
      case "red": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (!shop) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{shop.shop_name}</h2>
              <p className="text-gray-600 font-normal">{shop.shop_id}</p>
            </div>
            <Badge className={getRateColor(shop.rate_category)}>
              {shop.rate_category} rate
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column - Shop Details */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Contact Information</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">{shop.address}</p>
                    {shop.latitude && shop.longitude && (
                      <Button
                        variant="link"
                        size="sm"
                        className="p-0 h-auto text-blue-600"
                        onClick={() => {
                          const url = `https://www.google.com/maps/dir/?api=1&destination=${shop.latitude},${shop.longitude}`;
                          window.open(url, '_blank');
                        }}
                      >
                        <Navigation className="h-4 w-4 mr-1" />
                        Get Directions
                      </Button>
                    )}
                  </div>
                </div>

                {shop.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-gray-500" />
                    <a href={`tel:${shop.phone}`} className="text-blue-600 hover:underline">
                      {shop.phone}
                    </a>
                  </div>
                )}

                {shop.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-gray-500" />
                    <a href={`mailto:${shop.email}`} className="text-blue-600 hover:underline">
                      {shop.email}
                    </a>
                  </div>
                )}

                {shop.website && (
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-gray-500" />
                    <a href={shop.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {shop.website}
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Pricing & Details</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-gray-500" />
                  <span className="text-lg font-semibold">${shop.labor_rate}/hour</span>
                </div>
                
                {shop.contact_name && (
                  <div>
                    <span className="text-sm text-gray-600">Contact: </span>
                    <span className="font-medium">{shop.contact_name}</span>
                  </div>
                )}

                {shop.comment && (
                  <div>
                    <span className="text-sm text-gray-600">Notes: </span>
                    <p className="text-sm mt-1">{shop.comment}</p>
                  </div>
                )}
              </div>
            </div>

            {shop.specialties && shop.specialties.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Specialties</h3>
                <div className="flex flex-wrap gap-2">
                  {shop.specialties.map((specialty, index) => (
                    <Badge key={index} variant="outline">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Ratings & Reviews */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Rating & Reviews</h3>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  {renderStars(Math.round(shop.average_rating || 0))}
                  <span className="text-2xl font-bold">{shop.average_rating?.toFixed(1) || "0.0"}</span>
                </div>
                <span className="text-gray-600">({shop.total_reviews || 0} reviews)</span>
              </div>

              {/* Add Rating Form */}
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h4 className="font-medium mb-3">Rate this shop</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Your rating:</span>
                    <div className="flex gap-1">
                      {renderStars(newRating, true, setNewRating)}
                    </div>
                  </div>
                  <Textarea
                    placeholder="Write a review (optional)"
                    value={newReview}
                    onChange={(e) => setNewReview(e.target.value)}
                    rows={3}
                  />
                  <Button
                    onClick={submitRating}
                    disabled={newRating === 0 || submittingRating}
                    size="sm"
                    className="w-full"
                  >
                    {submittingRating ? "Submitting..." : "Submit Rating"}
                  </Button>
                </div>
              </div>

              {/* Reviews List */}
              <div className="space-y-4 max-h-64 overflow-y-auto">
                {loadingRatings ? (
                  <p className="text-gray-500">Loading reviews...</p>
                ) : ratings.length > 0 ? (
                  ratings.map((rating) => (
                    <div key={rating.id} className="border-b pb-3 last:border-b-0">
                      <div className="flex items-center gap-2 mb-2">
                        {renderStars(rating.rating)}
                        <span className="text-sm text-gray-500">
                          {new Date(rating.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {rating.review_text && (
                        <p className="text-sm text-gray-700">{rating.review_text}</p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No reviews yet. Be the first to review!</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShopDetailsDialog;
