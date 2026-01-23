import React from 'react';

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    actions?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, actions }) => {
    return (
        <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
            <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h1>
                {subtitle && (
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">{subtitle}</p>
                )}
            </div>
            {actions && (
                <div className="flex items-center gap-3">
                    {actions}
                </div>
            )}
        </div>
    );
};

export default PageHeader;
