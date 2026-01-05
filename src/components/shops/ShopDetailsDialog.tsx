
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MapPin,
  Phone,
  Mail,
  Globe,
  Clock,
  Star,
  DollarSign,
  MessageSquare,
  FileText,
  Wrench,
  X,
  Award,
  ShieldCheck,
  ExternalLink,
  Zap,
  Navigation
} from "lucide-react";
import { Shop, ShopRating } from "./types/ShopTypes";
import { shopsApi } from "@/lib/shopsApi";
import { serviceHistoryApi, ServiceRecord } from "@/lib/serviceHistoryApi";
import { useToast } from "@/hooks/use-toast";

interface ShopDetailsDialogProps {
  shop: Shop | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ShopDetailsDialog = ({ shop, open, onOpenChange }: ShopDetailsDialogProps) => {
  const [ratings, setRatings] = useState<ShopRating[]>([]);
  const [history, setHistory] = useState<ServiceRecord[]>([]);
  const [newRating, setNewRating] = useState(0);
  const [newReview, setNewReview] = useState("");
  const [loadingRatings, setLoadingRatings] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [submittingRating, setSubmittingRating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (shop?.id && open) {
      loadRatings();
      loadHistory();
    }
  }, [shop?.id, open]);

  const loadRatings = async () => {
    if (!shop?.id) return;
    setLoadingRatings(true);
    try {
      const data = await shopsApi.getRatings(shop.id);
      setRatings(data);
    } catch (error) {
      console.error('Error loading ratings:', error);
    } finally {
      setLoadingRatings(false);
    }
  };

  const loadHistory = async () => {
    if (!shop?.id) return;
    setLoadingHistory(true);
    try {
      const data = await serviceHistoryApi.getShopHistory(shop.id);
      setHistory(data);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const submitRating = async () => {
    if (!shop?.id || newRating === 0) return;
    setSubmittingRating(true);
    try {
      await shopsApi.createRating(shop.id, {
        rating: newRating,
        reviewText: newReview || undefined
      });
      toast({
        title: "Review Submitted",
        description: "Your feedback helps improve the network.",
      });
      setNewRating(0);
      setNewReview("");
      loadRatings();
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast({
        title: "Submission Failed",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setSubmittingRating(false);
    }
  };

  const renderStars = (rating: number, interactive = false, onRate?: (rating: number) => void) => {
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${i < rating ? "fill-amber-400 text-amber-400" : "text-slate-200"} ${interactive ? "cursor-pointer hover:text-amber-400 hover:fill-amber-400 transition-colors" : ""
              }`}
            onClick={() => interactive && onRate?.(i + 1)}
          />
        ))}
      </div>
    );
  };

  const getRateColor = (category: string) => {
    switch (category) {
      case "green": return "bg-emerald-50 text-emerald-600 border-emerald-100";
      case "orange": return "bg-orange-50 text-orange-600 border-orange-100";
      case "red": return "bg-rose-50 text-rose-600 border-rose-100";
      default: return "bg-slate-50 text-slate-600 border-slate-100";
    }
  };

  const openGoogleMaps = (shop: Shop) => {
    if (shop.latitude && shop.longitude) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${shop.latitude},${shop.longitude}`, '_blank');
    }
  };

  if (!shop) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl p-0 bg-slate-50 border-0 rounded-[3rem] overflow-hidden shadow-2xl h-[90vh] flex flex-col">
        {/* Header Section */}
        <div className="bg-white p-10 pb-12 border-b border-slate-100 relative overflow-hidden shrink-0 z-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -mr-20 -mt-20 opacity-60"></div>

          <div className="flex justify-between items-start relative z-10">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border flex items-center gap-2 ${getRateColor(shop.rate_category)}`}>
                  <Award className="w-3.5 h-3.5" /> {shop.rate_category} Tier Partner
                </span>
                <span className="px-4 py-1.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified Shop
                </span>
              </div>

              <div>
                <DialogTitle className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none mb-3">
                  {shop.shop_name}
                </DialogTitle>
                <div className="flex items-center gap-2 text-slate-500 font-medium text-lg">
                  <MapPin className="w-5 h-5 text-blue-500" />
                  {shop.address}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-4">
              <button
                onClick={() => onOpenChange(false)}
                className="w-10 h-10 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center transition-colors text-slate-400 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 text-center min-w-[140px]">
                <div className="text-3xl font-black text-slate-900 mb-1">4.8</div>
                <div className="flex justify-center mb-1">{renderStars(5)}</div>
                <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Google Rating</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex-1 overflow-auto custom-scrollbar">
          <div className="p-10 space-y-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Quick Info Cards */}
              <div className="p-6 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm flex items-start gap-4 hover:border-blue-200 transition-colors">
                <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Contact</p>
                  <p className="text-lg font-bold text-slate-900 leading-tight">{shop.phone || "No phone listed"}</p>
                </div>
              </div>

              <div className="p-6 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm flex items-start gap-4 hover:border-blue-200 transition-colors">
                <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Labor Rate</p>
                  <p className="text-lg font-bold text-slate-900 leading-tight">${shop.labor_rate?.toFixed(2) || "0.00"}<span className="text-sm text-slate-400 font-medium">/hr</span></p>
                </div>
              </div>

              <div className="p-6 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm flex items-start gap-4 hover:border-blue-200 transition-colors cursor-pointer group" onClick={() => openGoogleMaps(shop)}>
                <div className="p-3 bg-rose-50 rounded-2xl text-rose-500 group-hover:bg-rose-100 transition-colors">
                  <ExternalLink className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Directions</p>
                  <p className="text-lg font-bold text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">Open Maps</p>
                </div>
              </div>
            </div>

            <Tabs defaultValue="details" className="w-full">
              <TabsList className="bg-white p-1.5 rounded-[1.5rem] border border-slate-100 shadow-sm inline-flex h-auto w-full justify-start gap-2 mb-8">
                <TabsTrigger
                  value="details"
                  className="px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all hover:bg-slate-50"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="history"
                  className="px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all hover:bg-slate-50"
                >
                  Service History
                </TabsTrigger>
                <TabsTrigger
                  value="reviews"
                  className="px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all hover:bg-slate-50"
                >
                  Reviews
                </TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
                    <div>
                      <h3 className="text-lg font-black text-slate-900 flex items-center gap-3 mb-6">
                        <Clock className="w-5 h-5 text-blue-500" /> Operating Hours
                      </h3>
                      {shop.hours_of_operation ? (
                        <div className="space-y-3">
                          {Object.entries(shop.hours_of_operation).map(([day, hours]) => (
                            <div key={day} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                              <span className="text-sm font-bold text-slate-400 uppercase tracking-wide w-24">{day}</span>
                              <span className="text-sm font-black text-slate-900 bg-slate-50 px-3 py-1 rounded-lg">{hours}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-400 font-medium italic">No hours listed</p>
                      )}
                    </div>

                    {shop.website && (
                      <div className="pt-6 border-t border-slate-50">
                        <h3 className="text-lg font-black text-slate-900 flex items-center gap-3 mb-4">
                          <Globe className="w-5 h-5 text-blue-500" /> Digital Presence
                        </h3>
                        <a
                          href={shop.website}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-4 py-2 rounded-xl transition-colors"
                        >
                          Visit Website <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="space-y-8">
                    <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white overflow-hidden relative">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full blur-3xl -mr-10 -mt-10"></div>
                      <h3 className="text-lg font-black mb-6 flex items-center gap-3 relative z-10">
                        <Zap className="w-5 h-5 text-yellow-400" /> Capabilities
                      </h3>
                      {shop.specialties && shop.specialties.length > 0 ? (
                        <div className="flex flex-wrap gap-2 relative z-10">
                          {shop.specialties.map((s, i) => (
                            <span key={i} className="px-4 py-2 bg-white/10 rounded-xl text-xs font-bold border border-white/5 hover:bg-white/20 transition-colors cursor-default">
                              {s}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-400 font-medium italic relative z-10">General Repair</p>
                      )}
                    </div>

                    {shop.comment && (
                      <div className="bg-amber-50 p-8 rounded-[2.5rem] border border-amber-100">
                        <h3 className="text-lg font-black text-amber-900 flex items-center gap-3 mb-4">
                          <MessageSquare className="w-5 h-5 text-amber-500" /> Internal Notes
                        </h3>
                        <p className="text-amber-800 font-medium leading-relaxed italic">
                          "{shop.comment}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="history" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
                  {loadingHistory ? (
                    <div className="flex flex-col items-center justify-center py-20">
                      <div className="w-10 h-10 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin mb-4" />
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Loading Records...</p>
                    </div>
                  ) : history.length > 0 ? (
                    <div className="divide-y divide-slate-50">
                      {history.map((record) => (
                        <div key={record.id} className="p-8 hover:bg-slate-50 transition-colors group">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="space-y-4">
                              <div className="flex items-center gap-3">
                                <Badge variant="outline" className="rounded-lg bg-white border-slate-200 text-slate-600 font-black uppercase text-[10px] tracking-wider py-1">
                                  {record.vehicle_type}
                                </Badge>
                                <span className="font-black text-slate-900 text-lg">{record.vehicle_id}</span>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">• {new Date(record.service_date).toLocaleDateString()}</span>
                              </div>
                              <p className="text-slate-600 font-medium leading-relaxed">{record.work_completed}</p>
                            </div>

                            <div className="flex items-center gap-6 shrink-0">
                              <div className="text-right">
                                {record.total_cost && (
                                  <div className="font-black text-xl text-slate-900">${record.total_cost.toFixed(2)}</div>
                                )}
                                {record.mileage && (
                                  <div className="text-xs font-bold text-slate-400 flex items-center justify-end gap-1 mt-1">
                                    <Navigation className="w-3 h-3" /> {record.mileage.toLocaleString()} mi
                                  </div>
                                )}
                              </div>
                              {record.invoice_url && (
                                <button
                                  onClick={() => window.open(record.invoice_url, '_blank')}
                                  className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:shadow-lg hover:-translate-y-1 transition-all"
                                >
                                  <FileText className="w-5 h-5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                      <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                        <Wrench className="w-8 h-8 text-slate-300" />
                      </div>
                      <h3 className="text-xl font-black text-slate-900 mb-2">No Service History</h3>
                      <p className="text-slate-500 font-medium max-w-xs mx-auto">This shop hasn't performed any logged service work yet.</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="reviews" className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                <div className="bg-slate-900 p-10 rounded-[2.5rem] text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl -mr-20 -mt-20"></div>
                  <div className="relative z-10">
                    <h3 className="text-xl font-black mb-6 flex items-center gap-3">
                      <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" /> Rate Experience
                    </h3>
                    <div className="space-y-6">
                      <div className="flex gap-2 p-4 bg-white/5 rounded-2xl w-fit backdrop-blur-sm border border-white/10">
                        {renderStars(newRating, true, setNewRating)}
                      </div>
                      <textarea
                        placeholder="Share your experience with this vendor..."
                        value={newReview}
                        onChange={(e) => setNewReview(e.target.value)}
                        className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-6 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none font-medium text-sm"
                      />
                      <button
                        onClick={submitRating}
                        disabled={newRating === 0 || submittingRating}
                        className="bg-white text-slate-900 px-8 py-4 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                      >
                        {submittingRating ? "Posting..." : "Submit Feedback"}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {loadingRatings ? (
                    <div className="text-center py-10 text-xs font-black text-slate-400 uppercase tracking-widest">Loading reviews...</div>
                  ) : ratings.length > 0 ? (
                    ratings.map((rating) => (
                      <div key={rating.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex gap-1">
                            {renderStars(rating.rating)}
                          </div>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            {rating.created_at ? new Date(rating.created_at).toLocaleDateString() : 'Recent'}
                          </span>
                        </div>
                        {rating.review_text && (
                          <p className="text-slate-600 font-medium leading-relaxed italic">"{rating.review_text}"</p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 bg-slate-50 rounded-[2.5rem] border border-slate-100 border-dashed">
                      <p className="text-slate-400 font-bold">No reviews yet. Be the first!</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShopDetailsDialog;
