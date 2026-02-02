import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { Logo } from "@/components/ui/Logo";

const Navbar = () => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);

    const handleNav = (path: string) => {
        setIsOpen(false);
        if (path.startsWith("#")) {
            window.location.href = path;
        } else {
            navigate(path);
        }
    };

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#1A1F2E]/80 backdrop-blur-md">
            <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
                <div className="cursor-pointer" onClick={() => navigate("/")}>
                    <Logo textClassName="text-white" />
                </div>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
                    <a href="#features" className="hover:text-white transition-colors">Features</a>
                    <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
                    <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
                    <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
                </div>

                {/* Desktop Auth Buttons */}
                <div className="hidden md:flex items-center gap-4">
                    <Button
                        variant="ghost"
                        onClick={() => (window as any).Calendly?.initPopupWidget({ url: 'https://calendly.com/fleetmanageai/30min' })}
                        className="text-slate-300 hover:text-white hover:bg-white/10"
                    >
                        Book Demo
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={() => navigate("/login")}
                        className="text-slate-300 hover:text-white hover:bg-white/10"
                    >
                        Login
                    </Button>
                    <Button
                        onClick={() => navigate("/login?mode=signup")}
                        className="bg-[#4F7CFF] hover:bg-[#4F7CFF]/90 text-white font-semibold shadow-[0_0_20px_rgba(79,124,255,0.3)]"
                    >
                        Start Free Month
                    </Button>
                </div>

                {/* Mobile Navigation */}
                <div className="md:hidden">
                    <Sheet open={isOpen} onOpenChange={setIsOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                                <Menu className="h-6 w-6" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent className="bg-[#1A1F2E] border-l border-white/10 text-white w-[300px]">
                            <SheetHeader>
                                <SheetTitle className="text-left text-white flex items-center gap-2">
                                    <Logo textClassName="text-white text-lg" />
                                </SheetTitle>
                            </SheetHeader>
                            <div className="flex flex-col gap-6 mt-8">
                                <div className="flex flex-col gap-4 text-base font-medium text-slate-400">
                                    <button onClick={() => handleNav("#features")} className="text-left hover:text-white transition-colors">Features</button>
                                    <button onClick={() => handleNav("#how-it-works")} className="text-left hover:text-white transition-colors">How It Works</button>
                                    <button onClick={() => handleNav("#pricing")} className="text-left hover:text-white transition-colors">Pricing</button>
                                    <button onClick={() => handleNav("#faq")} className="text-left hover:text-white transition-colors">FAQ</button>
                                </div>
                                <div className="border-t border-white/10 pt-6 flex flex-col gap-4">
                                    <Button
                                        variant="ghost"
                                        onClick={() => {
                                            setIsOpen(false);
                                            (window as any).Calendly?.initPopupWidget({ url: 'https://calendly.com/fleetmanageai/30min' });
                                        }}
                                        className="justify-start text-slate-300 hover:text-white hover:bg-white/10 px-0"
                                    >
                                        Book Demo
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        onClick={() => handleNav("/login")}
                                        className="justify-start text-slate-300 hover:text-white hover:bg-white/10 px-0"
                                    >
                                        Login
                                    </Button>
                                    <Button
                                        onClick={() => handleNav("/login?mode=signup")}
                                        className="bg-[#4F7CFF] hover:bg-[#4F7CFF]/90 text-white font-semibold w-full"
                                    >
                                        Start Free Month
                                    </Button>
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
