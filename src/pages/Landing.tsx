
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Truck,
  Wrench,
  FileCheck,
  MapPin,
  ArrowRight,
  CheckCircle2,
  Zap,
  ShieldCheck,
  BarChart3,
  Search,
  ChevronRight,
  Menu,
  X
} from "lucide-react";

const Landing = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const features = [
    {
      icon: Wrench,
      title: "Smart Maintenance",
      description: "Automated tracking for every repair, part, and labor hour. Never miss a service interval again.",
      color: "bg-blue-500"
    },
    {
      icon: FileCheck,
      title: "Digital Inspections",
      description: "DVIRs made simple. Drivers complete inspections from their phone, instantly syncing to your dashboard.",
      color: "bg-emerald-500"
    },
    {
      icon: MapPin,
      title: "Service Network",
      description: "Access our curated network of top-rated shops. Compare rates, read reviews, and book service.",
      color: "bg-indigo-500"
    },
    {
      icon: BarChart3,
      title: "Fleet Analytics",
      description: "Real-time insights into cost-per-mile, fuel efficiency, and asset utilization.",
      color: "bg-rose-500"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-100 selection:text-blue-900">

      {/* Navigation */}
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/90 backdrop-blur-xl border-b border-slate-200 shadow-sm py-4" : "bg-transparent py-6"
          }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Truck className="h-5 w-5 text-white" />
            </div>
            <span className={`text-xl font-black tracking-tight ${scrolled ? "text-slate-900" : "text-slate-900"}`}>
              FleetManage<span className="text-blue-600">.ai</span>
            </span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {["Features", "Network", "Pricing", "Enterprise"].map((item) => (
              <a
                key={item}
                href="#"
                className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors"
              >
                {item}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <Link to="/login">
              <span className="text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer">
                Sign In
              </span>
            </Link>
            <Link to="/login">
              <Button className="rounded-full px-6 py-5 bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-xl shadow-slate-900/10 hover:shadow-slate-900/20 transition-all active:scale-95">
                Get Started Free
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 text-slate-600"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-100/50 rounded-full blur-3xl -z-10 mix-blend-multiply opacity-70 animate-pulse-slow" />
        <div className="absolute top-1/2 right-0 w-[800px] h-[600px] bg-indigo-100/40 rounded-full blur-3xl -z-10 mix-blend-multiply opacity-60" />

        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">New: AI-Powered Shop Discovery</span>
          </div>

          <h1 className="text-6xl lg:text-8xl font-black text-slate-900 tracking-tight leading-[1.1] mb-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
            The Operating System <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              For Modern Fleets
            </span>
          </h1>

          <p className="text-xl lg:text-2xl text-slate-600 max-w-2xl mx-auto mb-12 font-medium leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            Automate maintenance, track assets, and control costs with the only fleet management platform built for the AI era.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
            <Link to="/login" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto rounded-full px-8 py-7 text-lg bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-600/20 hover:shadow-blue-600/30 transition-all font-bold gap-2">
                Start Free Trial <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link to="/login" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto rounded-full px-8 py-7 text-lg border-slate-200 hover:bg-white hover:text-blue-600 font-bold gap-2 bg-white/50 backdrop-blur-sm">
                View Demo
              </Button>
            </Link>
          </div>

          {/* Hero Dashboard Preview */}
          <div className="mt-20 relative mx-auto max-w-5xl animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500">
            <div className="absolute inset-0 bg-blue-600/5 blur-3xl -z-10 rounded-[3rem]" />
            <div className="bg-slate-900 rounded-[2rem] p-2 shadow-2xl ring-1 ring-slate-900/10">
              <div className="bg-slate-950 rounded-[1.5rem] overflow-hidden border border-slate-800">
                <img
                  src="/dashboard-preview.png"
                  alt="FleetManage.ai Dashboard"
                  className="w-full h-auto opacity-90"
                  onError={(e) => {
                    e.currentTarget.src = "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=2400&q=80"; // Fallback
                  }}
                />

                {/* Floating UI Cards */}
                <div className="absolute -left-12 top-1/4 bg-white p-4 rounded-2xl shadow-xl shadow-slate-900/20 border border-slate-100 hidden lg:block animate-float">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase">Status</p>
                      <p className="text-sm font-bold text-slate-900">Maintenance Approvals</p>
                    </div>
                    <span className="text-emerald-600 font-black text-lg ml-4">100%</span>
                  </div>
                </div>

                <div className="absolute -right-8 bottom-1/3 bg-white p-4 rounded-2xl shadow-xl shadow-slate-900/20 border border-slate-100 hidden lg:block animate-float-delayed">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <Search className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="pr-4">
                      <p className="text-xs font-bold text-slate-400 uppercase">AI Insight</p>
                      <p className="text-sm font-bold text-slate-900">Shop Found: "Diesel Pros"</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats/Social Proof */}
      <section className="py-12 border-y border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: "Assets Managed", value: "15,000+" },
              { label: "Maintenance Savings", value: "22%" },
              { label: "Shop Network", value: "50 States" },
              { label: "Uptime Increase", value: "14%" },
            ].map((stat, idx) => (
              <div key={idx} className="text-center">
                <p className="text-3xl lg:text-4xl font-black text-slate-900 mb-1">{stat.value}</p>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 lg:py-32 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-4xl font-black text-slate-900 mb-6">Everything You Need to Run a Lean Fleet</h2>
            <p className="text-xl text-slate-600">
              Replace spreadsheets and scattered paperwork with a single, powerful command center.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group"
              >
                <div className={`w-14 h-14 ${feature.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg rotate-3 group-hover:rotate-0 transition-transform`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dark Footer */}
      <footer className="bg-slate-950 text-slate-400 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Truck className="h-4 w-4 text-white" />
                </div>
                <span className="text-xl font-bold text-white tracking-tight">
                  FleetManage.ai
                </span>
              </div>
              <p className="text-slate-500 max-w-sm text-lg leading-relaxed">
                The next-generation operating system for modern logistics and heavy-duty maintenance.
              </p>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6">Product</h4>
              <ul className="space-y-4">
                <li><a href="#" className="hover:text-blue-500 transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-blue-500 transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-blue-500 transition-colors">Integration</a></li>
                <li><a href="#" className="hover:text-blue-500 transition-colors">Updates</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6">Company</h4>
              <ul className="space-y-4">
                <li><a href="#" className="hover:text-blue-500 transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-blue-500 transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-blue-500 transition-colors">Legal</a></li>
                <li><Link to="/privacy-policy" className="hover:text-blue-500 transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-600 font-medium">© 2024 FleetManage.ai Inc. All rights reserved.</p>
            <div className="flex gap-6">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-500">System Operational</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
