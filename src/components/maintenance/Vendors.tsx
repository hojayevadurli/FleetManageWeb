
import React, { useState, useMemo, useEffect } from 'react';
import {
    Store,
    Map as MapIcon,
    List,
    Search,
    Star,
    MapPin,
    Phone,
    Clock,
    ChevronRight,
    Plus,
    X,
    ArrowLeft,
    MessageSquare,
    TrendingUp,
    Truck,
    Loader2,
    ExternalLink,
    Share2,
    Globe,
    Lock,
    CheckCircle2,
    Camera,
    Trash2,
    Navigation,
    ClipboardList,
    Filter,
    DollarSign,
    AlertTriangle,
    Award,
    Zap,
    ShieldCheck,
    Tag,
    Info,
    Calendar,
    Sparkles,
    Award as Trophy,
    Activity
} from 'lucide-react';
import { Vendor, VendorStatus, VendorReview, WorkOrder } from '../../lib/types';
import { searchVendorSuggestions, fetchDetailedVendorInfo, findShopsNearby } from '../../lib/gemini';
import { useToast } from "@/hooks/use-toast";

// Google Maps Loader
import { Loader } from "@googlemaps/js-api-loader";

interface VendorsProps {
    vendors: Vendor[];
    workOrders: WorkOrder[];
    onUpdateVendors: (vendors: Vendor[]) => void;
    onNewWorkOrder?: (vendor: Vendor) => void;
}

const SERVICE_SPECIALTIES = [
    "Engine", "Transmission", "Brakes", "Tires", "Electrical", "Diagnostics", "Body Work", "Trailer Repair", "Mobile Service"
];

const Vendors: React.FC<VendorsProps> = ({ vendors, workOrders, onUpdateVendors, onNewWorkOrder }) => {
    const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [mapLoaded, setMapLoaded] = useState(false);
    const [copied, setCopied] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const { toast } = useToast();

    // AI & Discovery State
    const [isSearchingGrounding, setIsSearchingGrounding] = useState(false);
    const [groundedResults, setGroundedResults] = useState<any[]>([]);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

    // Add Vendor Flow State
    const [searchMode, setSearchMode] = useState<'name' | 'address'>('name');
    const [importQuery, setImportQuery] = useState('');
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [isManualEntry, setIsManualEntry] = useState(false);
    const [isFetchingDetails, setIsFetchingDetails] = useState(false);
    const [vendorForm, setVendorForm] = useState<Partial<Vendor>>({
        name: '',
        address: '',
        phone: '',
        website: '',
        rating: 0,
        reviewCount: 0,
        services: [],
        internalNotes: '',
        preferredContact: '',
        specialRates: '',
        status: VendorStatus.STANDARD
    });

    // Filters
    const [statusFilter, setStatusFilter] = useState<'ALL' | VendorStatus>('ALL');
    const [ratingFilter, setRatingFilter] = useState<number>(0);
    const [priceFilter, setPriceFilter] = useState<number | 'ALL'>('ALL');

    const filteredVendors = useMemo(() => {
        return vendors
            .filter(v => {
                const matchesSearch = v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    v.services.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
                const matchesStatus = statusFilter === 'ALL' || v.status === statusFilter;
                const matchesRating = v.rating >= ratingFilter;
                const matchesPrice = priceFilter === 'ALL' || v.priceRange === priceFilter;
                return matchesSearch && matchesStatus && matchesRating && matchesPrice;
            })
            .sort((a, b) => b.rating - a.rating);
    }, [vendors, searchTerm, statusFilter, ratingFilter, priceFilter]);

    // Google Maps Refs
    const mapRef = React.useRef<HTMLDivElement>(null);
    const mapInstanceRef = React.useRef<google.maps.Map | null>(null);
    const markersRef = React.useRef<google.maps.Marker[]>([]);

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            () => setUserLocation({ lat: 32.7767, lng: -96.7970 })
        );
    }, []);

    // Initialize Google Map
    useEffect(() => {
        if (viewMode === 'map' && mapRef.current && !mapInstanceRef.current && userLocation) {
            initMap();
        }
    }, [viewMode, userLocation]);

    const initMap = async () => {
        const loader = new Loader({
            apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
            version: "weekly",
        });

        try {
            await loader.load();
            if (!mapRef.current) return;

            const map = new google.maps.Map(mapRef.current, {
                center: userLocation || { lat: 32.7767, lng: -96.7970 },
                zoom: 11,
                styles: mapStyles, // optional
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: false,
            });

            mapInstanceRef.current = map;
            setMapLoaded(true);
            updateMarkers(map);
        } catch (e) {
            console.error(e);
        }
    };

    const updateMarkers = (map: google.maps.Map) => {
        // Clear existing
        markersRef.current.forEach(m => m.setMap(null));
        markersRef.current = [];

        // Add Vendors
        filteredVendors.forEach(v => {
            if (v.lat && v.lng) {
                const marker = new google.maps.Marker({
                    position: { lat: v.lat, lng: v.lng },
                    map,
                    title: v.name,
                    icon: {
                        url: `data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="%233b82f6"%3E%3Cpath d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/%3E%3C/svg%3E`,
                        scaledSize: new google.maps.Size(32, 32)
                    }
                });
                marker.addListener('click', () => setSelectedVendor(v));
                markersRef.current.push(marker);
            }
        });

        // Add AI Results
        groundedResults.forEach(r => {
            if (r.lat && r.lng) {
                const marker = new google.maps.Marker({
                    position: { lat: r.lat, lng: r.lng },
                    map,
                    title: r.name,
                    icon: {
                        url: `data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="%2310b981"%3E%3Cpath d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/%3E%3C/svg%3E`,
                        scaledSize: new google.maps.Size(32, 32)
                    }
                });
                markersRef.current.push(marker);
            }
        });
    };

    useEffect(() => {
        if (mapInstanceRef.current) {
            updateMarkers(mapInstanceRef.current);
        }
    }, [filteredVendors, groundedResults]);

    // Suggestions search effect
    useEffect(() => {
        if (!importQuery || importQuery.length < 3 || isManualEntry) {
            setSuggestions([]);
            return;
        }
        const timer = setTimeout(async () => {
            setIsSearchingGrounding(true);
            const res = await searchVendorSuggestions(importQuery, userLocation ? { latitude: userLocation.lat, longitude: userLocation.lng } : undefined);
            setSuggestions(res || []);
            setIsSearchingGrounding(false);
        }, 800);
        return () => clearTimeout(timer);
    }, [importQuery, isManualEntry]);


    const getStatusConfig = (status: VendorStatus) => {
        switch (status) {
            case VendorStatus.PREFERRED: return { color: 'emerald', icon: Trophy, label: 'Top Tier' };
            case VendorStatus.STANDARD: return { color: 'blue', icon: CheckCircle2, label: 'Verified' };
            case VendorStatus.WARNING: return { color: 'rose', icon: AlertTriangle, label: 'Under Review' };
            default: return { color: 'slate', icon: Store, label: 'Vendor' };
        }
    };

    const isNewVendor = (v: Vendor) => {
        if (!v.createdAt) return false;
        const createdDate = new Date(v.createdAt);
        const diffTime = Math.abs(new Date().getTime() - createdDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 7;
    };

    const handleShareProfile = (v: Vendor) => {
        const url = `${window.location.origin}${window.location.pathname}?shop=${v.slug}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        toast({
            title: "Link copied",
            description: "Partner profile URL copied to clipboard.",
        });
        setTimeout(() => setCopied(false), 2000);
    };

    const renderStars = (rating: number, size: 'sm' | 'md' = 'sm') => (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
                <Star
                    key={s}
                    className={`${size === 'sm' ? 'w-3 h-3' : 'w-5 h-5'} ${s <= Math.floor(rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`}
                />
            ))}
        </div>
    );

    const handleSelectSuggestion = async (s: any) => {
        setIsFetchingDetails(true);
        setImportQuery(s.title);
        setSuggestions([]);

        const details = await fetchDetailedVendorInfo(s.title, s.address);
        if (details) {
            setVendorForm({
                name: details.name,
                address: `${details.street}, ${details.city}, ${details.state} ${details.zip}`,
                phone: details.phone,
                website: details.website,
                rating: details.rating,
                reviewCount: details.reviewCount,
                services: details.types || [],
                isVerified: true,
                googlePlaceId: details.mapsUri,
                status: VendorStatus.STANDARD
            });
            setIsManualEntry(true);
        }
        setIsFetchingDetails(false);
    };

    const handleAddVendorToNetwork = () => {
        if (!vendorForm.name || !vendorForm.address) return;

        const newVendor: Vendor = {
            id: `v-${Date.now()}`,
            slug: (vendorForm.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            name: vendorForm.name || 'Unnamed Shop',
            address: vendorForm.address || '',
            phone: vendorForm.phone || 'N/A',
            website: vendorForm.website,
            email: '',
            businessHours: 'Consult Google',
            services: vendorForm.services || [],
            rating: vendorForm.rating || 0,
            reviewCount: vendorForm.reviewCount || 0,
            status: vendorForm.status || VendorStatus.STANDARD,
            lastUsedDate: '',
            lastReviewedDate: '',
            totalWorkOrders: 0,
            avgCost: 0,
            distance: 'N/A',
            responseTime: 'N/A',
            turnaroundTime: 'N/A',
            priceRange: 2,
            lat: userLocation?.lat || 32.7767,
            lng: userLocation?.lng || -96.7970,
            reviews: [],
            isPublic: false,
            createdAt: new Date().toISOString(),
            internalNotes: vendorForm.internalNotes,
            preferredContact: vendorForm.preferredContact,
            specialRates: vendorForm.specialRates,
            isVerified: vendorForm.isVerified,
            googlePlaceId: vendorForm.googlePlaceId
        };

        onUpdateVendors([...vendors, newVendor]);
        setIsAddModalOpen(false);
        toast({
            title: "Success",
            description: `${newVendor.name} added to your trusted network.`,
        });
        resetForm();
    };

    const resetForm = () => {
        setIsManualEntry(false);
        setImportQuery('');
        setSuggestions([]);
        setSearchMode('name');
        setVendorForm({
            name: '',
            address: '',
            phone: '',
            website: '',
            rating: 0,
            reviewCount: 0,
            services: [],
            internalNotes: '',
            preferredContact: '',
            specialRates: '',
            status: VendorStatus.STANDARD
        });
    };

    const toggleSpecialty = (specialty: string) => {
        const current = vendorForm.services || [];
        if (current.includes(specialty)) {
            setVendorForm({ ...vendorForm, services: current.filter(s => s !== specialty) });
        } else {
            setVendorForm({ ...vendorForm, services: [...current, specialty] });
        }
    };

    const handleNearbySearch = async () => {
        if (!userLocation) return;
        setIsSearchingGrounding(true);
        try {
            const results = await findShopsNearby(userLocation);
            setGroundedResults(results);
            toast({
                title: "AI Discovery Complete",
                description: `Found ${results.length} recommended shops in your area.`,
            });
        } catch (err) {
            console.error("Nearby search failed:", err);
        } finally {
            setIsSearchingGrounding(false);
        }
    };

    // High-Fidelity Detail View
    if (selectedVendor && viewMode === 'list') {
        return (
            <div className="min-h-screen bg-[#F8FAFC] animate-in fade-in duration-700">
                <div className="flex items-center justify-between mb-10">
                    <button
                        onClick={() => setSelectedVendor(null)}
                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Directory
                    </button>

                    <div className="flex items-center gap-4">
                        <button onClick={() => handleShareProfile(selectedVendor)} className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 transition-all">
                            <Share2 className="w-5 h-5" />
                        </button>
                        <button className="bg-slate-900 text-white px-8 py-3.5 rounded-xl flex items-center gap-2 font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl active:scale-95">
                            <MessageSquare className="w-4 h-4" /> Write Audit
                        </button>
                        <button onClick={() => onNewWorkOrder && onNewWorkOrder(selectedVendor)} className="bg-blue-600 text-white px-8 py-3.5 rounded-xl flex items-center gap-3 font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 active:scale-95">
                            <ClipboardList className="w-4 h-4" /> Dispatch WO
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                    <div className="xl:col-span-2 space-y-10">
                        <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-sm p-12 relative overflow-hidden">
                            <div className={`absolute top-0 right-0 w-1.5 h-full bg-${getStatusConfig(selectedVendor.status).color === 'emerald' ? 'emerald-500' : getStatusConfig(selectedVendor.status).color === 'blue' ? 'blue-600' : 'rose-500'}`} />

                            <div className="flex flex-col md:flex-row gap-12 items-start">
                                <div className="flex-1 space-y-8">
                                    <div className="flex items-center gap-3">
                                        <span className={`px-3 py-1 bg-${getStatusConfig(selectedVendor.status).color === 'emerald' ? 'emerald-50' : getStatusConfig(selectedVendor.status).color === 'blue' ? 'blue-50' : 'rose-50'} text-${getStatusConfig(selectedVendor.status).color === 'emerald' ? 'emerald-600' : getStatusConfig(selectedVendor.status).color === 'blue' ? 'blue-600' : 'rose-600'} text-[9px] font-black uppercase tracking-widest rounded-lg border border-${getStatusConfig(selectedVendor.status).color === 'emerald' ? 'emerald-100' : getStatusConfig(selectedVendor.status).color === 'blue' ? 'blue-100' : 'rose-100'} flex items-center gap-2`}>
                                            {React.createElement(getStatusConfig(selectedVendor.status).icon, { className: 'w-3.5 h-3.5' })} {getStatusConfig(selectedVendor.status).label}
                                        </span>
                                        {isNewVendor(selectedVendor) && <span className="px-3 py-1 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest rounded-lg flex items-center gap-1.5">
                                            <Zap className="w-3.5 h-3.5 fill-white" /> New
                                        </span>}
                                    </div>

                                    <div className="space-y-4">
                                        <h1 className="text-6xl font-black text-slate-900 tracking-tight leading-none">
                                            {selectedVendor.name}
                                        </h1>
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <MapPin className="w-5 h-5 text-blue-500" />
                                            <span className="text-sm font-bold">{selectedVendor.address}</span>
                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-200 mx-2" />
                                            <span className="text-sm font-bold">{selectedVendor.distance} from HQ</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-6">
                                        {[
                                            { icon: Phone, label: 'Contact', val: selectedVendor.phone },
                                            { icon: Clock, label: 'Operations', val: selectedVendor.businessHours },
                                            { icon: TrendingUp, label: 'Turnaround', val: selectedVendor.turnaroundTime },
                                            { icon: DollarSign, label: 'Price Index', val: "$".repeat(selectedVendor.priceRange) }
                                        ].map((item, i) => (
                                            <div key={i} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                                                <item.icon className="w-4 h-4 text-blue-600 mb-3" />
                                                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.label}</div>
                                                <div className="text-xs font-black text-slate-900 mt-1">{item.val}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="w-full md:w-[240px] p-8 border border-slate-100 rounded-[3rem] bg-white shadow-xl shadow-slate-200/50 flex flex-col items-center text-center space-y-4">
                                    <div className="text-6xl font-black text-slate-900 tracking-tighter">
                                        {selectedVendor.rating}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {renderStars(selectedVendor.rating, 'md')}
                                    </div>
                                    <div className="h-px w-12 bg-slate-100" />
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        {selectedVendor.reviewCount} Verified Audits
                                    </div>
                                </div>
                            </div>
                        </div>

                        {selectedVendor.internalNotes && (
                            <div className="bg-amber-50 p-10 rounded-[3rem] border border-amber-100 flex gap-6 items-start">
                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-amber-200 shrink-0">
                                    <Info className="w-6 h-6 text-amber-600" />
                                </div>
                                <div>
                                    <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em] mb-2">Internal Performance Notes</h4>
                                    <p className="text-sm font-medium text-slate-700 leading-relaxed">{selectedVendor.internalNotes}</p>
                                </div>
                            </div>
                        )}

                        <div className="space-y-6">
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.25em] flex items-center gap-3 ml-4">
                                <Activity className="w-5 h-5 text-blue-600" /> Historical Audits
                            </h3>
                            <div className="space-y-4">
                                {selectedVendor.reviews.map(rev => (
                                    <div key={rev.id} className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm group hover:border-blue-500/20 transition-all">
                                        <div className="flex items-center justify-between mb-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center font-black text-slate-300 uppercase text-xl">{rev.reviewerName[0]}</div>
                                                <div>
                                                    <p className="text-lg font-black text-slate-900">{rev.reviewerName}</p>
                                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{rev.date}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="flex justify-end mb-2">{renderStars(rev.totalRating)}</div>
                                                {rev.workOrderId && <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-lg border border-blue-100">Audit Ref: {rev.workOrderId}</span>}
                                            </div>
                                        </div>
                                        <p className="text-slate-500 font-medium leading-relaxed italic border-l-4 border-slate-100 pl-8 mb-8 text-lg">"{rev.comment}"</p>
                                        <div className="grid grid-cols-3 gap-8 pt-8 border-t border-slate-50">
                                            {[{ l: 'Service Quality', v: rev.qualityRating }, { l: 'Resolution Speed', v: rev.timelinessRating }, { l: 'Economic Value', v: rev.costRating }].map(m => (
                                                <div key={m.l} className="space-y-2">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{m.l}</p>
                                                    <div className="flex">{renderStars(m.v)}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-10">
                        <div className="bg-[#0F172A] rounded-[3.5rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-all">
                                <Award className="w-24 h-24 text-blue-400 rotate-12" />
                            </div>

                            <div className="relative z-10 space-y-10">
                                <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4" /> Network Intelligence
                                </h3>

                                <div className="space-y-1">
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lifetime Value</div>
                                    <div className="text-5xl font-black tracking-tight font-mono">${(selectedVendor.totalWorkOrders * selectedVendor.avgCost).toLocaleString()}</div>
                                </div>

                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-1">
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Work Orders</div>
                                        <div className="text-2xl font-black">{selectedVendor.totalWorkOrders}</div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avg Ticket</div>
                                        <div className="text-2xl font-black">${selectedVendor.avgCost}</div>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-8 border-t border-slate-800">
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Core Specializations</div>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedVendor.services.map(s => (
                                            <span key={s} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-300 hover:bg-white/10 transition-colors">
                                                {s}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-sm p-10 space-y-8">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Service Reach</h3>
                            <div className="h-[280px] bg-slate-50 rounded-[2.5rem] border border-slate-100 flex items-center justify-center relative overflow-hidden group">
                                <MapPin className="w-12 h-12 text-blue-500 relative z-10 animate-bounce" />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/5 to-transparent" />
                            </div>
                            <button className="w-full py-5 bg-slate-50 text-slate-900 border border-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-100 transition-all active:scale-95 shadow-sm">
                                <Navigation className="w-4 h-4 fill-slate-900" /> Open Navigation
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20 space-y-12">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pt-10 px-8">
                <div className="space-y-4">
                    <h1 className="text-5xl font-black text-slate-900 tracking-tight">Service Network</h1>
                    <p className="text-lg text-slate-500 font-medium max-w-xl">
                        Manage trusted partners, audit performance, and discover new shops across your maintenance cloud.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="bg-white p-1.5 rounded-2xl border border-slate-200 flex shadow-sm">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'list' ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <List className="w-4 h-4" /> List
                        </button>
                        <button
                            onClick={() => setViewMode('map')}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'map' ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <MapIcon className="w-4 h-4" /> Map
                        </button>
                    </div>
                    <button
                        onClick={() => { resetForm(); setIsAddModalOpen(true); }}
                        className="bg-blue-600 text-white px-8 py-4.5 rounded-[1.5rem] flex items-center gap-3 font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 active:scale-95"
                    >
                        <Plus className="w-5 h-5" /> Integrate Shop
                    </button>
                </div>
            </div>

            {/* Search & Tool Bar */}
            <div className="flex flex-col lg:flex-row items-center gap-6 px-8">
                <div className="relative flex-1 group w-full">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search within your trusted service cloud..."
                        className="w-full pl-16 pr-8 py-6 bg-white border border-slate-100 rounded-[2.5rem] text-sm font-black text-slate-900 outline-none shadow-sm focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <button
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    className={`flex items-center gap-3 px-8 py-6 bg-white border border-slate-100 rounded-[2.5rem] text-[10px] font-black uppercase tracking-widest shadow-sm transition-all ${isFilterOpen ? 'border-blue-500 text-blue-600' : 'text-slate-500 hover:text-blue-600'}`}
                >
                    <Filter className="w-4 h-4" /> {isFilterOpen ? 'Apply Filters' : 'Advanced Filters'}
                </button>
            </div>

            {/* Advanced Filters Panel */}
            {isFilterOpen && (
                <div className="mx-8 bg-[#0F172A] rounded-[3rem] p-10 shadow-2xl relative overflow-hidden group animate-in slide-in-from-top-4">
                    <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:opacity-40 transition-opacity">
                        <Sparkles className="w-20 h-20 text-blue-400" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
                        <div className="space-y-5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Network Tier</label>
                            <div className="flex bg-slate-800/50 p-1.5 rounded-2xl border border-slate-700">
                                {(['ALL', ...Object.values(VendorStatus)] as string[]).map(s => (
                                    <button key={s} onClick={() => setStatusFilter(s as any)} className={`flex-1 py-2.5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${statusFilter === s ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-slate-200'}`}>{s}</button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Minimum Performance Audit</label>
                            <div className="flex bg-slate-800/50 p-1.5 rounded-2xl border border-slate-700">
                                {(['ALL', 3, 4, 4.5] as (string | number)[]).map(r => (
                                    <button key={r} onClick={() => setRatingFilter(r as any)} className={`flex-1 py-2.5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${ratingFilter === r ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-slate-200'}`}>{r === 'ALL' ? 'All' : `${r}+ Stars`}</button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Pricing Strategy</label>
                            <div className="flex bg-slate-800/50 p-1.5 rounded-2xl border border-slate-700">
                                {(['ALL', 1, 2, 3] as (string | number)[]).map(p => (
                                    <button key={p} onClick={() => setPriceFilter(p as any)} className={`flex-1 py-2.5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${priceFilter === p ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-slate-200'}`}>{p === 'ALL' ? 'All' : "$".repeat(p as number)}</button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Grid View */}
            {viewMode === 'list' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 px-8">
                    {filteredVendors.map(v => (
                        <div
                            key={v.id}
                            className="group relative bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden cursor-pointer flex flex-col"
                            onClick={() => setSelectedVendor(v)}
                        >
                            <div className={`absolute top-0 left-0 bottom-0 w-1.5 bg-${getStatusConfig(v.status).color === 'emerald' ? 'emerald-500' : getStatusConfig(v.status).color === 'blue' ? 'blue-600' : 'rose-500'}`} />

                            <div className="p-8 space-y-8 flex-1 flex flex-col">
                                <div className="flex items-center justify-between">
                                    <div className={`w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100`}>
                                        {React.createElement(getStatusConfig(v.status).icon, { className: `w-4 h-4 text-${getStatusConfig(v.status).color}-500` })}
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <div className="flex gap-1">{renderStars(v.rating)}</div>
                                        <span className="text-[9px] font-black text-slate-400 uppercase mt-1">{v.reviewCount} Audits</span>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-tight group-hover:text-blue-600 transition-colors uppercase truncate">
                                        {v.name}
                                    </h3>
                                    <div className="flex items-start gap-2 text-slate-400">
                                        <MapPin className="w-4 h-4 text-blue-500 mt-0.5" />
                                        <p className="text-xs font-bold leading-relaxed line-clamp-1">{v.address}</p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {v.services.slice(0, 3).map(s => (
                                        <span key={s} className="px-3 py-1.5 bg-slate-50 text-slate-500 text-[9px] font-black uppercase tracking-widest rounded-lg border border-slate-100">{s}</span>
                                    ))}
                                </div>

                                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-50 mt-auto">
                                    <div className="text-center">
                                        <p className="text-[10px] font-black text-slate-400 uppercase">Orders</p>
                                        <p className="text-sm font-black text-slate-900">{v.totalWorkOrders}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[10px] font-black text-slate-400 uppercase">Price</p>
                                        <p className="text-sm font-black text-slate-900">{"$".repeat(v.priceRange)}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[10px] font-black text-slate-400 uppercase">Speed</p>
                                        <p className="text-sm font-black text-slate-900">{v.responseTime}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 pt-6">
                                    <button className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 shadow-xl transition-all">
                                        Manage Audit
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onNewWorkOrder?.(v); }}
                                        className="p-4 bg-slate-50 text-slate-400 rounded-2xl border border-slate-100 hover:text-blue-600 transition-all"
                                    >
                                        <ClipboardList className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {filteredVendors.length === 0 && (
                        <div className="col-span-full py-20 bg-white rounded-[3.5rem] border border-slate-100 text-center flex flex-col items-center">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                                <Search className="w-8 h-8 text-slate-200" />
                            </div>
                            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No shops match your criteria</p>
                            <button onClick={() => { setSearchTerm(''); setStatusFilter('ALL'); }} className="mt-6 text-blue-600 text-xs font-black uppercase tracking-widest hover:underline">Clear all filters</button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="mx-8 bg-white rounded-[3.5rem] border border-slate-200 shadow-sm overflow-hidden min-h-[600px] relative">
                    <div ref={mapRef} className="w-full h-[700px]" />
                    {!mapLoaded && (
                        <div className="absolute inset-0 bg-slate-50 flex items-center justify-center font-black text-slate-300 uppercase tracking-widest text-xs z-20">
                            Orchestrating Network Map...
                        </div>
                    )}
                    <div className="absolute top-10 left-10 z-[1000] flex flex-col gap-4">
                        <button
                            onClick={handleNearbySearch}
                            disabled={isSearchingGrounding}
                            className="bg-white/90 backdrop-blur px-8 py-4 rounded-2xl shadow-2xl border border-white/20 flex items-center gap-3 font-black text-[10px] uppercase tracking-widest text-slate-900 hover:scale-105 transition-all active:scale-95 group"
                        >
                            {isSearchingGrounding ? <Loader2 className="w-4 h-4 animate-spin text-blue-600" /> : <Sparkles className="w-4 h-4 text-blue-600 group-hover:rotate-12 transition-transform" />}
                            Discover Local Capacity (AI)
                        </button>
                    </div>
                </div>
            )}

            {/* Integrate Shop Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 sm:p-10 bg-slate-900/60 backdrop-blur-md overflow-hidden animate-in fade-in duration-300">
                    <div className="bg-white rounded-[3.5rem] w-full max-w-4xl shadow-2xl h-full max-h-[85vh] flex flex-col relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-50"></div>

                        <div className="p-10 md:p-14 border-b border-slate-50 flex items-center justify-between shrink-0 relative z-10">
                            <div className="flex items-center gap-6">
                                <div className="w-14 h-14 bg-blue-600 rounded-[1.25rem] flex items-center justify-center shadow-2xl shadow-blue-500/20">
                                    <Globe className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Add Service Partner to Network</h2>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">VERIFY SHOP INFORMATION VIA GOOGLE GROUNDING</p>
                                </div>
                            </div>
                            <button onClick={() => setIsAddModalOpen(false)} className="w-12 h-12 rounded-full hover:bg-slate-50 flex items-center justify-center transition-all text-slate-400 hover:text-slate-900">
                                <X className="w-8 h-8" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-10 md:p-14 custom-scrollbar relative z-10">
                            {!isManualEntry ? (
                                <div className="space-y-10">
                                    <div className="flex p-1 bg-slate-50/50 rounded-2xl border border-slate-100 max-w-2xl mx-auto">
                                        <button
                                            onClick={() => setSearchMode('name')}
                                            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${searchMode === 'name' ? 'bg-white text-blue-600 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
                                        >
                                            Search by Business Name
                                        </button>
                                        <button
                                            onClick={() => setSearchMode('address')}
                                            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${searchMode === 'address' ? 'bg-white text-blue-600 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
                                        >
                                            Search by Address
                                        </button>
                                    </div>

                                    <div className="space-y-6 max-w-3xl mx-auto">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Search for business name...</label>
                                            <div className="relative group">
                                                <Search className={`absolute left-8 top-1/2 -translate-y-1/2 w-6 h-6 ${isSearchingGrounding ? 'text-blue-500 animate-pulse' : 'text-slate-300'}`} />
                                                <input
                                                    type="text"
                                                    placeholder="e.g. Springfield Heavy Duty Repair"
                                                    className="w-full pl-24 pr-10 py-8 bg-slate-50/30 border border-slate-100 rounded-[2.5rem] font-black text-xl text-slate-400/70 outline-none focus:border-blue-500 transition-all shadow-inner"
                                                    value={importQuery}
                                                    onChange={e => setImportQuery(e.target.value)}
                                                    autoFocus
                                                />
                                            </div>
                                        </div>
                                        <div className="h-px bg-slate-50 w-full" />
                                        <button type="button" onClick={() => setIsManualEntry(true)} className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline flex items-center gap-2">
                                            Can't find your vendor? Add manually <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {suggestions.length > 0 && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-bottom-4">
                                            {suggestions.map((s, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => handleSelectSuggestion(s)}
                                                    className="group text-left p-8 bg-white border border-slate-100 rounded-[2.5rem] hover:border-blue-500 hover:shadow-2xl transition-all relative overflow-hidden"
                                                >
                                                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                                        <Globe className="w-12 h-12" />
                                                    </div>
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 rounded-lg text-amber-600 font-black text-[10px]">
                                                            <Star className="w-3.5 h-3.5 fill-amber-500" /> {s.rating || '4.8'}
                                                        </div>
                                                        <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Google Suggestion</span>
                                                    </div>
                                                    <p className="text-xl font-black text-slate-900 group-hover:text-blue-600 transition-colors uppercase leading-tight mb-2">{s.title}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 line-clamp-1">{s.address}</p>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {!isSearchingGrounding && importQuery.length >= 3 && suggestions.length === 0 && (
                                        <div className="p-14 bg-slate-50 rounded-[3rem] text-center border-2 border-dashed border-slate-200">
                                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                                                <Search className="w-8 h-8 text-slate-200" />
                                            </div>
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No verified matches found</h4>
                                        </div>
                                    )}

                                    <div className="pt-10 flex justify-center">
                                        <button type="button" onClick={() => setIsManualEntry(true)} className="px-8 py-4 rounded-xl text-[10px] font-black text-blue-600 uppercase tracking-widest hover:bg-blue-50 transition-all flex items-center gap-2">
                                            Manual Entry Overide <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-10 animate-in fade-in duration-500">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                        <div className="space-y-1.5 md:col-span-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Business Identity *</label>
                                            <input required type="text" className="w-full px-8 py-6 bg-slate-50/50 border border-slate-100 rounded-2xl font-black text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/5 transition-all shadow-inner" value={vendorForm.name} onChange={e => setVendorForm({ ...vendorForm, name: e.target.value })} />
                                        </div>
                                        <div className="space-y-1.5 md:col-span-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Service Address *</label>
                                            <input required type="text" className="w-full px-8 py-6 bg-slate-50/50 border border-slate-100 rounded-2xl font-black text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/5 transition-all shadow-inner" value={vendorForm.address} onChange={e => setVendorForm({ ...vendorForm, address: e.target.value })} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact Phone</label>
                                            <input type="text" className="w-full px-8 py-6 bg-slate-50/50 border border-slate-100 rounded-2xl font-black text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/5 transition-all shadow-inner" value={vendorForm.phone} onChange={e => setVendorForm({ ...vendorForm, phone: e.target.value })} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Web Presence</label>
                                            <input type="text" className="w-full px-8 py-6 bg-slate-50/50 border border-slate-100 rounded-2xl font-black text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/5 transition-all shadow-inner" value={vendorForm.website} onChange={e => setVendorForm({ ...vendorForm, website: e.target.value })} />
                                        </div>

                                        {/* Metadata Section - Card Style */}
                                        <div className="md:col-span-2 bg-slate-50/30 p-10 rounded-[2.5rem] border border-slate-100 shadow-inner grid grid-cols-1 md:grid-cols-2 gap-10">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Preferred Contact Person</label>
                                                <input type="text" placeholder=" Mike - Shop Foreman" className="w-full px-8 py-6 bg-white border border-slate-100 rounded-2xl font-black text-slate-600 outline-none focus:ring-4 focus:ring-blue-500/5 transition-all shadow-sm" value={vendorForm.preferredContact} onChange={e => setVendorForm({ ...vendorForm, preferredContact: e.target.value })} />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Agreed Rates / Discounts</label>
                                                <input type="text" placeholder=" 10% Fleet Discount" className="w-full px-8 py-6 bg-white border border-slate-100 rounded-2xl font-black text-slate-600 outline-none focus:ring-4 focus:ring-blue-500/5 transition-all shadow-sm" value={vendorForm.specialRates} onChange={e => setVendorForm({ ...vendorForm, specialRates: e.target.value })} />
                                            </div>
                                            <div className="md:col-span-2 space-y-1.5">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Internal Performance Notes</label>
                                                <textarea rows={4} placeholder="Any internal notes about this vendor..." className="w-full px-8 py-6 bg-white border border-slate-100 rounded-[2rem] font-medium text-slate-600 outline-none focus:ring-4 focus:ring-blue-500/5 transition-all shadow-sm resize-none" value={vendorForm.internalNotes} onChange={e => setVendorForm({ ...vendorForm, internalNotes: e.target.value })} />
                                            </div>
                                        </div>

                                        <div className="md:col-span-2 space-y-5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Service Specializations</label>
                                            <div className="flex flex-wrap gap-3">
                                                {SERVICE_SPECIALTIES.map(s => (
                                                    <button key={s} onClick={() => toggleSpecialty(s)} className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${vendorForm.services?.includes(s) ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-400 hover:text-slate-600 border border-slate-100'}`}>
                                                        <Tag className={`w-3.5 h-3.5 inline mr-2 ${vendorForm.services?.includes(s) ? 'text-blue-400' : 'text-slate-200'}`} /> {s}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-10 md:p-14 border-t border-slate-50 flex flex-col md:flex-row items-center justify-end gap-6 shrink-0 bg-slate-50/50">
                            <button onClick={resetForm} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 px-6">Go Back</button>
                            <button
                                onClick={handleAddVendorToNetwork}
                                disabled={!vendorForm.name || !vendorForm.address}
                                className="w-full md:w-auto bg-slate-900 text-white px-16 py-6 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50 disabled:pointer-events-none"
                            >
                                {isFetchingDetails ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle2 className="w-6 h-6" />}
                                Integrate into Network
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Vendors;

const mapStyles = [
    {
        "featureType": "all",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#1f2937" }]
    },
    {
        "featureType": "water",
        "stylers": [{ "color": "#e5e7eb" }]
    }
];
