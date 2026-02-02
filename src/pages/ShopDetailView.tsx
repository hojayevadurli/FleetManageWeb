import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import {
    ArrowLeft,
    Phone,
    MapPin,
    Star,
    Sparkles,
    Trash2,
    Edit,
    MessageSquare,
    Navigation,
    Share2,
    DollarSign,
    ShieldCheck,
    Wrench,
    LayoutDashboard,
    ExternalLink,
    User,
    Trophy,
    Handshake,
    Ban
} from 'lucide-react';
import { shopsApi } from '@/lib/shopsApi';
import { Shop, ShopRating, VENDOR_PREFERENCE_CONFIG, VendorPreference } from '@/components/shops/types/ShopTypes';
import { useToast } from '@/hooks/use-toast';
import AddShopDialog from '@/components/shops/AddShopDialog';
import WriteReviewDialog from '@/components/shops/WriteReviewDialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { workOrdersApi } from "@/lib/workOrdersApi";
import { WorkOrderDto } from "@/lib/types";
import { Calendar, Receipt, FileText } from "lucide-react";
import LocationPreview from "@/components/shops/LocationPreview";


interface ShopServicesListProps {
    workOrders: WorkOrderDto[];
    loading: boolean;
    ratingsMap: Record<string, number>;
}

const getTierIcon = (preference: VendorPreference) => {
    switch (preference) {
        case 'PREFERRED': return <Trophy className="w-4 h-4" />;
        case 'PARTNER': return <Handshake className="w-4 h-4" />;
        case 'NEW': return <Sparkles className="w-4 h-4" />;
        case 'RESTRICTED': return <Ban className="w-4 h-4" />;
        default: return <ShieldCheck className="w-4 h-4" />;
    }
};

const ShopServicesList = ({ workOrders, loading, ratingsMap }: ShopServicesListProps) => {
    const navigate = useNavigate();

    if (loading) {
        return <div className="p-8 text-center text-slate-400 animate-pulse">Loading service history...</div>;
    }

    if (workOrders.length === 0) {
        return (
            <div className="p-12 bg-slate-50 border border-dashed border-slate-200 rounded-[2rem] text-center">
                <p className="text-slate-500 font-medium text-base">No service history yet.</p>
                <p className="text-xs text-slate-400 mt-1">Work orders assigned to this shop will appear here.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 animate-in fade-in duration-300">
            {workOrders.map((wo) => {
                const totalLines = wo.lines.length;
                const grandTotal = wo.lines.reduce((sum, line) => sum + (line.amount || 0), 0);
                const serviceNames = wo.lines.map(l => l.description).join(", ");

                return (
                    <div
                        key={wo.id}
                        onClick={() => navigate(`/app/service/${wo.id}`)}
                        className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-xl hover:border-blue-100 cursor-pointer transition-all group"
                    >
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1 group-hover:text-blue-500 transition-colors">
                                    <FileText className="w-3 h-3" /> {wo.workOrderNumber || "WO-PENDING"}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide
                                    ${wo.status === 'Completed' ? 'bg-green-100 text-green-700' :
                                        wo.status === 'Open' ? 'bg-blue-100 text-blue-700' :
                                            'bg-slate-100 text-slate-600'}`}>
                                    {wo.status}
                                </span>
                                {ratingsMap[wo.id] !== undefined && (
                                    <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-amber-100 text-amber-700 border border-amber-200">
                                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                                        {ratingsMap[wo.id].toFixed(1)}
                                    </span>
                                )}
                            </div>
                            <h4 className="font-bold text-slate-900 text-lg group-hover:text-blue-600 transition-colors">{wo.title}</h4>
                            <div className="text-sm text-slate-600 font-medium mb-1 line-clamp-2">
                                {serviceNames || "No items"}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4 text-slate-400" />
                                    {new Date(wo.openedAt).toLocaleDateString()}
                                </span>
                                <span className="text-slate-300">•</span>
                                <span>{totalLines} Service Item{totalLines !== 1 ? 's' : ''}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-6 pl-0 md:pl-6 md:border-l border-slate-100">
                            <div className="text-right">
                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Cost</div>
                                <div className="text-xl font-black text-slate-900 flex items-center gap-1">
                                    <span className="text-slate-300 text-base">$</span>
                                    {grandTotal.toFixed(2)}
                                </div>
                            </div>
                            <div
                                className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm"
                            >
                                <Receipt className="w-5 h-5" />
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

const ShopReviewsList = ({ shopId }: { shopId: string }) => {
    const [reviews, setReviews] = useState<ShopRating[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const data = await shopsApi.getRatings(shopId);
                // Sort by date desc
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const sorted = data.sort((a, b) => {
                    const dateA = new Date(a.created_at || (a as any).createdAt);
                    const dateB = new Date(b.created_at || (b as any).createdAt);
                    return dateB.getTime() - dateA.getTime();
                });
                setReviews(sorted);
            } catch (error) {
                console.error("Failed to fetch reviews:", error);
            } finally {
                setLoading(false);
            }
        };

        if (shopId) {
            fetchReviews();
        }
    }, [shopId]);

    if (loading) {
        return <div className="p-8 text-center text-slate-400 animate-pulse">Loading reviews...</div>;
    }

    if (reviews.length === 0) {
        return null; // Empty state handled by parent for now, or we can add specific message
    }

    return (
        <div className="space-y-4 animate-in fade-in duration-300">
            {reviews.map((review) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const createdDate = new Date(review.created_at || (review as any).createdAt);

                return (
                    <div key={review.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">
                                    <User className="w-4 h-4" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <div className="text-sm font-bold text-slate-900">Verified User</div>
                                        {review.work_order_id && (
                                            <div className="bg-green-100 text-green-700 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full flex items-center gap-1">
                                                <ShieldCheck className="w-2.5 h-2.5" /> Verified Order
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-[10px] text-slate-400">
                                        {!isNaN(createdDate.getTime()) ? createdDate.toLocaleDateString() : 'Date unavailable'}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-1">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                                ))}
                            </div>
                        </div>
                        {review.service_date && (
                            <div className="text-xs text-slate-400 mb-2 font-medium bg-slate-50 inline-block px-2 py-1 rounded-lg">
                                Service Date: {new Date(review.service_date).toLocaleDateString()}
                            </div>
                        )}
                        <p className="text-slate-600 text-sm leading-relaxed">
                            {review.review_text || <span className="italic text-slate-400">No written review.</span>}
                        </p>
                    </div>
                );
            })}
        </div>
    );
};


const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "AIzaSyAeI6_E9c4EMx9T4t_FjyVUGSTN38GV69c";
// Helper to check if using default/demo key
const IS_DEMO_KEY = GOOGLE_MAPS_API_KEY === "AIzaSyAeI6_E9c4EMx9T4t_FjyVUGSTN38GV69c";

const ShopDetailView = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [shop, setShop] = useState<Shop | null>(null);

    const [workOrders, setWorkOrders] = useState<WorkOrderDto[]>([]);
    const [ratings, setRatings] = useState<ShopRating[]>([]);
    const [loading, setLoading] = useState(true);
    const [woLoading, setWoLoading] = useState(true);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isReviewOpen, setIsReviewOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'services' | 'reviews'>('overview');

    // Create ratings map - Must be before conditional returns
    const ratingsMap = React.useMemo(() => {
        const map: Record<string, number> = {};
        ratings.forEach(r => {
            if (r.work_order_id) {
                map[r.work_order_id] = r.rating;
            }
        });
        return map;
    }, [ratings]);

    useEffect(() => {
        if (id) {
            loadShopData();
        }
    }, [id]);

    const loadShopData = async () => {
        if (!id) return;
        setLoading(true);
        setWoLoading(true);
        try {

            const [shopData, woData] = await Promise.all([
                shopsApi.get(id),
                workOrdersApi.list({ vendorId: id })
            ]);

            // Fetch ratings separately to avoid blocking critical UI
            shopsApi.getRatings(id).then(setRatings).catch(err => console.error("Ratings fetch failed", err));

            if (!shopData) throw new Error("Shop not found");
            setShop(shopData);

            // Filter WOs just in case access control didn't filter it
            setWorkOrders(woData.filter(wo => wo.vendorId === id));
        } catch (error) {
            console.error('Error loading shop data:', error);
            toast({
                title: "Error loading shop",
                description: "This shop profile is currently unavailable.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
            setWoLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!shop || !id) return;
        try {
            await shopsApi.delete(id);
            toast({
                title: "Shop deleted",
                description: "The shop has been removed from your list."
            });
            navigate('/app/shops');
        } catch (error) {
            console.error('Error deleting shop:', error);
            toast({
                title: "Error deleting shop",
                description: "Please try again.",
                variant: "destructive"
            });
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 font-black text-slate-300 uppercase tracking-[0.3em]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                Loading Shop Profile...
            </div>
        );
    }

    if (!shop) return null;

    const tierConfig = VENDOR_PREFERENCE_CONFIG[shop.vendor_preference] || VENDOR_PREFERENCE_CONFIG.STANDARD;
    const mapQuery = encodeURIComponent(`${shop.shop_name} ${shop.address}, ${shop.city || ''} ${shop.state || ''}`);


    // Calculate stats
    const orderCount = workOrders.length;
    const totalSpent = workOrders.reduce((sum, wo) => sum + (wo.manualActualTotal || wo.estimatedTotal || 0), 0);



    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20">
            {/* Top Navigation Bar */}
            <div className="max-w-7xl mx-auto px-8 py-8 flex items-center justify-between">
                <Button
                    variant="ghost"
                    onClick={() => navigate('/app/shops')}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all pl-0"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Directory
                </Button>

                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditDialogOpen(true)}
                        className="h-10 px-4 rounded-xl border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-200 text-[10px] uppercase font-black tracking-widest gap-2"
                    >
                        <Edit className="w-3.5 h-3.5" /> Edit
                    </Button>

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-10 px-4 rounded-xl border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-200 text-[10px] uppercase font-black tracking-widest gap-2"
                            >
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-[2rem]">
                            <AlertDialogHeader>
                                <AlertDialogTitle>Delete this shop?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete <strong>{shop.shop_name}</strong> from your network.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-xl font-bold">Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleDelete}
                                    className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black uppercase tracking-widest text-[10px]"
                                >
                                    Delete Shop
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>


                </div>
            </div>

            <div className="max-w-[1400px] mx-auto px-12 space-y-12">
                {/* 1. HERO SECTION WITH VISUAL IDENTITY */}
                <div className="flex flex-col md:flex-row gap-10 items-start py-8">
                    {/* Large Shop Logo/Avatar */}
                    <div className="w-36 h-36 rounded-full bg-white border-4 border-white shadow-xl flex items-center justify-center flex-shrink-0 text-slate-200 overflow-hidden relative group">
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center text-4xl font-black text-slate-300 uppercase select-none">
                            {shop.shop_name.substring(0, 2)}
                        </div>
                    </div>

                    <div className="flex-1 space-y-6 pt-3">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-none">
                            {shop.shop_name}
                        </h1>

                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-3 text-slate-500 font-bold text-lg">
                                <MapPin className="w-5 h-5 flex-shrink-0" />
                                <span>{shop.address}, {shop.city}, {shop.state} {shop.zip || ''}</span>
                            </div>
                            {shop.phone && (
                                <div className="flex items-center gap-3 text-slate-500 font-bold text-lg">
                                    <Phone className="w-5 h-5 flex-shrink-0" />
                                    <a href={`tel:${shop.phone}`} className="hover:text-blue-600 transition-colors">{shop.phone}</a>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center gap-4 pt-4">
                            {/* Partner Badge */}
                            <span className={`px-4 py-1.5 ${tierConfig.bgColor} ${tierConfig.textColor} border border-${tierConfig.textColor.split('-')[1]}-100 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2`}>
                                {getTierIcon(shop.vendor_preference)}
                                {tierConfig.label}
                            </span>

                            {/* Rating Badge */}
                            <span className="px-4 py-1.5 bg-amber-50 text-amber-700 border border-amber-100 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                                {shop.average_rating > 0 ? shop.average_rating.toFixed(1) : 'No Rating'}
                                <span className="text-amber-300 mx-1">|</span>
                                {shop.total_reviews} Review{shop.total_reviews !== 1 ? 's' : ''}
                            </span>

                            {/* New Badge */}
                            {shop.created_at && new Date(shop.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) && (
                                <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                    <Sparkles className="w-4 h-4" /> NEW
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* 2. MAIN CONTENT GRID (Contact, Pricing, Sidebar) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

                    {/* Left Column: Contact & Pricing */}
                    <div className="lg:col-span-2 space-y-10">
                        {/* Essential Info Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Contact Card */}
                            <div className="bg-white rounded-[2rem] p-10 border border-slate-100 shadow-sm space-y-8 relative overflow-hidden group hover:shadow-md transition-all">
                                <div className="flex items-center gap-4 text-slate-400 mb-2">
                                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center">
                                        <Phone className="w-5 h-5" />
                                    </div>
                                    <span className="text-xs font-black uppercase tracking-widest">Contact</span>
                                </div>

                                <div className="text-3xl font-black text-slate-900 tracking-tight">
                                    {shop.phone || "No Phone Listed"}
                                </div>


                            </div>

                            {/* Pricing Card */}
                            <div className="bg-white rounded-[2rem] p-10 border border-slate-100 shadow-sm space-y-8 relative overflow-hidden group hover:shadow-md transition-all">
                                <div className="flex items-center gap-4 text-slate-400 mb-2">
                                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center">
                                        <DollarSign className="w-5 h-5" />
                                    </div>
                                    <span className="text-xs font-black uppercase tracking-widest">Pricing</span>
                                </div>

                                <div className="space-y-2">
                                    <div className="text-3xl font-black text-slate-900 tracking-tight">
                                        {shop.labor_rate ? `$${shop.labor_rate}/hour` : 'Market Rate'}
                                    </div>
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wide pl-1">
                                        Labor Rate
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <div className="inline-flex items-center px-4 py-2 rounded-xl bg-slate-50 border border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wide">
                                        Price Tier: {shop.labor_rate > 150 ? '$$$' : shop.labor_rate > 100 ? '$$' : '$'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 3. LARGE MAP SECTION */}
                        <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
                            <div className="p-10 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <MapPin className="w-4 h-4" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Location</span>
                                    </div>
                                    <div className="text-xl font-bold text-slate-900">{shop.address}, {shop.city}, {shop.state} {shop.zip || ''}</div>
                                </div>
                                <div className="flex gap-4">
                                    <a
                                        href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-6 py-3 bg-blue-50 text-blue-600 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-blue-100 transition-all flex items-center gap-2"
                                    >
                                        <ExternalLink className="w-4 h-4" /> Open in Maps
                                    </a>

                                </div>
                            </div>

                            {/* Interactive Map */}
                            <div className="w-full relative h-[500px] lg:h-[600px] bg-slate-100">
                                {shop.latitude && shop.longitude ? (
                                    <LocationPreview
                                        latitude={shop.latitude}
                                        longitude={shop.longitude}
                                        height="100%"
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center p-12 bg-slate-50 text-slate-400 space-y-8 text-center">
                                        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-md mb-4">
                                            <MapPin className="w-10 h-10 text-blue-500" />
                                        </div>
                                        <div className="space-y-3 max-w-lg">
                                            <h3 className="text-2xl font-black text-slate-900">Map Preview Unavailable</h3>
                                            <p className="text-base text-slate-500 font-medium leading-relaxed">
                                                Location coordinates are missing for this shop.
                                            </p>
                                        </div>
                                        <a
                                            href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center gap-3 shadow-xl shadow-blue-200 mt-6"
                                        >
                                            <ExternalLink className="w-5 h-5" /> Open in Google Maps
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Specializations & Reviews (Secondary) */}
                        <div className="space-y-10 pt-4">
                            {/* Tabs for secondary content */}
                            <div className="flex justify-start border-b border-slate-200">
                                <button
                                    onClick={() => setActiveTab('overview')}
                                    className={`px-8 py-5 text-xs font-black uppercase tracking-widest border-b-[3px] transition-all ${activeTab === 'overview' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                                >
                                    Specializations ({shop.specialties?.length || 0})
                                </button>
                                <button
                                    onClick={() => setActiveTab('services')}
                                    className={`px-8 py-5 text-xs font-black uppercase tracking-widest border-b-[3px] transition-all ${activeTab === 'services' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                                >
                                    Services ({workOrders.length})
                                </button>
                                <button
                                    onClick={() => setActiveTab('reviews')}
                                    className={`px-8 py-5 text-xs font-black uppercase tracking-widest border-b-[3px] transition-all ${activeTab === 'reviews' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                                >
                                    Reviews ({shop.total_reviews})
                                </button>
                            </div>

                            {activeTab === 'overview' && (
                                <div className="space-y-6 animate-in fade-in duration-300">
                                    <div className="flex flex-wrap gap-4">
                                        {shop.specialties?.map((spec, i) => {
                                            let icon = "🔧";
                                            const lowerSpec = spec.toLowerCase();
                                            if (lowerSpec.includes('tire')) icon = "🛞";
                                            else if (lowerSpec.includes('engine')) icon = "⚙️";
                                            else if (lowerSpec.includes('body')) icon = "🎨";
                                            else if (lowerSpec.includes('tow')) icon = "🚁";
                                            else if (lowerSpec.includes('electric')) icon = "⚡";
                                            else if (lowerSpec.includes('trailer')) icon = "🚛";

                                            return (
                                                <span key={i} className="px-6 py-3 bg-white text-slate-700 rounded-xl text-sm font-bold border border-slate-200 shadow-sm flex items-center gap-3">
                                                    <span className="text-xl">{icon}</span> {spec}
                                                </span>
                                            );
                                        }) || <span className="text-sm text-slate-400 italic">No specializations listed.</span>}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'services' && (
                                <ShopServicesList workOrders={workOrders} loading={woLoading} ratingsMap={ratingsMap} />
                            )}

                            {activeTab === 'reviews' && (
                                <div className="space-y-8 animate-in fade-in duration-300">
                                    {shop.total_reviews > 0 ? (
                                        <>
                                            <div className="p-10 bg-white rounded-2xl border border-slate-100 text-center">
                                                <div className="text-5xl font-black text-slate-900 mb-3">{shop.average_rating.toFixed(1)}</div>
                                                <div className="flex justify-center gap-2 mb-4">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star key={i} className={`w-6 h-6 ${i < Math.floor(shop.average_rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                                                    ))}
                                                </div>
                                                <p className="text-slate-400 text-base font-medium">Based on {shop.total_reviews} reviews</p>
                                            </div>

                                            <div className="pt-4">
                                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 ml-1">Recent Reviews</h3>
                                                <ShopReviewsList shopId={shop.id} />
                                            </div>
                                        </>
                                    ) : (
                                        <div className="p-12 bg-slate-50 border border-dashed border-slate-200 rounded-[2rem] text-center">
                                            <p className="text-slate-500 font-medium text-base">No reviews yet. Be the first!</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                    </div>

                    {/* Right Column: Sidebar (Network Intelligence) */}
                    <div className="space-y-8">
                        <div className="bg-[#0F172A] rounded-[2.5rem] p-10 text-white relative overflow-hidden group shadow-2xl sticky top-8">
                            {/* Background accent */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full blur-[60px] opacity-20 -mr-10 -mt-10 pointer-events-none"></div>

                            <div className="relative z-10 space-y-10">
                                <div className="flex items-center gap-4 text-blue-400">
                                    <LayoutDashboard className="w-6 h-6" />
                                    <span className="text-xs font-black uppercase tracking-[0.25em]">Network Intel</span>
                                </div>

                                {/* Intelligent Empty State / Stats */}
                                <div className="space-y-8">
                                    {orderCount === 0 ? (
                                        <div className="p-8 bg-slate-800/50 rounded-2xl border border-slate-700/50 text-center space-y-4">
                                            <div className="mx-auto w-14 h-14 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400">
                                                <Sparkles className="w-7 h-7" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-white text-base">New to Network</h4>
                                                <p className="text-sm text-slate-400 mt-1">Start building history with this shop.</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-8 bg-slate-800/50 rounded-2xl border border-slate-700/50 text-center space-y-4">
                                            <div className="mx-auto w-14 h-14 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400">
                                                <LayoutDashboard className="w-7 h-7" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-white text-base">Active Partner</h4>
                                                <p className="text-sm text-slate-400 mt-1">{orderCount} completed services</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className={orderCount === 0 ? "opacity-50 mix-blend-screen" : "opacity-100"}>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Orders</div>
                                                <div className="text-2xl font-black text-slate-300">{orderCount}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Spent</div>
                                                <div className="text-2xl font-black text-slate-300">${totalSpent.toLocaleString()}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>


                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Dialogs */}
            <AddShopDialog
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
                onShopAdded={(updatedShop) => {
                    if (updatedShop) {
                        setShop(updatedShop);
                        toast({
                            title: "Shop Updated",
                            description: "Changes have been saved successfully."
                        });
                    } else {
                        loadShopData();
                    }
                    setIsEditDialogOpen(false);
                }}
                shopToEdit={shop}
            />

            <WriteReviewDialog
                open={isReviewOpen}
                onOpenChange={setIsReviewOpen}
                shopId={shop.id}
                shopName={shop.shop_name}
                onReviewSubmitted={loadShopData}
            />
        </div>
    );
};

export default ShopDetailView;
