"use client";

import React, { useState } from 'react';
import { useStadium } from '@/context/StadiumContext';
import { Clock, MapPin, Zap, Utensils, Droplets } from 'lucide-react';
import { DeliveryModal } from '@/components/DeliveryModal';

export const ServicesView = ({ visible }: { visible: boolean }) => {
    const { foodStalls, restrooms, setNavSubject, setActiveTab } = useStadium();
    const [deliveryStall, setDeliveryStall] = useState<{ id: string; name: string } | null>(null);

    React.useEffect(() => {
        if (!visible) setDeliveryStall(null);
    }, [visible]);

    const handleNavigate = (stall: any) => {
        setNavSubject(stall);
        setActiveTab('map'); 
    };

    if (!visible) return null;

    return (
        <>
            <div className="fixed inset-0 lg:inset-auto lg:top-24 lg:right-8 lg:bottom-28 lg:w-[450px] z-[300] flex flex-col pointer-events-none">
                <div className="w-full h-full bg-[#0A0A0B]/80 backdrop-blur-3xl border border-white/10 lg:rounded-[32px] flex flex-col shadow-[0_40px_100px_rgba(0,0,0,0.9)] pointer-events-auto animate-in slide-in-from-right-10 duration-700 overflow-hidden relative">
                    {/* Glossy Header */}
                    <div className="p-8 pb-6 border-b border-white/5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent)] opacity-5 blur-3xl" />
                        <div className="flex items-center gap-5 relative z-10">
                            <div className="w-14 h-14 bg-[var(--accent-10)] rounded-2xl flex items-center justify-center border border-[var(--accent-20)] shadow-[0_0_20px_var(--accent-10)]">
                                <Utensils className="text-[var(--accent)]" size={28} />
                            </div>
                            <div>
                                <h2 className="text-3xl font-black uppercase tracking-tighter text-white leading-none">Services</h2>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />
                                    <p className="text-[9px] uppercase font-black text-white/40 tracking-[0.3em]">Operational Nodes Optimized</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-10 custom-scrollbar relative">
                        {/* Food Stalls */}
                        <section>
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-[10px] uppercase font-black text-white/30 tracking-[0.2em] flex items-center gap-2">
                                    <Zap size={14} className="text-[var(--accent)]" />
                                    Concourse Gastronomy
                                </h3>
                                <div className="h-px flex-1 bg-white/5 mx-4" />
                            </div>
                            
                            <div className="space-y-5">
                                {foodStalls.map(stall => {
                                    const wait = parseInt(stall.waitTime || '0');
                                    return (
                                        <div key={stall.id} className="group bg-white/5 border border-white/5 rounded-3xl p-6 hover:bg-white/[0.08] hover:border-[var(--accent-30)] transition-all duration-500 relative overflow-hidden shadow-sm hover:shadow-[0_20px_40px_-20px_rgba(0,0,0,0.5)]">
                                            <div className="flex justify-between items-start mb-6">
                                                <div className="flex-1">
                                                    <h4 className="text-xl font-black text-white italic tracking-tight mb-1">{stall.name}</h4>
                                                    <div className="flex items-center gap-2">
                                                        <MapPin size={12} className="text-[var(--accent)]" />
                                                        <span className="text-[10px] text-white/30 uppercase font-black tracking-widest">{stall.locationID}</span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end shrink-0">
                                                    <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-black border ${
                                                        wait < 8 
                                                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                                                        : wait < 15 
                                                        ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                                                        : 'bg-red-500/10 border-red-500/30 text-red-400 animate-pulse'
                                                    }`}>
                                                        <Clock size={16} />
                                                        {stall.waitTime || 'N/A'}<span className="text-[10px] ml-1 opacity-50">MIN</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex gap-3 relative z-10">
                                                <button 
                                                    onClick={() => handleNavigate(stall)}
                                                    className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[var(--accent)] hover:text-black hover:shadow-[0_0_20px_var(--accent-20)] transition-all duration-300"
                                                >
                                                    Wayfind
                                                </button>
                                                <button 
                                                    onClick={() => setDeliveryStall({ id: stall.id, name: stall.name })}
                                                    className="flex-1 py-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-emerald-500 hover:text-white transition-all duration-300"
                                                >
                                                    Delivery
                                                </button>
                                            </div>
                                            
                                            {/* Shimmer Effect */}
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite] pointer-events-none" />
                                        </div>
                                    );
                                })}
                            </div>
                        </section>

                        {/* Restrooms */}
                        <section>
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-[10px] uppercase font-black text-white/30 tracking-[0.2em] flex items-center gap-2">
                                    <Droplets size={14} className="text-[var(--accent)]" />
                                    Hygiene Nodes
                                </h3>
                                <div className="h-px flex-1 bg-white/5 mx-4" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                {restrooms.map(wc => (
                                    <div 
                                        key={wc.id} 
                                        className="bg-white/5 border border-white/10 rounded-3xl p-5 hover:border-emerald-500/40 hover:bg-white/[0.08] transition-all cursor-pointer group" 
                                        onClick={() => handleNavigate(wc)}
                                    >
                                        <h4 className="text-[13px] font-black text-white uppercase tracking-tighter mb-2 group-hover:text-emerald-400 transition-colors">{wc.name}</h4>
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]" />
                                            <span className="text-[9px] text-emerald-500 uppercase font-black tracking-widest">Operational</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* Bottom Status Hub */}
                    <div className="p-6 bg-black/40 border-t border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.4em]">StadiaNav Intel</span>
                        </div>
                        <div className="text-[8px] font-bold text-[var(--accent)] uppercase tracking-widest">v4.1.0 // STABLE</div>
                    </div>

                    {/* Delivery Overlay (Internal to Sidebar) */}
                    {deliveryStall && (
                        <div className="absolute inset-0 bg-[#0A0A0B] z-[100] flex flex-col animate-in slide-in-from-bottom duration-500 pointer-events-auto">
                            <DeliveryModal
                                stall={deliveryStall}
                                onClose={() => setDeliveryStall(null)}
                            />
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};
