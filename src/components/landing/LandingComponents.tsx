import { Truck, MessageSquare, MapPin, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/Logo";

// --- HOW IT WORKS ---
export const HowItWorks = () => (
    <section className="py-24 bg-[#0B1121] border-t border-white/5" id="how-it-works">
        <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">How It Works</h2>
            <p className="text-slate-400 mb-16 max-w-2xl mx-auto">Get started in minutes. No complex setup or training required.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                    { icon: Truck, title: "1. Add Your Fleet (5 min)", desc: "Enter Unit # and VIN. AI instantly learns your fleet's specs." },
                    { icon: MessageSquare, title: "2. AI Scan (3 sec/receipt)", desc: "Snap receipts and ask questions. AI handles the data entry." },
                    { icon: MapPin, title: "3. Build Network (As you go)", desc: "Add your shops and start tracking spending immediately." }
                ].map((step, i) => (
                    <div key={i} className="bg-[#1A1F2E] p-8 rounded-2xl border border-white/5 relative group hover:border-[#4F7CFF]/30 transition-colors">
                        <div className="w-16 h-16 bg-[#0F172A] rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/10 group-hover:scale-110 transition-transform duration-300">
                            <step.icon className="w-8 h-8 text-[#4F7CFF]" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    </section>
);

// --- PRICING ---
export const Pricing = () => (
    <section className="py-24 bg-[#0F172A] relative overflow-hidden" id="pricing">
        <div className="container mx-auto px-4 max-w-4xl text-center relative z-10">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Simple AI-Powered Pricing</h2>

            <div className="bg-gradient-to-b from-[#1E2536] to-[#0F172A] p-1 rounded-3xl max-w-md mx-auto shadow-2xl">
                <div className="bg-[#1A1F2E] rounded-[22px] p-8 md:p-12 border border-white/10">
                    <div className="inline-block bg-[#4F7CFF]/10 text-[#4F7CFF] text-xs font-bold px-3 py-1 rounded-full mb-6 uppercase tracking-wider">
                        Early Access Offer
                    </div>

                    <div className="flex items-baseline justify-center gap-1 mb-2">
                        <span className="text-5xl font-bold text-white">$6</span>
                        <span className="text-slate-400">/month per truck</span>
                    </div>

                    <p className="text-slate-400 text-sm mb-6">
                        Pay for each truck you manage. Each truck includes:
                    </p>

                    <div className="space-y-3 mb-8 text-left">
                        {[
                            "Unlimited work orders",
                            "AI Chat Assistant",
                            "Receipt scanning & parsing",
                            "Shop network tracking"
                        ].map((feat, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <Check className="w-5 h-5 text-[#4F7CFF] shrink-0" />
                                <span className="text-slate-200">{feat}</span>
                            </div>
                        ))}
                    </div>

                    <div className="bg-[#0B1121]/50 p-4 rounded-xl mb-8 text-left space-y-2 border border-white/5">
                        <p className="text-slate-300 font-medium text-sm mb-2">Pricing Examples:</p>
                        <ul className="space-y-1 text-sm text-slate-400">
                            <li className="flex justify-between"><span>1 truck</span> <span>= $6/month</span></li>
                            <li className="flex justify-between"><span>10 trucks</span> <span>= $60/month</span></li>
                            <li className="flex justify-between"><span>50 trucks</span> <span>= $300/month</span></li>
                        </ul>
                        <p className="text-xs text-slate-500 mt-3 pt-2 border-t border-white/5">
                            Unlimited users & drivers at no extra cost. No per-seat fees.
                        </p>
                    </div>

                    <Button className="w-full h-14 text-lg bg-[#4F7CFF] hover:bg-[#4F7CFF]/90 font-bold shadow-lg shadow-blue-500/20">
                        Start Free Month
                    </Button>
                    <p className="text-slate-500 text-xs mt-4">1 month free trial. Cancel anytime.</p>
                </div>
            </div>
        </div>
    </section>
);

// --- TESTIMONIALS ---
export const Testimonials = () => (
    <section className="py-24 bg-[#0B1121] border-y border-white/5">
        <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-white mb-16">Trusted by Fleet Owners</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                    { quote: "I talk to FleetManage.ai like it's my fleet manager. It knows everything about my trucks.", author: "Mike R.", role: "Owner-Operator, 3 Trucks" },
                    { quote: "I used to spend 3 hours every Sunday night entering receipts. Now I snap photos during the week and FleetManage AI does it in seconds. Saves me 12+ hours per month.", author: "Sarah L.", role: "Fleet Manager, 12 Trucks" },
                    { quote: "Finally know which shops are worth it. The spending tracker is gold.", author: "David K.", role: "Operations, 18 Trucks" }
                ].map((t, i) => (
                    <div key={i} className="bg-[#1A1F2E] p-6 rounded-2xl border border-white/5 text-left">
                        <div className="flex text-yellow-500 mb-4">★★★★★</div>
                        <p className="text-slate-300 mb-6 leading-relaxed">"{t.quote}"</p>
                        <div>
                            <div className="font-bold text-white">{t.author}</div>
                            <div className="text-xs text-slate-500 uppercase tracking-wider">{t.role}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </section>
);

// --- FAQ ---
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"

export const FAQ = () => {
    const schemaData = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": "How does the AI fleet maintenance tracking work?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Our AI acts as your fleet manager. It ingests your service records and receipts, allowing you to ask natural language questions like 'When was the last oil change on Truck 5?' to get instant answers."
                }
            },
            {
                "@type": "Question",
                "name": "Can I really just take a picture of a handwritten receipt?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes! Our receipt scanner is trained specifically on truck repair invoices. It can read handwritten shop notes, parts lists, and labor costs, converting them into digital work orders automatically."
                }
            },
            {
                "@type": "Question",
                "name": "Does it track truck warranties?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. When you scan receipts, FleetManage AI automatically flags parts and labor that might be under warranty based on previous service history, helping you avoid double-paying."
                }
            },
            {
                "@type": "Question",
                "name": "Is my fleet data secure in the cloud?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Absolutely. We use enterprise-grade encryption for all your data. Your fleet maintenance records are backed up daily and accessible only to your authorized users."
                }
            }
        ]
    };

    return (
        <section className="py-24 bg-[#0F172A] container mx-auto px-4 max-w-3xl" id="faq">
            <script type="application/ld+json">
                {JSON.stringify(schemaData)}
            </script>
            <h2 className="text-3xl font-bold text-white mb-12 text-center">Frequently Asked Questions</h2>
            <Accordion type="single" collapsible className="w-full space-y-4">
                {[
                    { q: "How does the AI fleet maintenance tracking work?", a: "Our AI acts as your fleet manager. It ingests your service records and receipts, allowing you to ask natural language questions like 'When was the last oil change on Truck 5?' to get instant answers." },
                    { q: "Can I really just take a picture of a handwritten receipt?", a: "Yes! Our receipt scanner is trained specifically on truck repair invoices. It can read handwritten shop notes, parts lists, and labor costs, converting them into digital work orders automatically." },
                    { q: "Does it track truck warranties?", a: "Yes. When you scan receipts, FleetManage AI automatically flags parts and labor that might be under warranty based on previous service history, helping you avoid double-paying." },
                    { q: "Is my fleet data secure in the cloud?", a: "Absolutely. We use enterprise-grade encryption for all your data. Your fleet maintenance records are backed up daily and accessible only to your authorized users." }
                ].map((faq, i) => (
                    <AccordionItem key={i} value={`item-${i}`} className="border border-white/10 bg-[#1A1F2E] px-6 rounded-xl">
                        <AccordionTrigger className="text-white hover:no-underline hover:text-[#4F7CFF]">{faq.q}</AccordionTrigger>
                        <AccordionContent className="text-slate-400">{faq.a}</AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </section>
    );
};

// --- CTA SECTION ---
export const CTASection = () => (
    <section className="py-24 bg-gradient-to-br from-[#4F7CFF] to-purple-600 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
        <div className="container mx-auto px-4 relative z-10">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Stop Wrestling With Paperwork.</h2>
            <p className="text-white/80 text-xl mb-10 max-w-2xl mx-auto">Start talking to your fleet today. Join fleet operators who save hours every week.</p>
            <Button className="h-16 px-10 text-lg bg-white text-[#4F7CFF] hover:bg-white/90 font-bold shadow-2xl transition-transform hover:scale-105">
                Start Your Free Month
            </Button>
            <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-white/70 font-medium">
                <span className="flex items-center gap-2"><Check className="w-4 h-4" /> AI Chat + Parsing</span>
                <span className="flex items-center gap-2"><Check className="w-4 h-4" /> 1 Month Free Trial</span>
                <span className="flex items-center gap-2"><Check className="w-4 h-4" /> Cancel Anytime</span>
            </div>
        </div>
    </section>
);

// --- FOOTER ---
export const Footer = () => (
    <footer className="bg-[#0B1121] py-12 border-t border-white/5">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
            <Logo textClassName="text-white text-xl" />

            <div className="text-slate-500 text-sm">
                © 2026 FleetManage.ai. All rights reserved.
            </div>
            <div className="flex gap-6 text-sm text-slate-400">
                <a href="/privacy-policy" className="hover:text-white">Privacy</a>
                <a href="/terms" className="hover:text-white">Terms</a>
                <a href="/contact" className="hover:text-white">Contact</a>
            </div>
        </div>
    </footer>
);
