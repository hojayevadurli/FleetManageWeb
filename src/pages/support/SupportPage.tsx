import { Card, CardContent } from "@/components/ui/card";
import { Mail } from "lucide-react";

export default function SupportPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
            <div className="bg-blue-50 p-4 rounded-full mb-6 ring-8 ring-blue-50/50">
                <Mail className="w-10 h-10 text-blue-600" />
            </div>

            <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-3">
                Report a Bug / Suggest a Feature / Contact Us
            </h1>

            <p className="text-lg text-slate-600 max-w-2xl leading-relaxed mb-8">
                We’d love to hear your feedback. Please email us at <span className="font-semibold text-slate-900">info@fleetmanage.ai</span> with a description of your issue or idea, and we’ll get back to you promptly.
            </p>

            <Card className="max-w-md w-full border-blue-100 shadow-lg shadow-blue-500/5">
                <CardContent className="p-2">
                    <a
                        href="mailto:info@fleetmanage.ai"
                        className="flex items-center justify-center gap-3 w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all active:scale-[0.98]"
                    >
                        <Mail className="w-5 h-5" />
                        Email info@fleetmanage.ai
                    </a>
                </CardContent>
            </Card>

            <p className="mt-8 text-sm text-slate-400 font-medium tracking-wide uppercase">
                Straightforward Support
            </p>
        </div>
    );
}
