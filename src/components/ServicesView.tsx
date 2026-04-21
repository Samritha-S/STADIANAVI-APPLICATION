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
            <div className={`fixed top-[72px] bottom-[76px] inset-x-0 lg:inset-auto lg:top-24 lg:right-8 lg:bottom-28 lg:w-[600px] z-[300] flex flex-col pointer-events-none transition-all duration-500 ${visible ? 'translate-y-0 opacity-100' : 'translate-y-full lg:translate-y-0 lg:translate-x-12 opacity-0'}`}>
                <div className="w-full h-full bg-[#0A0A0B]/85 backdrop-blur-3xl border-x lg:border border-white/10 lg:rounded-[32px] flex flex-col shadow-[0_40px_100px_rgba(0,0,0,0.9)] pointer-events-auto overflow-hidden relative">
                    {/* Glossy Header */}
                    <div className="p-5 md:p-8 pb-4 md:pb-6 border-b border-white/5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent)] opacity-5 blur-3xl" />
                        <div className="flex items-center gap-3 md:gap-5 relative z-10">
                            <div className="w-10 h-10 md:w-14 md:h-14 bg-[var(--accent-10)] rounded-xl md:rounded-2xl flex items-center justify-center border border-[var(--accent-20)] shadow-[0_0_20px_var(--accent-10)]">
                                <Utensils className="text-[var(--accent)] w-5 h-5 md:w-7 md:h-7" />
                            </div>
                            <div>
                                <h2 className="text-xl md:text-3xl font-black uppercase tracking-tighter text-white leading-none">Services</h2>
                                <div className="flex items-center gap-2 mt-1 md:mt-2">
                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />
                                    <p className="text-[7px] md:text-[9px] uppercase font-black text-white/40 tracking-[0.2em] md:tracking-[0.3em]">Operational Nodes Optimized</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div 
                        className="flex-1 overflow-y-auto scroll-smooth p-4 md:p-8 space-y-6 md:space-y-10 custom-scrollbar relative overscroll-contain"
                        style={{ WebkitOverflowScrolling: 'touch', willChange: 'scroll-position, transform' }}
                    >
                        {/* Food Stalls */}
                        <section>
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-[10px] uppercase font-black text-white/30 tracking-[0.2em] flex items-center gap-2">
                                        <Zap size={14} className="text-[var(--accent)]" />
                                        Concourse Gastronomy
                                    </h3>
                                    <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[8px] font-black text-white/40">{foodStalls.length} NODES</span>
                                </div>
                                <div className="hidden md:flex items-center gap-2">
                                    <div className="w-24 h-1 bg-white/5 rounded-full overflow-hidden">
                                        <div className="w-2/3 h-full bg-[var(--accent)] opacity-50" />
                                    </div>
                                    <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Load: 68%</span>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                                {foodStalls.map(stall => {
                                    const wait = parseInt(stall.waitTime || '0');
                                    return (
                                        <div key={stall.id} className="group bg-white/5 border border-white/5 rounded-2xl md:rounded-3xl p-5 md:p-6 hover:bg-white/[0.08] hover:border-[var(--accent-30)] transition-all duration-500 relative overflow-hidden shadow-sm hover:shadow-[0_20px_40px_-20px_rgba(0,0,0,0.5)] flex flex-col">
                                            <div className="flex justify-between items-start mb-4 md:mb-6">
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-lg md:text-xl font-black text-white italic tracking-tight mb-1 truncate">{stall.name}</h4>
                                                    <div className="flex items-center gap-2">
                                                        <MapPin size={10} className="text-[var(--accent)]" />
                                                        <span className="text-[9px] text-white/30 uppercase font-black tracking-widest">{stall.locationID}</span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end shrink-0 ml-2">
                                                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border ${
                                                        wait < 8 
                                                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                                                        : wait < 15 
                                                        ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                                                        : 'bg-red-500/10 border-red-500/30 text-red-400 animate-pulse'
                                                    }`}>
                                                        <Clock size={14} />
                                                        {stall.waitTime || 'N/A'}<span className="text-[9px] ml-0.5 opacity-50 font-bold">M</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Preview Menu Icons - Desktop Only */}
                                            <div className="hidden md:flex gap-3 mb-6 p-3 bg-black/40 rounded-xl border border-white/5">
                                                <span className="text-lg">🍔</span>
                                                <span className="text-lg">🥤</span>
                                                <span className="text-lg">🍟</span>
                                            </div>

                                            <div className="mt-auto flex gap-2 relative z-10">
                                                <button 
                                                    onClick={() => handleNavigate(stall)}
                                                    className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-[0.1em] hover:bg-[var(--accent)] hover:text-black transition-all duration-300"
                                                >
                                                    Map
                                                </button>
                                                <button 
                                                    onClick={() => setDeliveryStall({ id: stall.id, name: stall.name })}
                                                    className="flex-1 py-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-[9px] font-black uppercase tracking-[0.1em] hover:bg-emerald-500 hover:text-white transition-all duration-300"
                                                >
                                                    Order
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
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {restrooms.map(wc => (
                                    <div 
                                        key={wc.id} 
                                        className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-5 hover:border-emerald-500/40 hover:bg-white/[0.08] transition-all cursor-pointer group" 
                                        onClick={() => handleNavigate(wc)}
                                    >
                                        <h4 className="text-[12px] md:text-[13px] font-black text-white uppercase tracking-tighter mb-2 group-hover:text-emerald-400 transition-colors truncate">{wc.name}</h4>
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]" style={{ willChange: 'opacity' }} />
                                            <span className="text-[8px] md:text-[9px] text-emerald-500 uppercase font-black tracking-widest">Active</span>
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
