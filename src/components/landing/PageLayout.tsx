import { ReactNode } from "react";
import Navbar from "./Navbar";
import { Footer } from "./LandingComponents";

interface PageLayoutProps {
    children: ReactNode;
    title?: string;
    description?: string;
}

const PageLayout = ({ children, title, description }: PageLayoutProps) => {
    return (
        <div className="min-h-screen bg-[#0F172A] selection:bg-[#4F7CFF] selection:text-white font-sans text-slate-300 antialiased flex flex-col">
            <Navbar />

            <main className="flex-grow">
                {/* Header Section */}
                {(title || description) && (
                    <div className="bg-[#1E2536] border-b border-white/5 py-12 md:py-20">
                        <div className="container mx-auto px-4 md:px-6 max-w-4xl text-center">
                            {title && <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">{title}</h1>}
                            {description && <p className="text-lg text-slate-400 max-w-2xl mx-auto">{description}</p>}
                        </div>
                    </div>
                )}

                {/* Content Section */}
                <div className="container mx-auto px-4 md:px-6 max-w-4xl py-12 md:py-16">
                    {children}
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default PageLayout;
