import { Helmet } from "react-helmet";
import Navbar from "../components/landing/Navbar";
import Hero from "../components/landing/Hero";
import FeatureAssets from "../components/landing/FeatureAssets";
import FeatureService from "../components/landing/FeatureService";
import FeatureShops from "../components/landing/FeatureShops";
import Comparison from "../components/landing/Comparison";
import { HowItWorks, Pricing, Testimonials, FAQ, CTASection, Footer } from "../components/landing/LandingComponents";

const Landing = () => {
    return (
        <div className="min-h-screen bg-[#0F172A] selection:bg-[#4F7CFF] selection:text-white font-sans text-slate-900 antialiased">
            <Helmet>
                <title>AI Fleet Management Software | FleetManage.ai</title>
                <meta name="description" content="AI fleet management software for small trucking companies. Track maintenance, scan receipts automatically, and manage repair shops. $5/month, unlimited trucks. Start free." />
                <meta name="keywords" content="fleet management software, truck maintenance tracking, ai fleet manager, receipt scanner for truckers" />
                <meta property="og:title" content="AI Fleet Management for Small Trucking Companies" />
                <meta property="og:description" content="Stop wrestling with paperwork. Talk to your fleet with AI. Track maintenance, warranties, and costs instantly." />
                <meta property="og:type" content="website" />
                <meta name="twitter:card" content="summary_large_image" />
                <script type="application/ld+json">
                    {`
                        {
                            "@context": "https://schema.org",
                            "@type": "SoftwareApplication",
                            "name": "FleetManage.ai",
                            "applicationCategory": "BusinessApplication",
                            "offers": {
                                "@type": "Offer",
                                "price": "5.00",
                                "priceCurrency": "USD"
                            },
                            "operatingSystem": "Web Browser, iOS, Android",
                            "description": "AI-powered fleet management software for small trucking companies"
                        }
                    `}
                </script>
            </Helmet>

            <Navbar />

            <main>
                <Hero />
                <FeatureAssets />
                <FeatureService />
                <FeatureShops />
                <Comparison />
                <HowItWorks />
                <Pricing />
                <Testimonials />
                <FAQ />
                <CTASection />
            </main >

            <Footer />
        </div >
    );
};

export default Landing;
