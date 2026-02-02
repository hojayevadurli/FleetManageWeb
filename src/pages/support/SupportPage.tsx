import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MessageSquare, Phone } from "lucide-react";
import { toast } from "sonner";

export default function SupportPage() {
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        toast.success("Support ticket created! We'll be in touch shortly.");
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto py-8 px-4">
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Help & Support</h1>
                <p className="text-slate-500 mt-2">Get in touch with our team or browse common questions.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Mail className="w-5 h-5 text-blue-600" />
                                Contact Support
                            </CardTitle>
                            <CardDescription>
                                Reach out to our support team directly.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-slate-200">
                                    <Mail className="w-5 h-5 text-slate-600" />
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-slate-900">Email Us</div>
                                    <a href="mailto:support@fleetmanage.ai" className="text-sm text-blue-600 hover:underline">
                                        support@fleetmanage.ai
                                    </a>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-slate-200">
                                    <Phone className="w-5 h-5 text-slate-600" />
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-slate-900">Call Us</div>
                                    <a href="tel:+12245661515" className="text-sm text-blue-600 hover:underline">
                                        +1 (224) 566-1515
                                    </a>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Documentation</CardTitle>
                            <CardDescription>Browse our guides and tutorials.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button variant="outline" className="w-full justify-start" asChild>
                                <a href="#" className="flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4" />
                                    View Knowledge Base
                                </a>
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Send us a Message</CardTitle>
                        <CardDescription>
                            Fill out the form below and we'll get back to you within 24 hours.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid gap-2">
                                <label className="text-sm font-medium text-slate-700">Subject</label>
                                <Input placeholder="What can we help you with?" required />
                            </div>

                            <div className="grid gap-2">
                                <label className="text-sm font-medium text-slate-700">Details</label>
                                <Textarea
                                    placeholder="Please describe your issue in detail..."
                                    className="min-h-[150px]"
                                    required
                                />
                            </div>

                            <div className="pt-2">
                                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                                    Submit Request
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
