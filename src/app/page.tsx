"use client";

import React, { useState, useEffect } from "react";
import StadiumView from "@/components/StadiumView";
import { StadiumProvider, useStadium } from "@/context/StadiumContext";
import { Dashboard } from "@/components/Dashboard";
import { FanZoneView } from "@/components/FanZoneView";
import { ServicesView } from "@/components/ServicesView";
import { SettingsView } from "@/components/SettingsView";
import { AlertTriangle, ShieldAlert, MapPin, X } from "lucide-react";
import SocialSidebar from "@/components/SocialSidebar";
import LoginPage from "@/components/LoginPage";
import { SOSModal } from "@/components/SOSModal";

const ARRIVAL_THRESHOLD = 5;

const NavigationHUD = () => {
    const { setNavSubject, navSubject, wayfindingStats } = useStadium();
    const [arrived, setArrived] = useState(false);
    const initialDistRef = React.useRef<number | null>(null);

    const stats = wayfindingStats;

    useEffect(() => {
        if (navSubject && stats) {
            if (initialDistRef.current === null) initialDistRef.current = stats.distance;
            setArrived(false);
        }
        if (!navSubject) {
            initialDistRef.current = null;
            setArrived(false);
        }
    }, [navSubject?.id, stats === null]);

    useEffect(() => {
        if (!stats || !navSubject) return;
        if (stats.distance < ARRIVAL_THRESHOLD && !arrived) setArrived(true);
    }, [stats?.distance, arrived, navSubject]);

    if (!stats || !navSubject) return null;

    const ringProgress = initialDistRef.current ? Math.min(1, 1 - stats.distance / initialDistRef.current) : 0;
    const RING_CIRC = 2 * Math.PI * 18;

    return (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-[150] pointer-events-auto animate-in slide-in-from-bottom-10">
            <div className="bg-[#0A0A0B]/95 backdrop-blur-3xl border border-white/10 rounded-[32px] p-6 shadow-[0_40px_80px_rgba(0,0,0,0.8)]">
                {arrived ? (
                    <div className="flex items-center gap-5 py-2">
                        <div className="w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center text-white text-2xl shadow-lg">✓</div>
                        <div>
                            <h3 className="text-white font-black text-lg italic uppercase tracking-tighter">Arrived</h3>
                            <p className="text-emerald-400 text-[9px] uppercase font-bold tracking-[0.2em] mt-1">Target reached successfully.</p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-[var(--accent)] rounded-2xl flex items-center justify-center text-black shadow-lg">
                                    <MapPin size={24} />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-white font-black text-lg tracking-tighter uppercase italic truncate">{navSubject.name}</h3>
                                    <span className="text-[var(--accent)] text-[8px] font-black uppercase tracking-[0.3em]">Wayfinding Active</span>
                                </div>
                            </div>
                            <button onClick={() => setNavSubject(null)} className="p-3 bg-white/5 border border-white/10 rounded-full text-white/30 hover:text-white transition-all">
                                <X size={16} />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                <span className="text-white/20 text-[8px] font-black uppercase tracking-widest block mb-1">Distance</span>
                                <span className="text-white text-2xl font-black italic tabular-nums">{stats.distance.toFixed(0)}<span className="text-[10px] ml-1 opacity-40">M</span></span>
                            </div>
                            <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                <span className="text-white/20 text-[8px] font-black uppercase tracking-widest block mb-1">ETA</span>
                                <span className="text-[var(--accent)] text-2xl font-black italic tabular-nums">{stats.time}<span className="text-[10px] ml-1 opacity-40">MIN</span></span>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};



const AppContent = () => {
    const { activeTab, isLoggedIn, sosOpen, setSosOpen, isAuthLoading } = useStadium();
    const [showCV, setShowCV] = useState(false);

    if (isAuthLoading) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!isLoggedIn) return <LoginPage />;

    return (
        <div className="min-h-screen bg-[#050505] text-white overflow-hidden selection:bg-[var(--accent)] selection:text-black relative">
            <Dashboard />
            
            <div className="relative h-screen w-full">
                <StadiumView showCVDots={showCV} />
            </div>
            
            {/* View Portals */}
            <div className="relative z-[80] pointer-events-none">
                <FanZoneView visible={activeTab === 'fanzone'} />
                <ServicesView visible={activeTab === 'services'} />
                <SettingsView visible={activeTab === 'settings'} />
            </div>

            {/* Tactical FAB Stack (Right Side) - Hidden when map is not the primary focus */}
            {activeTab === 'map' && (
                <div className="fixed bottom-24 lg:bottom-32 right-4 lg:right-6 z-[200] flex flex-col gap-4 lg:gap-6 items-center pointer-events-auto animate-in fade-in slide-in-from-right-10 duration-500">
                    <button 
                        onClick={() => setSosOpen(true)}
                        className="w-12 h-12 lg:w-14 lg:h-14 bg-[#0A0A0B]/80 backdrop-blur-md rounded-full border border-red-500/50 flex items-center justify-center text-red-500 shadow-[0_0_20px_rgba(220,38,38,0.2)] hover:bg-red-500 hover:text-white transition-all hover:scale-110 group relative"
                    >
                        <ShieldAlert className="w-[18px] h-[18px] lg:w-[22px] lg:h-[22px] group-hover:animate-ping absolute opacity-0 group-hover:opacity-100" />
                        <ShieldAlert className="w-[18px] h-[18px] lg:w-[22px] lg:h-[22px] relative z-10" />
                        <span className="hidden lg:block absolute right-full mr-4 px-3 py-1 bg-black/80 backdrop-blur-md border border-red-500/30 rounded-lg text-[10px] font-black uppercase tracking-widest text-red-500 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">Emergency</span>
                    </button>

                    {/* FRIEND ACCESS (Social) - Yellow */}
                    <div className="group relative">
                        <SocialSidebar buttonColor="#FFFF00" iconColor="black" />
                        <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 px-3 py-1 bg-black/80 backdrop-blur-md border border-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">Fan Connect</span>
                    </div>
                </div>
            )}

            <SOSModal isOpen={sosOpen} onClose={() => setSosOpen(false)} />
            <NavigationHUD />

            {/* DEV TOOLS - Only visible in Map view */}
            {activeTab === 'map' && (
                <div className="fixed bottom-48 left-6 z-[120] pointer-events-auto hidden md:block">
                    <button 
                        onClick={() => setShowCV(!showCV)} 
                        className={`px-4 py-2 rounded-xl text-[9px] font-black transition-all ${showCV ? 'bg-[var(--accent)] text-black shadow-lg shadow-[var(--accent-20)]' : 'bg-black/60 backdrop-blur-md border border-white/10 text-white/40'}`}
                    >
                        CV CORE {showCV ? 'ACTIVE' : 'STANDBY'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default function Home() {
    return (
        <StadiumProvider>
            <AppContent />
        </StadiumProvider>
    );
}
