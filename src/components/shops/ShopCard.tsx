
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
    DollarSign,
    Navigation2,
    Phone,
    Handshake,
    Ban
} from 'lucide-react';
import { Shop, VENDOR_PREFERENCE_CONFIG, VendorPreference } from './types/ShopTypes';
import { formatDistanceToNow } from 'date-fns';

interface ShopCardProps {
    shop: Shop;
    onClick?: () => void;
    onManageAudit?: () => void;
}

const ShopCard: React.FC<ShopCardProps> = ({ shop, onClick, onManageAudit }) => {
    const rating = shop.average_rating || 0;
    const reviews = shop.total_reviews || 0;
    const tierConfig = VENDOR_PREFERENCE_CONFIG[shop.vendor_preference];

    // Real values calculated in ShopsPage
    const totalSpent = shop.total_spent || 0;
    const orderCount = shop.order_count || 0;

    const getTierIcon = (preference: VendorPreference) => {
        switch (preference) {
            case 'PREFERRED': return <Trophy className="w-3 h-3" />;
            case 'PARTNER': return <Handshake className="w-3 h-3" />;
            case 'NEW': return <Star className="w-3 h-3 fill-current" />;
            case 'RESTRICTED': return <Ban className="w-3 h-3" />;
            default: return null;
        }
    };

    return (
        <div
            className="group relative bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden cursor-pointer h-[420px] flex flex-col"
            style={{ borderLeftWidth: '6px', borderLeftColor: tierConfig.borderHex }}
            onClick={onClick}
        >
            <div className="p-6 flex flex-col h-full">
                {/* Header: Tier Badge + Rating + Audits */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        {/* Tier Badge */}
                        <span className={`px-2.5 py-1 rounded-lg ${tierConfig.bgColor} ${tierConfig.textColor} text-[9px] font-black uppercase tracking-widest border flex items-center gap-1.5`}>
                            {getTierIcon(shop.vendor_preference)}
                            {tierConfig.label}
                        </span>
                        {/* New indicator (if created within 30 days) */}
                        {shop.created_at && new Date(shop.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) && shop.vendor_preference !== 'NEW' && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-700 text-[8px] font-black uppercase tracking-widest border border-amber-200">
                                <Sparkles className="w-3 h-3" />
                                New
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Last Used Badge */}
                        {shop.last_used_at && (
                            <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-md">
                                <Clock className="w-3 h-3" />
                                Used {formatDistanceToNow(new Date(shop.last_used_at))} ago
                            </span>
                        )}
                        {/* Audits Count */}
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-md">
                            {reviews} Audits
                        </span>
                    </div>
                </div>

                {/* Shop Identity with Avatar Placeholder */}
                <div className="flex gap-4 mb-4">
                    {/* Placeholder Avatar */}
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 border-2 border-slate-50">
                        <span className="text-xl font-black text-slate-300 uppercase">
                            {shop.shop_name.substring(0, 2)}
                        </span>
                    </div>

                    <div className="space-y-1 overflow-hidden">
                        <h3 className="text-lg font-black text-slate-900 tracking-tight leading-tight group-hover:text-blue-600 transition-colors line-clamp-2">
                            {shop.shop_name}
                        </h3>
                        <div className="flex items-start gap-1.5 text-slate-400">
                            <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                            <p className="text-xs font-bold leading-relaxed line-clamp-2">
                                {shop.address}{shop.city && `, ${shop.city}`}{shop.state && `, ${shop.state}`}{shop.zip ? ` ${shop.zip}` : ''}
                            </p>
                        </div>
                        {/* Star Rating Line */}
                        <div className="flex items-center gap-1 mt-1">
                            {[...Array(5)].map((_, i) => (
                                <Star
                                    key={i}
                                    className={`w-3 h-3 ${i < Math.floor(rating) ? 'text-amber-400 fill-amber-400' : i < rating ? 'text-amber-400 fill-amber-200' : 'text-slate-200'}`}
                                />
                            ))}
                            {rating > 0 && (
                                <span className="ml-1 text-xs font-black text-slate-600">{rating.toFixed(1)}</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Specializations */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                    {shop.specialties?.slice(0, 3).map((spec, i) => (
                        <span key={i} className="px-2.5 py-1 bg-slate-50 text-slate-500 text-[8px] font-black uppercase tracking-widest rounded-md border border-slate-100 whitespace-nowrap">
                            {spec}
                        </span>
                    )) || <span className="px-2.5 py-1 bg-slate-50 text-slate-500 text-[8px] font-black uppercase tracking-widest rounded-md border border-slate-100 italic">General Service</span>}
                    {shop.specialties && shop.specialties.length > 3 && (
                        <span className="px-2.5 py-1 text-slate-400 text-[8px] font-black uppercase tracking-widest">
                            +{shop.specialties.length - 3}
                        </span>
                    )}
                </div>

                {/* Spacer to push content down */}
                <div className="flex-1"></div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-2 py-3 border-t border-slate-100 mb-2">
                    <div className="text-center space-y-0.5">
                        <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Orders</div>
                        <div className="text-sm font-black text-slate-900">{orderCount}</div>
                    </div>
                    <div className="text-center space-y-0.5 border-l border-slate-100">
                        <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Hr Rate</div>
                        <div className="text-sm font-black text-slate-900">
                            {shop.labor_rate ? `$${shop.labor_rate}` : 'N/A'}
                        </div>
                    </div>
                    <div className="text-center space-y-0.5 border-l border-slate-100">
                        <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Spent</div>
                        <div className="text-sm font-black text-slate-900">
                            {totalSpent > 0 ? `$${totalSpent.toLocaleString()}` : '$0'}
                        </div>
                    </div>
                </div>

                {/* Actions - Pushed to bottom */}
                <div className="flex items-center gap-2 pt-2 mt-auto">
                    {/* Map Link Button */}
                    {shop.latitude && shop.longitude && (
                        <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${shop.shop_name} ${shop.address}, ${shop.city || ''} ${shop.state || ''}`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 hover:bg-blue-100 transition-all active:scale-95"
                            title="Open in Maps"
                        >
                            <Navigation2 className="w-4 h-4" />
                        </a>
                    )}

                    {/* Call Button */}
                    {shop.phone && (
                        <a
                            href={`tel:${shop.phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 hover:bg-emerald-100 transition-all active:scale-95"
                            title="Call"
                        >
                            <Phone className="w-4 h-4" />
                        </a>
                    )}

                    {/* View Details Button */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (onManageAudit) {
                                onManageAudit();
                            } else if (onClick) {
                                onClick();
                            }
                        }}
                        className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                    >
                        View Details
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ShopCard;
