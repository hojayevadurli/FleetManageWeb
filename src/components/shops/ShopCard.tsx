
import React from 'react';
import {
    Star,
    MapPin,
    ShieldCheck,
    Trophy,
    Clock,
    FileText,
    ChevronRight,
    Sparkles,
    DollarSign
} from 'lucide-react';
import { Shop } from './types/ShopTypes';

interface ShopCardProps {
    shop: Shop;
    onClick?: () => void;
    onManageAudit?: () => void;
}

// Get tier config based on rate_category
const getTierConfig = (category: string) => {
    switch (category) {
        case 'purple':
            return { label: 'New', borderHex: '#8b5cf6', textColor: 'text-violet-700', bgColor: 'bg-violet-50' };
        case 'blue':
            return { label: 'Partner', borderHex: '#3b82f6', textColor: 'text-blue-700', bgColor: 'bg-blue-50' };
        case 'green':
            return { label: 'Preferred', borderHex: '#10b981', textColor: 'text-emerald-700', bgColor: 'bg-emerald-50' };
        case 'orange':
            return { label: 'Standard', borderHex: '#f97316', textColor: 'text-orange-700', bgColor: 'bg-orange-50' };
        case 'red':
            return { label: 'Restricted', borderHex: '#f43f5e', textColor: 'text-rose-700', bgColor: 'bg-rose-50' };
        default:
            return { label: 'Standard', borderHex: '#f97316', textColor: 'text-orange-700', bgColor: 'bg-orange-50' };
    }
};

const ShopCard: React.FC<ShopCardProps> = ({ shop, onClick, onManageAudit }) => {
    const rating = shop.average_rating || 0;
    const reviews = shop.total_reviews || 0;
    const tierConfig = getTierConfig(shop.rate_category);

    // Placeholder values - these would come from real data
    const totalSpent = 0; // Would be calculated from work orders
    const orderCount = reviews; // Using reviews as proxy for orders

    return (
        <div
            className="group relative bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden cursor-pointer"
            style={{ borderLeftWidth: '6px', borderLeftColor: tierConfig.borderHex }}
            onClick={onClick}
        >
            <div className="p-6 space-y-5">
                {/* Header: Tier Badge + Rating + Audits */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {/* Tier Badge */}
                        <span className={`px-2.5 py-1 rounded-lg ${tierConfig.bgColor} ${tierConfig.textColor} text-[9px] font-black uppercase tracking-widest border`}>
                            {tierConfig.label}
                        </span>
                        {/* New indicator (if created within 30 days) */}
                        {shop.created_at && new Date(shop.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) && shop.rate_category !== 'purple' && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-700 text-[8px] font-black uppercase tracking-widest border border-amber-200">
                                <Sparkles className="w-3 h-3" />
                                New
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Star Rating */}
                        <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                                <Star
                                    key={i}
                                    className={`w-3.5 h-3.5 ${i < Math.floor(rating) ? 'text-amber-400 fill-amber-400' : i < rating ? 'text-amber-400 fill-amber-200' : 'text-slate-200'}`}
                                />
                            ))}
                            {rating > 0 && (
                                <span className="ml-1 text-xs font-black text-slate-600">{rating.toFixed(1)}</span>
                            )}
                        </div>
                        {/* Audits Count */}
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-md">
                            {reviews} Audits
                        </span>
                    </div>
                </div>

                {/* Shop Identity */}
                <div className="space-y-2">
                    <h3 className="text-xl font-black text-slate-900 tracking-tight leading-tight group-hover:text-blue-600 transition-colors">
                        {shop.shop_name}
                    </h3>
                    <div className="flex items-start gap-2 text-slate-400">
                        <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <p className="text-xs font-bold leading-relaxed">
                            {shop.address}{shop.city && `, ${shop.city}`}{shop.state && `, ${shop.state}`}
                        </p>
                    </div>
                </div>

                {/* Specializations */}
                <div className="flex flex-wrap gap-1.5">
                    {shop.specialties?.slice(0, 3).map((spec, i) => (
                        <span key={i} className="px-2.5 py-1 bg-slate-50 text-slate-500 text-[8px] font-black uppercase tracking-widest rounded-md border border-slate-100">
                            {spec}
                        </span>
                    )) || <span className="px-2.5 py-1 bg-slate-50 text-slate-500 text-[8px] font-black uppercase tracking-widest rounded-md border border-slate-100 italic">General Service</span>}
                    {shop.specialties && shop.specialties.length > 3 && (
                        <span className="px-2.5 py-1 text-slate-400 text-[8px] font-black uppercase tracking-widest">
                            +{shop.specialties.length - 3}
                        </span>
                    )}
                </div>

                {/* Stats Grid - Enhanced */}
                <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-100">
                    <div className="text-center space-y-0.5 p-2 bg-slate-50 rounded-xl">
                        <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Orders</div>
                        <div className="text-sm font-black text-slate-900">{orderCount}</div>
                    </div>
                    <div className="text-center space-y-0.5 p-2 bg-slate-50 rounded-xl">
                        <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Hr Rate</div>
                        <div className="text-sm font-black text-slate-900">
                            {shop.labor_rate ? `$${shop.labor_rate}` : 'N/A'}
                        </div>
                    </div>
                    <div className="text-center space-y-0.5 p-2 bg-slate-50 rounded-xl">
                        <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Spent</div>
                        <div className="text-sm font-black text-slate-900">
                            {totalSpent > 0 ? `$${totalSpent.toLocaleString()}` : '$0'}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (onManageAudit) {
                                onManageAudit();
                            } else if (onClick) {
                                onClick();
                            }
                        }}
                        className="flex-1 py-3.5 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                    >
                        View Details
                        <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                        onClick={(e) => e.stopPropagation()}
                        className="p-3.5 bg-slate-50 text-slate-400 rounded-xl border border-slate-100 hover:bg-slate-100 hover:text-slate-600 transition-all active:scale-95"
                    >
                        <FileText className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ShopCard;
