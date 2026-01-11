
import React, { useState, useRef } from 'react';
import { X, Upload, Calendar, Check, AlertCircle, FileText } from 'lucide-react';
import { Warranty } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from "@/components/ui/button";

interface AddWarrantyDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (warranty: Warranty) => void;
}

const AddWarrantyDialog: React.FC<AddWarrantyDialogProps> = ({ open, onOpenChange, onSave }) => {
    const [description, setDescription] = useState('');
    const [provider, setProvider] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [files, setFiles] = useState<{ name: string; url: string; type: string }[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files).map(file => ({
                name: file.name,
                url: URL.createObjectURL(file), // Mock URL
                type: file.type
            }));
            setFiles([...files, ...newFiles]);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newWarranty: Warranty = {
            id: Math.random().toString(36).substr(2, 9),
            description,
            provider,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            status: 'Active', // Default
            files
        };
        onSave(newWarranty);
        onOpenChange(false);
        // Reset form
        setDescription('');
        setProvider('');
        setStartDate('');
        setEndDate('');
        setFiles([]);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl bg-[#F8FAFC] p-0 overflow-hidden border-0 rounded-[2.5rem] max-h-[90vh] flex flex-col">
                <div className="bg-white p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                    <div>
                        <DialogTitle className="text-xl font-black text-slate-900 tracking-tight">Add Warranty Record</DialogTitle>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">Upload docs or enter details for AI analysis</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="rounded-full hover:bg-slate-50">
                        <X className="w-5 h-5 text-slate-400" />
                    </Button>
                </div>

                <div className="p-8 overflow-y-auto custom-scrollbar">
                    <form id="warranty-form" onSubmit={handleSubmit} className="space-y-8">

                        {/* Description & Provider */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Warranty Description / Title</label>
                                <input
                                    required
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="e.g. Powertrain Extended Warranty"
                                    className="w-full px-6 py-4 bg-white border-0 rounded-2xl font-bold text-slate-900 focus:ring-4 focus:ring-blue-500/10 placeholder:font-medium placeholder:text-slate-300 shadow-sm"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Provider / Vendor</label>
                                <input
                                    required
                                    value={provider}
                                    onChange={(e) => setProvider(e.target.value)}
                                    placeholder="e.g. Peterbilt, Penske"
                                    className="w-full px-6 py-4 bg-white border-0 rounded-2xl font-bold text-slate-900 focus:ring-4 focus:ring-blue-500/10 placeholder:font-medium placeholder:text-slate-300 shadow-sm"
                                />
                            </div>
                        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                    <Calendar className="w-3 h-3" /> Start Date
                                </label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full px-6 py-4 bg-white border-0 rounded-2xl font-bold text-slate-900 focus:ring-4 focus:ring-blue-500/10 shadow-sm"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                    <Calendar className="w-3 h-3" /> Expiration Date
                                </label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full px-6 py-4 bg-white border-0 rounded-2xl font-bold text-slate-900 focus:ring-4 focus:ring-blue-500/10 shadow-sm"
                                />
                            </div>
                        </div>

                        {/* File Upload */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Supporting Documents</label>

                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-slate-200 rounded-[2rem] p-10 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 hover:border-blue-300 transition-all group"
                            >
                                <input
                                    type="file"
                                    multiple
                                    className="hidden"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                />
                                <div className="bg-blue-50 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
                                    <Upload className="w-6 h-6 text-blue-600" />
                                </div>
                                <h4 className="font-black text-slate-900 text-sm mb-1">Click to Upload Documents</h4>
                                <p className="text-xs text-slate-400 font-bold">PDF, Images, or Word docs (Max 10MB)</p>
                            </div>

                            {/* File List */}
                            {files.length > 0 && (
                                <div className="space-y-2">
                                    {files.map((file, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-slate-100 p-2 rounded-lg">
                                                    <FileText className="w-4 h-4 text-slate-500" />
                                                </div>
                                                <span className="text-xs font-bold text-slate-700 truncate max-w-[200px]">{file.name}</span>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setFiles(files.filter((_, i) => i !== idx))}
                                                className="h-8 w-8 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full"
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="bg-blue-50 rounded-2xl p-4 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                            <p className="text-xs text-blue-800 font-medium leading-relaxed">
                                <span className="font-black">AI INTELLIGENCE:</span> Any warranty details associated with this unit will be automatically indexed by the AI. You can ask questions like "Is the transmission still under warranty?" or "Show me the policy coverage".
                            </p>
                        </div>

                    </form>
                </div>

                <div className="p-6 bg-white border-t border-slate-100 shrink-0">
                    <Button
                        form="warranty-form"
                        type="submit"
                        size="lg"
                        className="w-full h-auto py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg active:scale-95 flex items-center justify-center gap-2"
                    >
                        <Check className="w-4 h-4" /> Save Warranty & Index
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default AddWarrantyDialog;
