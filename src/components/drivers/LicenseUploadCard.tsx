import { useState, useRef, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Upload, X, FileText, Loader2, Sparkles, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface LicenseUploadCardProps {
    onFilesChange: (front: File | null, back: File | null) => void;
    onParse: () => void;
    isParsing: boolean;
    aiFilledCount?: number;
}

export function LicenseUploadCard({ onFilesChange, onParse, isParsing, aiFilledCount = 0 }: LicenseUploadCardProps) {
    const [frontFile, setFrontFile] = useState<File | null>(null);
    const [backFile, setBackFile] = useState<File | null>(null);
    const [parseClicked, setParsingClicked] = useState(false);
    const [parsingComplete, setParsingComplete] = useState(false);

    const frontInputRef = useRef<HTMLInputElement>(null);
    const backInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validation
        const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
        if (!validTypes.includes(file.type)) {
            toast.error("Invalid file type. Please upload JPG, PNG, or PDF.");
            return;
        }

        if (file.size > 10 * 1024 * 1024) { // 10MB
            toast.error("File is too large. Max 10MB.");
            return;
        }

        if (side === 'front') {
            setFrontFile(file);
            onFilesChange(file, backFile);
        } else {
            setBackFile(file);
            onFilesChange(frontFile, file);
        }
    };

    const handleClear = () => {
        setFrontFile(null);
        setBackFile(null);
        setParsingClicked(false);
        onFilesChange(null, null);
        if (frontInputRef.current) frontInputRef.current.value = "";
        if (backInputRef.current) backInputRef.current.value = "";
    };

    const handleRemove = (side: 'front' | 'back') => {
        if (side === 'front') {
            setFrontFile(null);
            setParsingClicked(false);
            onFilesChange(null, backFile);
            if (frontInputRef.current) frontInputRef.current.value = "";
        } else {
            setBackFile(null);
            onFilesChange(frontFile, null);
            if (backInputRef.current) backInputRef.current.value = "";
        }
    };
    return (
        <Card className="border-blue-100 bg-blue-50/30 overflow-hidden">
            {/* Step Indicator */}
            <div className="bg-blue-100/50 border-b border-blue-200/50 px-6 py-2 flex items-center gap-4 text-xs font-semibold text-blue-800">
                <div className={cn("flex items-center gap-1", frontFile ? "opacity-50" : "opacity-100")}>
                    <span className="bg-blue-200 text-blue-700 px-1.5 rounded-full">1</span> Upload
                </div>
                <div className="h-px w-4 bg-blue-300"></div>
                <div className={cn("flex items-center gap-1", frontFile && !parseClicked ? "text-blue-700 scale-105 transition-transform" : "opacity-50")}>
                    <span className={cn("px-1.5 rounded-full", frontFile && !parseClicked ? "bg-blue-600 text-white animate-pulse" : "bg-blue-200 text-blue-700")}>2</span> Parse
                </div>
                <div className="h-px w-4 bg-blue-300"></div>
                <div className={cn("flex items-center gap-1", parseClicked && !isParsing ? "text-blue-700" : "opacity-50")}>
                    <span className="bg-blue-200 text-blue-700 px-1.5 rounded-full">3</span> Review
                </div>
            </div>

            <CardHeader className="pb-3 pt-4 border-b border-blue-100/50">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-lg flex items-center gap-2 text-blue-900">
                            <Sparkles className="h-4 w-4 text-blue-600" />
                            AI Parse (Driver License)
                        </CardTitle>
                        <CardDescription className="text-blue-700/80 mt-1">
                            Use AI to auto-fill driver details from the license image.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
                {/* Upload Slots */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Front (Required) */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 flex justify-between">
                            <span>Driver License — Front <span className="text-red-500">*</span></span>
                            {frontFile && (
                                <button onClick={() => handleRemove('front')} className="text-xs text-red-500 hover:underline">Remove</button>
                            )}
                        </label>
                        <div
                            onClick={() => frontInputRef.current?.click()}
                            className={cn(
                                "border-2 border-dashed rounded-lg p-4 transition-all cursor-pointer flex items-center justify-center gap-3 h-24 relative overflow-hidden",
                                frontFile
                                    ? "border-emerald-300 bg-emerald-50/50"
                                    : "border-gray-200 hover:border-blue-400 hover:bg-white bg-white/50"
                            )}
                        >
                            <input
                                ref={frontInputRef}
                                type="file"
                                className="hidden"
                                accept=".jpg,.jpeg,.png,.pdf"
                                onChange={(e) => handleFileChange(e, 'front')}
                            />
                            {frontFile ? (
                                <>
                                    <div className="bg-emerald-100 p-2 rounded-full text-emerald-600">
                                        <FileText className="h-5 w-5" />
                                    </div>
                                    <div className="text-sm text-emerald-800 font-medium truncate max-w-[200px] z-10">
                                        {frontFile.name}
                                    </div>
                                    <div className="absolute inset-0 bg-emerald-50/20 pointer-events-none" />
                                </>
                            ) : (
                                <>
                                    <div className="bg-gray-100 p-2 rounded-full text-gray-400">
                                        <Upload className="h-5 w-5" />
                                    </div>
                                    <span className="text-sm text-gray-500">Front (Required)</span>
                                </>
                            )}
                        </div>
                        {frontFile && !parsingComplete && !isParsing && (
                            <p className="text-xs text-blue-600 font-medium animate-in fade-in slide-in-from-top-1">
                                Ready to parse. Click the button below.
                            </p>
                        )}
                    </div>

                    {/* Back (Optional) */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 flex justify-between">
                            <span>Back <span className="text-gray-400 font-normal">(Optional)</span></span>
                            {backFile && (
                                <button onClick={() => handleRemove('back')} className="text-xs text-red-500 hover:underline">Remove</button>
                            )}
                        </label>
                        <div
                            onClick={() => backInputRef.current?.click()}
                            className={cn(
                                "border-2 border-dashed rounded-lg p-4 transition-all cursor-pointer flex items-center justify-center gap-3 h-24",
                                backFile
                                    ? "border-emerald-300 bg-emerald-50/50"
                                    : "border-gray-200 hover:border-blue-400 hover:bg-white bg-white/50"
                            )}
                        >
                            <input
                                ref={backInputRef}
                                type="file"
                                className="hidden"
                                accept=".jpg,.jpeg,.png,.pdf"
                                onChange={(e) => handleFileChange(e, 'back')}
                            />
                            {backFile ? (
                                <>
                                    <div className="bg-emerald-100 p-2 rounded-full text-emerald-600">
                                        <FileText className="h-5 w-5" />
                                    </div>
                                    <div className="text-sm text-emerald-800 font-medium truncate max-w-[200px]">
                                        {backFile.name}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="bg-gray-100 p-2 rounded-full text-gray-400">
                                        <Upload className="h-5 w-5" />
                                    </div>
                                    <span className="text-sm text-gray-500">Back (Optional)</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Primary Action Zone */}
                {frontFile && (
                    <div className="flex flex-col items-center gap-3 pt-2 bg-white/50 rounded-lg p-4 border border-blue-100">
                        {isParsing ? (
                            <Button disabled className="w-full md:w-auto min-w-[200px] bg-blue-100 text-blue-700">
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Extracting Data...
                            </Button>
                        ) : !parseClicked ? (
                            <div className="flex flex-col items-center gap-2">
                                <Button
                                    onClick={() => {
                                        setParsingClicked(true);
                                        onParse();
                                    }}
                                    className="w-full md:w-auto min-w-[240px] bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30 text-base py-6 relative overflow-hidden group"
                                >
                                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                    <span className="relative flex items-center gap-2">
                                        <Sparkles className="h-5 w-5 animate-pulse" />
                                        Parse Driver License
                                    </span>
                                </Button>
                                <p className="text-xs text-gray-500">
                                    Front uploaded — click Parse to auto-fill fields.
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-2 w-full animate-in fade-in">
                                <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 px-3 py-2 rounded-md text-sm font-medium border border-emerald-100 w-full justify-center">
                                    <Sparkles className="h-4 w-4" />
                                    Success! AI filled {aiFilledCount} fields.
                                </div>
                                <p className="text-xs text-emerald-600/80">Please review the fields below before saving.</p>
                                <Button variant="ghost" size="sm" onClick={handleClear} className="text-gray-400 hover:text-red-500 h-auto p-1 text-xs">
                                    Reset / Upload Different File
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
