import React from 'react';
import FuelManager from '@/components/fuel/FuelManager';

const FuelTracking = () => {
    return (
        <div className="p-6">
            <div className="mb-10">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Fuel Operations</h1>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">AI-Powered Consumption Audit & Spend Management</p>
            </div>

            <FuelManager />
        </div>
    );
};

export default FuelTracking;
