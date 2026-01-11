
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import {
    ArrowLeft,
    Share2,
    MessageSquare,
    Send,
    ShieldCheck,
    MapPin,
    Phone,
    Clock,
    TrendingUp,
    DollarSign,
    Star,
    Sparkles,
    ExternalLink,
    Navigation,
    Trophy,
    Activity,
    Award,
    Trash2,
    Edit
} from 'lucide-react';
import { shopsApi } from '@/lib/shopsApi';
import { Shop } from '@/components/shops/types/ShopTypes';
import { useToast } from '@/hooks/use-toast';
import AddShopDialog from '@/components/shops/AddShopDialog';

const ShopDetailView = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [shop, setShop] = useState<Shop | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    useEffect(() => {
        if (id) loadShop();
    }, [id]);

    const loadShop = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const data = await shopsApi.get(id);
            if (!data) throw new Error("Shop not found");
            setShop(data);
        } catch (error) {
            console.error('Error loading shop:', error);
            toast({
                title: "Error loading shop",
                description: "This shop profile is currently unavailable.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!shop || !id) return;
        if (confirm('Are you sure you want to delete this shop? This action cannot be undone.')) {
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
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 font-black text-slate-300 uppercase tracking-[0.3em]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                Analyzing Partner Intelligence...
            </div>
        );
    }

    if (!shop) return null;

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20">
            {/* Top Bar */}
            <div className="max-w-7xl mx-auto px-8 py-10 flex items-center justify-between">
                <Button
                    variant="ghost"
                    onClick={() => navigate('/app/shops')}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all group hover:bg-transparent pl-0"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to Directory
                </Button>

                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setIsEditDialogOpen(true)}
                        className="h-12 w-12 rounded-xl border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200"
                        title="Edit Shop"
                    >
                        <Edit className="w-5 h-5" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handleDelete}
                        className="h-12 w-12 rounded-xl border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200"
                        title="Delete Shop"
                    >
                        <Trash2 className="w-5 h-5" />
                    </Button>
                    <div className="w-px h-8 bg-slate-200 mx-2" />
                    <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl border-slate-200 text-slate-400 hover:text-slate-900">
                        <Share2 className="w-5 h-5" />
                    </Button>
                    <Button variant="secondary" className="h-12 px-8 rounded-xl flex items-center gap-2 font-black text-xs uppercase tracking-widest shadow-xl active:scale-95">
                        <MessageSquare className="w-4 h-4" /> Write Audit
                    </Button>
                    <Button className="h-12 px-8 rounded-xl flex items-center gap-3 font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-95">
                        <Send className="w-4 h-4" /> Dispatch WO
                    </Button>
                </div>
            </div>

            <AddShopDialog
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
                onShopAdded={() => {
                    loadShop(); // Reload details after edit
                    setIsEditDialogOpen(false);
                }}
                shopToEdit={shop}
            />

            <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 xl:grid-cols-3 gap-10">
                {/* Main Hero & Info */}
                <div className="xl:col-span-2 space-y-10">
                    <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-sm p-12 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-1.5 h-full bg-blue-600" />

                        <div className="flex flex-col md:flex-row gap-12 items-start">
                            <div className="flex-1 space-y-8">
                                <div className="flex items-center gap-3">
                                    <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[9px] font-black uppercase tracking-widest rounded-lg border border-blue-100 flex items-center gap-1.5">
                                        <ShieldCheck className="w-3.5 h-3.5" /> Verified
                                    </span>
                                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest rounded-lg border border-emerald-100 flex items-center gap-1.5">
                                        <Sparkles className="w-3.5 h-3.5" /> New
                                    </span>
                                </div>

                                <div className="space-y-4">
                                    <h1 className="text-6xl font-black text-slate-900 tracking-tight leading-none">
                                        {shop.shop_name}
                                    </h1>
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <MapPin className="w-5 h-5" />
                                        <span className="text-sm font-bold">{shop.address}</span>
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-200 mx-2" />
                                        <span className="text-sm font-bold">{shop.phone}</span>
                                    </div>
                                    <p className="text-slate-500 font-medium max-w-lg">
                                        Authorized service partner specializing in heavy-duty maintenance and diagnostics.
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-6">
                                    <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                            <Phone className="w-3 h-3" /> Contact
                                        </div>
                                        <div className="text-xs font-black text-slate-900">{shop.phone || 'N/A'}</div>
                                    </div>
                                    <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                            <Clock className="w-3 h-3" /> Operations
                                        </div>
                                        <div className="text-xs font-black text-slate-900">Consult Google</div>
                                    </div>
                                    <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                            <TrendingUp className="w-3 h-3" /> Turnaround
                                        </div>
                                        <div className="text-xs font-black text-slate-900">N/A</div>
                                    </div>
                                    <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                            <DollarSign className="w-3 h-3 text-blue-500" /> Price Index
                                        </div>
                                        <div className="text-xs font-black text-slate-900">
                                            {shop.labor_rate > 150 ? '$$$' : shop.labor_rate > 100 ? '$$' : '$'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="w-full md:w-[240px] p-8 border border-slate-100 rounded-[3rem] bg-white shadow-xl shadow-slate-200/50 flex flex-col items-center text-center space-y-4">
                                <div className="text-6xl font-black text-slate-900 tracking-tighter">
                                    {shop.average_rating || 0}
                                </div>
                                <div className="flex items-center gap-1 text-amber-400">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className={`w-5 h-5 ${i < Math.floor(shop.average_rating || 0) ? 'fill-amber-400' : 'text-slate-200'}`} />
                                    ))}
                                </div>
                                <div className="h-px w-12 bg-slate-100" />
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    {shop.total_reviews || 0} Verified Audits
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.25em] flex items-center gap-3 ml-4">
                            <Activity className="w-5 h-5 text-blue-600" /> Historical Audits
                        </h3>
                        <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm p-12 text-center">
                            <p className="text-sm font-black text-slate-300 uppercase tracking-widest italic">Scanning Audit Cloud...</p>
                        </div>
                    </div>
                </div>

                {/* Sidebar Intelligence */}
                <div className="space-y-10">
                    <div className="bg-[#0F172A] rounded-[3.5rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-all">
                            <Award className="w-24 h-24 text-blue-400 rotate-12" />
                        </div>

                        <div className="relative z-10 space-y-10">
                            <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] flex items-center gap-2">
                                <Trophy className="w-4 h-4" /> Network Intelligence
                            </h3>

                            <div className="space-y-1">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lifetime Value</div>
                                <div className="text-5xl font-black tracking-tight">$0</div>
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-1">
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Work Orders</div>
                                    <div className="text-2xl font-black">0</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avg Ticket</div>
                                    <div className="text-2xl font-black">$0</div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Core Specializations</div>
                                <div className="flex flex-wrap gap-2">
                                    {shop.specialties?.map((s, i) => (
                                        <span key={i} className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-300">
                                            {s}
                                        </span>
                                    )) || <span className="text-xs text-slate-500 italic">No specialties recorded.</span>}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-sm p-10 space-y-8">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Service Reach</h3>
                        </div>

                        <div className="h-[300px] bg-slate-50 rounded-[2.5rem] border border-slate-100 flex items-center justify-center relative overflow-hidden group">
                            {/* Placeholder for map */}
                            <MapPin className="w-12 h-12 text-slate-200 transition-transform group-hover:scale-110" />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/10 to-transparent" />
                        </div>

                        <Button
                            variant="outline"
                            onClick={() => {
                                const url = `https://www.google.com/maps/dir/?api=1&destination=${shop.latitude},${shop.longitude}`;
                                window.open(url, '_blank');
                            }}
                            className="w-full h-auto py-5 border-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 shadow-sm hover:bg-slate-50 text-slate-900"
                        >
                            <Navigation className="w-4 h-4 fill-slate-900" /> Open Navigation
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShopDetailView;
