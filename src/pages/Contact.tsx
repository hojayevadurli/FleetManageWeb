import PageLayout from "@/components/landing/PageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MapPin, Phone, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { sendMessage } from "@/Service/ContactService";
import { useToast } from "@/hooks/use-toast";

const Contact = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        message: ""
    });

    // Captcha state
    const [captcha, setCaptcha] = useState({ num1: 0, num2: 0 });
    const [captchaAnswer, setCaptchaAnswer] = useState("");

    const { toast } = useToast();

    // Initialize captcha
    useEffect(() => {
        generateCaptcha();
    }, []);

    const generateCaptcha = () => {
        setCaptcha({
            num1: Math.floor(Math.random() * 10),
            num2: Math.floor(Math.random() * 10)
        });
        setCaptchaAnswer("");
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate Captcha
        if (parseInt(captchaAnswer) !== captcha.num1 + captcha.num2) {
            toast({
                title: "Incorrect Captcha",
                description: "Please solve the math problem correctly.",
                variant: "destructive"
            });
            generateCaptcha();
            return;
        }

        setIsSubmitting(true);

        try {
            await sendMessage(formData);
            setIsSuccess(true);
            toast({
                title: "Message Sent",
                description: "We've received your message and will get back to you soon.",
            });
        } catch (error) {
            console.error("Failed to send message:", error);
            toast({
                title: "Error",
                description: "Failed to send message. Please try again later.",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setIsSuccess(false);
        setFormData({ firstName: "", lastName: "", email: "", message: "" });
        generateCaptcha();
    };

    return (
        <PageLayout
            title="Contact Us"
            description="Have questions? We'd love to hear from you."
        >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Contact Form */}
                <div className="bg-[#1E2536] p-8 rounded-2xl border border-white/5 shadow-xl">
                    <h2 className="text-xl font-bold text-white mb-6">Send us a message</h2>

                    {isSuccess ? (
                        <div className="flex flex-col items-center justify-center h-[400px] text-center space-y-4 animate-in fade-in duration-500">
                            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center">
                                <Mail className="w-8 h-8 text-emerald-500" />
                            </div>
                            <h3 className="text-2xl font-bold text-white">Message Sent!</h3>
                            <p className="text-slate-400 max-w-xs">
                                Thanks for reaching out. Our team will get back to you shortly.
                            </p>
                            <Button
                                variant="outline"
                                className="mt-4 border-white/10 text-white hover:bg-white/5"
                                onClick={resetForm}
                            >
                                Send another message
                            </Button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-300">First Name</label>
                                    <Input
                                        required
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleInputChange}
                                        className="bg-[#0F172A] border-white/10 text-white focus:border-[#4F7CFF]"
                                        placeholder="John"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-300">Last Name</label>
                                    <Input
                                        required
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleInputChange}
                                        className="bg-[#0F172A] border-white/10 text-white focus:border-[#4F7CFF]"
                                        placeholder="Doe"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Email</label>
                                <Input
                                    required
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className="bg-[#0F172A] border-white/10 text-white focus:border-[#4F7CFF]"
                                    placeholder="john@example.com"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Message</label>
                                <Textarea
                                    required
                                    name="message"
                                    value={formData.message}
                                    onChange={handleInputChange}
                                    className="bg-[#0F172A] border-white/10 text-white focus:border-[#4F7CFF] min-h-[150px]"
                                    placeholder="How can we help you?"
                                />
                            </div>

                            {/* Captcha */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Security Check</label>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2 bg-[#0F172A] px-4 py-2 rounded-md border border-white/10 text-white font-mono select-none">
                                        <span>{captcha.num1}</span>
                                        <span>+</span>
                                        <span>{captcha.num2}</span>
                                        <span>=</span>
                                    </div>
                                    <Input
                                        required
                                        type="number"
                                        value={captchaAnswer}
                                        onChange={(e) => setCaptchaAnswer(e.target.value)}
                                        className="bg-[#0F172A] border-white/10 text-white focus:border-[#4F7CFF] w-20 text-center"
                                        placeholder="?"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={generateCaptcha}
                                        className="text-slate-400 hover:text-white"
                                        title="Refresh Captcha"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full h-12 bg-[#4F7CFF] hover:bg-[#4F7CFF]/90 font-bold text-white transition-all"
                            >
                                {isSubmitting ? "Sending..." : "Send Message"}
                            </Button>
                        </form>
                    )}
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
                                <p className="text-slate-400 text-sm">info@fleetmanage.ai</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-4 bg-[#1E2536] rounded-xl border border-white/5">
                            <div className="bg-[#4F7CFF]/20 p-3 rounded-lg">
                                <Phone className="w-6 h-6 text-[#4F7CFF]" />
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-lg mb-1">Phone</h3>
                                <p className="text-slate-400 text-sm">224-566-1515</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-4 bg-[#1E2536] rounded-xl border border-white/5">
                            <div className="bg-[#4F7CFF]/20 p-3 rounded-lg">
                                <MapPin className="w-6 h-6 text-[#4F7CFF]" />
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-lg mb-1">Office</h3>
                                <p className="text-slate-400 text-sm">
                                    Chicago, IL
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
