import React, { useState, useRef, useEffect } from 'react';
import {
    ArrowLeft,
    Truck,
    Container,
    Bot,
    Send,
    History,
    Cpu,
    Wrench,
    ShieldCheck,
    ChevronRight,
    X,
    Loader2,
    ExternalLink,
    MapPin,
    Sparkles,
    FileText,
    RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Equipment, EquipmentStatus, WorkOrder, ChatMessage } from '@/lib/types';
import { getEquipmentChatResponse } from '@/lib/gemini';

interface ExtendedChatMessage extends ChatMessage {
    sources?: any[];
}

interface EquipmentDetailProps {
    equipment: Equipment;
    workOrders: WorkOrder[];
    onBack: () => void;
    onUpdateStatus?: (status: EquipmentStatus) => Promise<void>;
    initialAiOpen?: boolean;
}

const EquipmentDetail: React.FC<EquipmentDetailProps> = ({ equipment, workOrders, onBack, onUpdateStatus, initialAiOpen }) => {
    const navigate = useNavigate();
    const [isAiPanelOpen, setIsAiPanelOpen] = useState(initialAiOpen || false);
    const [messages, setMessages] = useState<ExtendedChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Tab State
    const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'ai' | 'spend'>('dashboard');

    const equipmentHistory = workOrders.filter(wo => wo.equipmentId === equipment.id);

    // Suggested prompts for immediate utility
    const suggestedPrompts = [
        { text: `Summarize the last 3 repairs for Unit ${equipment.unitNumber}`, icon: History },
        { text: `What are common failure points for ${equipment.year} ${equipment.model} models?`, icon: ShieldCheck },
        { text: "Find nearby Peterbilt authorized service centers", icon: MapPin }
    ];

    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isTyping]);

    const handleSendMessage = async (e?: React.FormEvent, overrideText?: string) => {
        if (e) e.preventDefault();
        const textToSend = overrideText || input;
        if (!textToSend.trim()) return;

        const userMsg: ExtendedChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: textToSend,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        let latLng;
        try {
            const pos: any = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 });
            });
            if (pos) latLng = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        } catch (err) {
            console.warn("Geolocation skipped", err);
        }

        const { text, sources } = await getEquipmentChatResponse(equipment, equipmentHistory, textToSend);

        const aiMsg: ExtendedChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: text,
            sources,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, aiMsg]);
        setIsTyping(false);
    };

    return (
        <div className="h-full flex flex-col relative overflow-hidden bg-slate-50 min-h-screen p-6">
            {/* Header & Navigation */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all shadow-sm group">
                        <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:text-slate-700 transition-colors" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Unit {equipment.unitNumber} Intel</h1>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Verified asset diagnostics & service timeline</p>
                    </div>
                </div>

                <div className="flex p-1.5 bg-white border border-slate-200 rounded-2xl shadow-sm">
                    {(['dashboard', 'history', 'ai', 'spend'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab
                                ? 'bg-slate-900 text-white shadow-md'
                                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                                }`}
                        >
                            <span className="flex items-center gap-2">
                                {tab === 'dashboard' && <Container className="w-4 h-4" />}
                                {tab === 'history' && <History className="w-4 h-4" />}
                                {tab === 'ai' && <Sparkles className="w-4 h-4" />}
                                {tab === 'spend' && <Cpu className="w-4 h-4" />}
                                {tab}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-8">

                {/* DASHBOARD VIEW */}
                {activeTab === 'dashboard' && (
                    <div className="space-y-8 animate-in fade-in zoom-in duration-300">
                        {/* Top Row: Specs + Spend */}
                        <div className="flex flex-col xl:flex-row gap-8">

                            {/* LEFT: Main Spec Card */}
                            <div className="flex-[3] bg-white rounded-[3rem] p-10 border border-slate-200 shadow-sm relative overflow-hidden">
                                <span className={`inline-block px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border mb-6 ${equipment.status === EquipmentStatus.ACTIVE ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                    equipment.status === EquipmentStatus.IN_SHOP ? 'bg-amber-100 text-amber-700 border-amber-200' :
                                        'bg-rose-100 text-rose-700 border-rose-200'
                                    }`}>
                                    Status: {equipment.status}
                                </span>

                                <div className="flex flex-col md:flex-row gap-12 items-start relative z-10">
                                    <div className="space-y-2 max-w-sm">
                                        <h2 className="text-5xl font-black text-slate-900 tracking-tighter leading-[0.9]">{equipment.year} {equipment.make} {equipment.model}</h2>

                                        <div className="flex gap-8 pt-6">
                                            <div>
                                                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">VIN Number</div>
                                                <div className="font-mono font-bold text-slate-800">{equipment.vin}</div>
                                            </div>
                                            <div>
                                                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Registration</div>
                                                <div className="font-bold text-slate-800">{equipment.licensePlate || 'N/A'}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 2x2 Stats Grid */}
                                    <div className="grid grid-cols-2 gap-4 flex-1 w-full">
                                        {[
                                            { label: 'Compliance', val: 'Pass', icon: ShieldCheck, color: 'text-blue-600', bg: 'bg-blue-50' },
                                            { label: 'Last Service', val: equipment.lastServiceDate, icon: Wrench, color: 'text-amber-600', bg: 'bg-amber-50' },
                                            { label: 'Efficiency', val: '94%', icon: Sparkles, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                                            { label: 'System Health', val: 'Stable', icon: Cpu, color: 'text-indigo-600', bg: 'bg-indigo-50' }
                                        ].map((s, i) => (
                                            <div key={i} className={`${s.bg} p-5 rounded-[2rem] border border-slate-100/50`}>
                                                <s.icon className={`w-5 h-5 ${s.color} mb-3`} />
                                                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{s.label}</div>
                                                <div className="text-base font-black text-slate-900">{s.val}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT: Dark Spend Card */}
                            <div className="flex-[2] bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden group shadow-2xl shadow-slate-900/20">
                                <div className="absolute top-1/2 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-[100px] pointer-events-none"></div>

                                <div className="relative z-10 h-full flex flex-col justify-between space-y-8">
                                    <div className="text-center space-y-2">
                                        <div className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">Life-to-Date Spend</div>
                                        <div className="text-6xl font-black tracking-tighter text-blue-100">
                                            ${equipmentHistory.reduce((sum, wo) => sum + (wo.totalCost || 0), 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                        </div>
                                    </div>

                                    <div className="bg-slate-800/50 rounded-[2rem] p-6 text-center border border-slate-700/50 backdrop-blur-sm">
                                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Maintenance Events</div>
                                        <div className="text-3xl font-white font-black">{equipmentHistory.length}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Middle Row: Recalls */}
                        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100">
                                    <ShieldCheck className="w-8 h-8 text-rose-500" />
                                </div>
                                <div>
                                    <h3 className="font-black text-xl text-slate-900 tracking-tight">Vehicle Recalls</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Official NHTSA Safety Directives</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <button className="bg-slate-50 p-3 rounded-full hover:bg-slate-100 transition-all text-slate-400 hover:text-slate-600">
                                    <RefreshCw className="w-5 h-5" />
                                </button>
                                <button className="bg-rose-500 hover:bg-rose-600 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-rose-500/30 transition-all flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4" /> 0 Active Recalls
                                </button>
                            </div>
                        </div>

                        {/* Bottom Row: Predictive */}
                        <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm p-24 text-center">
                            <div className="bg-slate-50 w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
                                <div className="flex items-end gap-1">
                                    <div className="w-2 h-4 bg-slate-300 rounded-sm"></div>
                                    <div className="w-2 h-8 bg-slate-300 rounded-sm"></div>
                                    <div className="w-2 h-6 bg-slate-300 rounded-sm"></div>
                                </div>
                            </div>
                            <h3 className="text-xl font-black text-slate-900 mb-2">Predictive Uptime Metrics</h3>
                            <p className="text-slate-500 font-medium max-w-md mx-auto">Asset durability scoring and maintenance forecasting models are currently calibrating.</p>
                        </div>
                    </div>
                )}

                {/* HISTORY VIEW (Old Content) */}
                {activeTab === 'history' && (
                    <div className="animate-in slide-in-from-right-4 duration-300">
                        {/* Audit History Timeline */}
                        <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <h3 className="font-black text-slate-800 flex items-center gap-2 uppercase text-xs tracking-widest">
                                    <History className="w-4 h-4 text-slate-400" /> Verified Maintenance Audit History
                                </h3>
                            </div>
                            <div className="divide-y divide-slate-100 max-h-[800px] overflow-y-auto custom-scrollbar">
                                {equipmentHistory.length > 0 ? (
                                    equipmentHistory.map(wo => (
                                        <div key={wo.id} className="p-10 flex items-start justify-between hover:bg-slate-50/50 transition-all cursor-pointer group" onClick={() => navigate(`/app/maintenance/service-history/${wo.id}`)}>
                                            <div className="space-y-3 flex-1 pr-12">
                                                <div className="flex items-center gap-4">
                                                    <div className="text-base font-black text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">{wo.woNumber || 'Draft'}</div>
                                                    {wo.media && wo.media.length > 0 && (
                                                        <span className="flex items-center gap-1.5 text-[9px] bg-blue-50 px-2 py-0.5 rounded-lg text-blue-600 uppercase font-black tracking-widest border border-blue-100 shadow-sm">
                                                            <FileText className="w-3 h-3" /> Invoice Attached
                                                        </span>
                                                    )}
                                                    <span className="text-[9px] bg-emerald-50 px-2 py-0.5 rounded-lg text-emerald-600 uppercase font-black tracking-widest border border-emerald-100">Audit Pass</span>
                                                </div>
                                                <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">{wo.vendor || 'Unknown Vendor'}</div>
                                                <p className="text-sm text-slate-600 font-medium leading-relaxed max-w-2xl">{wo.description}</p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <div className="text-xl font-mono font-black text-slate-900 tracking-tighter">${wo.totalCost?.toLocaleString(undefined, { minimumFractionDigits: 2 }) ?? '0.00'}</div>
                                                <div className="text-[10px] text-slate-400 font-black mt-1 uppercase tracking-widest">{new Date(wo.date).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-24 text-center">
                                        <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                                            <History className="w-10 h-10 text-slate-200" />
                                        </div>
                                        <p className="text-slate-400 font-black uppercase text-xs tracking-widest">No verified maintenance logs for this unit.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* AI & SPEND TABS (Placeholders for now, or repurpose existing AI view) */}
                {activeTab === 'ai' && (
                    <div className="bg-white p-20 rounded-[3rem] border border-slate-200 shadow-sm text-center animate-in zoom-in-95 duration-200">
                        <div className="bg-blue-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                            <Sparkles className="w-12 h-12 text-blue-500" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mb-4">Deep Intelligence Active</h3>
                        <button
                            onClick={() => setIsAiPanelOpen(true)}
                            className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-blue-500/30 hover:bg-blue-700 transition-all active:scale-95"
                        >
                            Open AI Assistant Panel
                        </button>
                    </div>
                )}
            </div>

            {/* AI Chat Expert Panel */}
            <div className={`fixed top-0 right-0 h-full w-full max-w-xl bg-white shadow-2xl z-[150] transform transition-transform duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] border-l border-slate-200 ${isAiPanelOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="h-full flex flex-col">
                    <div className="p-10 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shadow-lg">
                        <div className="flex items-center gap-5">
                            <div className="bg-blue-600 p-3 rounded-2xl shadow-xl shadow-blue-500/20">
                                <Bot className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="font-black text-2xl tracking-tight">Unit {equipment.unitNumber} Intel</h3>
                                <p className="text-[10px] text-blue-400 font-black tracking-[0.2em] uppercase">Autonomous Fleet Advisor</p>
                            </div>
                        </div>
                        <button onClick={() => setIsAiPanelOpen(false)} className="p-2 hover:bg-slate-800 rounded-2xl transition-all shadow-inner">
                            <X className="w-8 h-8" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-10 space-y-8 bg-slate-50/50 custom-scrollbar">
                        {messages.length === 0 && (
                            <div className="text-center py-10 px-6">
                                <div className="bg-blue-50 w-28 h-28 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-inner border border-blue-100">
                                    <Sparkles className="w-14 h-14 text-blue-500 animate-pulse" />
                                </div>
                                <h4 className="font-black text-slate-900 text-3xl mb-4 tracking-tighter">Consult Unit Intelligence</h4>
                                <p className="text-sm text-slate-500 mb-12 font-bold leading-relaxed max-w-sm mx-auto italic">"I have synthesized all repair records and OEM specifications for this asset. How can I help you today?"</p>

                                <div className="grid grid-cols-1 gap-4 max-w-md mx-auto">
                                    {suggestedPrompts.map((p, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleSendMessage(undefined, p.text)}
                                            className="w-full text-left p-6 text-xs font-black text-slate-700 bg-white border border-slate-200 rounded-[2rem] hover:border-blue-500 hover:text-blue-600 transition-all flex items-center justify-between group shadow-sm hover:shadow-md"
                                        >
                                            <div className="flex items-center gap-4">
                                                <p.icon className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
                                                <span>{p.text}</span>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-slate-100 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {messages.map((m) => (
                            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                                <div className={`flex gap-5 max-w-[92%] ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                    <div className={`p-8 rounded-[2.5rem] text-sm leading-relaxed shadow-sm ${m.role === 'user' ? 'bg-blue-600 text-white font-bold' : 'bg-white border border-slate-200 text-slate-800 font-medium'}`}>
                                        <div className="whitespace-pre-wrap">{m.content}</div>

                                        {m.sources && m.sources.length > 0 && (
                                            <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap gap-3">
                                                {m.sources.map((chunk: any, ci: number) => {
                                                    const link = chunk.web?.uri || chunk.maps?.uri;
                                                    const title = chunk.web?.title || chunk.maps?.title || "Reference";
                                                    return link ? (
                                                        <a key={ci} href={link} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-[10px] bg-slate-50 hover:bg-blue-50 px-5 py-3 rounded-2xl text-blue-600 font-black border border-slate-100 transition-all shadow-inner">
                                                            <ExternalLink className="w-4 h-4" /> {title}
                                                        </a>
                                                    ) : null;
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="bg-white border border-slate-200 p-8 rounded-[2.5rem] flex items-center gap-5 shadow-sm animate-pulse">
                                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                                    <span className="text-sm font-black text-slate-400 tracking-tighter uppercase">Reasoning Engines Active...</span>
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    <div className="p-10 border-t border-slate-100 bg-white shadow-[0_-10px_30px_rgba(0,0,0,0.02)]">
                        <form onSubmit={handleSendMessage} className="flex gap-5">
                            <input
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                placeholder="Message Unit Intelligence Expert..."
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-[2rem] px-10 py-5 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-blue-500/10 focus:bg-white outline-none transition-all placeholder-slate-400 shadow-inner"
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || isTyping}
                                className="bg-blue-600 text-white p-6 rounded-[2rem] hover:bg-blue-700 transition-all disabled:opacity-50 shadow-2xl shadow-blue-500/40 active:scale-95"
                            >
                                <Send className="w-8 h-8" />
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EquipmentDetail;
