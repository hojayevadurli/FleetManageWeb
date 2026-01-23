import PageLayout from "@/components/landing/PageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MapPin, Phone } from "lucide-react";

const Contact = () => {
    return (
        <PageLayout
            title="Contact Us"
            description="Have questions? We'd love to hear from you."
        >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Contact Form */}
                <div className="bg-[#1E2536] p-8 rounded-2xl border border-white/5 shadow-xl">
                    <h2 className="text-xl font-bold text-white mb-6">Send us a message</h2>
                    <form className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">First Name</label>
                                <Input className="bg-[#0F172A] border-white/10 text-white focus:border-[#4F7CFF]" placeholder="John" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Last Name</label>
                                <Input className="bg-[#0F172A] border-white/10 text-white focus:border-[#4F7CFF]" placeholder="Doe" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Email</label>
                            <Input className="bg-[#0F172A] border-white/10 text-white focus:border-[#4F7CFF]" placeholder="john@example.com" type="email" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Message</label>
                            <Textarea className="bg-[#0F172A] border-white/10 text-white focus:border-[#4F7CFF] min-h-[150px]" placeholder="How can we help you?" />
                        </div>

                        <Button className="w-full h-12 bg-[#4F7CFF] hover:bg-[#4F7CFF]/90 font-bold text-white">
                            Send Message
                        </Button>
                    </form>
                </div>

                {/* Contact Info */}
                <div className="space-y-8">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-6">Get in touch</h2>
                        <p className="text-slate-400 leading-relaxed mb-8">
                            Whether you have questions about our AI features, pricing, or need technical support,
                            our team is ready to assist you.
                        </p>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-start gap-4 p-4 bg-[#1E2536] rounded-xl border border-white/5">
                            <div className="bg-[#4F7CFF]/20 p-3 rounded-lg">
                                <Mail className="w-6 h-6 text-[#4F7CFF]" />
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-lg mb-1">Email</h3>
                                <p className="text-slate-400 text-sm">support@fleetmanage.ai</p>
                                <p className="text-slate-400 text-sm">sales@fleetmanage.ai</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-4 bg-[#1E2536] rounded-xl border border-white/5">
                            <div className="bg-[#4F7CFF]/20 p-3 rounded-lg">
                                <MapPin className="w-6 h-6 text-[#4F7CFF]" />
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-lg mb-1">Office</h3>
                                <p className="text-slate-400 text-sm">
                                    Fleet Management Services<br />
                                    123 Business Ave, Suite 456<br />
                                    Austin, TX 78701
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#1E2536] p-6 rounded-xl border border-white/5 mt-8">
                        <h3 className="text-white font-bold mb-2">Support Hours</h3>
                        <div className="space-y-1 text-sm text-slate-400">
                            <div className="flex justify-between">
                                <span>Monday - Friday</span>
                                <span className="text-white">8:00 AM - 6:00 PM CST</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Saturday</span>
                                <span className="text-white">9:00 AM - 1:00 PM CST</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </PageLayout>
    );
};

export default Contact;
