
import React from 'react';
import {
    Star,
    MapPin,
    ShieldCheck,
    Trophy,
    Clock,
    FileText,
    ChevronRight,
    Sparkles
} from 'lucide-react';
import { Shop } from './types/ShopTypes';
import { Badge } from '@/components/ui/badge';

interface ShopCardProps {
    shop: Shop;
    onClick?: () => void;
    onManageAudit?: () => void;
}

const ShopCard: React.FC<ShopCardProps> = ({ shop, onClick, onManageAudit }) => {
    const rating = shop.average_rating || 0;
    const reviews = shop.total_reviews || 0;

    return (
        <div
            className="group relative bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden cursor-pointer"
            onClick={onClick}
        >
            {/* Decorative side accent based on tier */}
            <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${shop.rate_category === 'green' ? 'bg-emerald-500' :
                    shop.rate_category === 'orange' ? 'bg-amber-500' : 'bg-rose-500'
                }`} />

            <div className="p-8 space-y-8">
                {/* Header: Verified Badge & Ranking */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full ${shop.rate_category === 'green' ? 'bg-blue-50' : 'bg-slate-50'} flex items-center justify-center border border-slate-100`}>
                            {shop.rate_category === 'green' ? (
                                <ShieldCheck className="w-4 h-4 text-blue-500" />
                            ) : (
                                <Trophy className="w-4 h-4 text-slate-400" />
                            )}
                        </div>
                        {shop.created_at && new Date(shop.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) && (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 text-[8px] font-black uppercase tracking-widest border border-emerald-200">
                                New
                            </span>
                        )}
                    </div>
                    <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                                <Star
                                    key={i}
                                    className={`w-3 h-3 ${i < Math.floor(rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`}
                                />
                            ))}
                        </div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">
                            {reviews} Audits
                        </span>
                    </div>
                </div>

                {/* Shop Identity */}
                <div className="space-y-3">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-tight group-hover:text-blue-600 transition-colors">
                        {shop.shop_name}
                    </h3>
                    <div className="flex items-start gap-2 text-slate-400">
                        <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <p className="text-xs font-bold leading-relaxed">
                            {shop.address}
                        </p>
                    </div>
                </div>

                {/* Specializations */}
                <div className="flex flex-wrap gap-2">
                    {shop.specialties?.slice(0, 3).map((spec, i) => (
                        <span key={i} className="px-3 py-1.5 bg-slate-50 text-slate-500 text-[9px] font-black uppercase tracking-widest rounded-lg border border-slate-100">
                            {spec}
                        </span>
                    )) || <span className="px-3 py-1.5 bg-slate-50 text-slate-500 text-[9px] font-black uppercase tracking-widest rounded-lg border border-slate-100 italic">General Service</span>}
                    {shop.specialties && shop.specialties.length > 3 && (
                        <span className="px-3 py-1.5 text-slate-400 text-[9px] font-black uppercase tracking-widest">
                            +{shop.specialties.length - 3} more
                        </span>
                    )}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-50">
                    <div className="text-center space-y-1">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Orders</div>
                        <div className="text-sm font-black text-slate-900">{reviews}</div>
                    </div>
                    <div className="text-center space-y-1">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Price</div>
                        <div className="text-sm font-black text-slate-900">
                            {shop.labor_rate > 150 ? '$$$' : shop.labor_rate > 100 ? '$$' : '$'}
                        </div>
                    </div>
                    <div className="text-center space-y-1">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Res. Time</div>
                        <div className="text-sm font-black text-slate-900">N/A</div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-4">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onManageAudit?.();
                        }}
                        className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl active:scale-95"
                    >
                        Manage Audit
                    </button>
                    <button
                        className="p-4 bg-slate-50 text-slate-400 rounded-2xl border border-slate-100 hover:bg-slate-100 transition-all active:scale-95"
                    >
                        <FileText className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ShopCard;
