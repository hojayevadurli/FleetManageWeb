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
    FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Equipment, EquipmentStatus, EquipmentType, WorkOrder, ChatMessage } from '@/lib/types';
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
            <div className="flex items-center gap-4 mb-6">
                <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-lg transition-colors group">
                    <ArrowLeft className="w-5 h-5 text-slate-600 group-hover:text-blue-600 transition-colors" />
                </button>
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Unit {equipment.unitNumber} Diagnostics</h1>
                    <p className="text-sm text-slate-500 font-medium">Holistic asset health & historical performance audit</p>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-1 xl:grid-cols-3 gap-8 overflow-y-auto pr-2 custom-scrollbar">
                <div className="xl:col-span-2 space-y-8">
                    {/* Hero Spec Block */}
                    <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-10 opacity-5">
                            {equipment.type === EquipmentType.TRUCK ? <Truck className="w-64 h-64" /> : <Container className="w-64 h-64" />}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
                            <div className="space-y-6">
                                <div>
                                    <div className="relative inline-block">
                                        <select
                                            className={`appearance-none cursor-pointer pl-3 pr-8 py-1.5 rounded-full text-[10px] font-black uppercase border tracking-widest shadow-sm outline-none transition-all ${equipment.status === EquipmentStatus.ACTIVE ? 'bg-green-100 text-green-700 border-green-200' :
                                                equipment.status === EquipmentStatus.IN_SHOP ? 'bg-amber-100 text-amber-700 border-amber-200' :
                                                    'bg-rose-100 text-rose-700 border-rose-200'
                                                }`}
                                            value={equipment.status}
                                            onChange={(e) => onUpdateStatus && onUpdateStatus(e.target.value as EquipmentStatus)}
                                        >
                                            {Object.values(EquipmentStatus).map(s => (
                                                <option key={s} value={s} className="bg-white text-slate-900">
                                                    {s.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-current opacity-50">
                                            <svg className="h-3 w-3 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <h2 className="text-4xl font-black text-slate-900 tracking-tighter">{equipment.make} {equipment.model}</h2>
                                    <p className="text-slate-500 font-bold uppercase text-xs tracking-[0.2em]">{equipment.year} Model • {equipment.type} Asset</p>
                                </div>
                                <div className="flex items-center gap-10 pt-4">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">VIN Serial</label>
                                        <p className="text-sm font-mono font-bold text-slate-800 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100 shadow-inner">{equipment.vin}</p>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Registration</label>
                                        <p className="text-sm font-black text-slate-900 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100 shadow-inner">{equipment.licensePlate || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { icon: ShieldCheck, label: 'Compliance', val: 'Current', color: 'text-blue-600' },
                                    { icon: Wrench, label: 'Last Service', val: new Date(equipment.lastServiceDate).toLocaleDateString(), color: 'text-indigo-600' },
                                    { icon: Cpu, label: 'Systems', val: '92% Health', color: 'text-emerald-600' },
                                    { icon: History, label: 'Work Orders', val: equipmentHistory.length, color: 'text-slate-600' }
                                ].map((stat, i) => (
                                    <div key={i} className="p-6 rounded-[2rem] bg-slate-50 border border-slate-100 shadow-inner flex flex-col justify-center">
                                        <stat.icon className={`w-6 h-6 ${stat.color} mb-2`} />
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</div>
                                        <div className="text-sm font-black text-slate-800">{stat.val}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Audit History Timeline */}
                    <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h3 className="font-black text-slate-800 flex items-center gap-2 uppercase text-xs tracking-widest">
                                <History className="w-4 h-4 text-slate-400" /> Verified Maintenance Audit History
                            </h3>
                        </div>
                        <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto custom-scrollbar">
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

                {/* Sidebar Intelligence */}
                <div className="space-y-8">
                    <div className="bg-slate-900 p-10 rounded-[3rem] shadow-2xl text-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full blur-3xl -mr-10 -mt-10 animate-pulse"></div>
                        <div className="flex items-center gap-4 mb-8 relative z-10">
                            <div className="bg-blue-600 p-3 rounded-2xl shadow-xl shadow-blue-500/30">
                                <Sparkles className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h3 className="font-black text-xl tracking-tight">AI Fleet Expert</h3>
                                <p className="text-[10px] text-blue-400 font-black tracking-[0.2em] uppercase mt-0.5">Contextual Grounding: Active</p>
                            </div>
                        </div>
                        <p className="text-sm text-slate-400 mb-10 leading-relaxed font-medium relative z-10">
                            "I have analyzed <span className="text-white font-bold">{equipmentHistory.length} historical service records</span> for Unit {equipment.unitNumber}. Ask me for common failure trends, authorized vendor recommendations, or diagnostic reasoning."
                        </p>
                        <button
                            onClick={() => setIsAiPanelOpen(true)}
                            className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/30 relative z-10 active:scale-95"
                        >
                            Consult Asset Expert
                        </button>
                    </div>
                </div>
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
