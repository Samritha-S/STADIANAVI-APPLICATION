"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { useStadium } from '@/context/StadiumContext';
import { ShieldAlert, Radio, Map, Users, Utensils, UserPlus, Settings as SettingsIcon } from 'lucide-react';

export const Dashboard = () => {
    const { 
        matchData, 
        commentary, 
        activeTab, 
        setActiveTab, 
        matchClock, 
        loyaltyPoints, 
        isEmergency,
        userData,
        socialOpen,
        setSocialOpen,
        sosOpen,
        setSosOpen,
        logout,
        accentColor
    } = useStadium();

    const [isLocationAuthorized, setIsLocationAuthorized] = useState(false);

    useEffect(() => {
        if (typeof navigator !== 'undefined' && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(() => setIsLocationAuthorized(true));
        }
    }, []);

    const isBreak = matchData?.status?.toLowerCase().includes('break');
    
    // Dynamic theme based on match situation
    const headerStyle = useMemo(() => {
        if (isEmergency) return 'border-red-600/50 bg-red-600/10 shadow-[0_0_50px_rgba(220,38,38,0.2)]';
        if (isBreak) return 'border-[var(--accent-20)] bg-[var(--accent-10)]';
        return 'border-white/10 bg-black/80 shadow-2xl';
    }, [isEmergency, isBreak]);

    const navTabs = [
        { id: 'map', label: 'Map', icon: <Map size={18} /> },
        { id: 'fanzone', label: 'Pulse', icon: <Users size={18} /> },
        { id: 'services', label: 'Services', icon: <Utensils size={18} /> },
        { id: 'settings', label: 'Meta', icon: <SettingsIcon size={18} /> },
    ] as const;

    return (
        <div className="fixed inset-0 z-[100] pointer-events-none flex flex-col">
            {/* Global Header - Optimized for zero overlap using Flex-Justify */}
            <header className={`backdrop-blur-3xl border-b px-4 md:px-12 py-4 flex items-center justify-between gap-4 pointer-events-auto transition-all duration-1000 relative z-[110] ${headerStyle}`}>
                <div className="absolute top-0 left-0 right-0 h-[2px] z-[120]" style={{ background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`, boxShadow: `0 0 20px ${accentColor}` }} />
                
                {/* Left: Brand & Team Identity (Min-width to protect space) */}
                <div className="flex items-center gap-4 md:gap-8 min-w-0 md:min-w-[200px]">
                    <div className="flex flex-col shrink-0">
                        <div className="flex items-center gap-2 mb-0.5 md:mb-1">
                           <h1 className="text-lg md:text-2xl font-black uppercase tracking-tighter text-white leading-none">
                                SN<span className="hidden xs:inline">AV</span>
                           </h1>
                           {isLocationAuthorized && (
                               <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-1 py-0.5 rounded text-[6px] font-black text-emerald-400">
                                  <div className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse" /> <span className="hidden sm:inline">SYNC</span>
                               </div>
                           )}
                        </div>
                        <div className="flex items-center gap-2 md:gap-3">
                            <div className="flex items-center -space-x-1">
                                <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-blue-600 border-2 border-blue-400 shadow-lg z-10" />
                                <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-yellow-500 border-2 border-yellow-300 shadow-lg" />
                            </div>
                            <span className="text-[8px] md:text-[10px] font-black tracking-widest text-white/40 uppercase truncate max-w-[40px] md:max-w-none">MI/CSK</span>
                        </div>
                    </div>
                </div>

                {/* Center: Live Scoreboard (Now relative inside flex to push away siblings) */}
                <div className="flex-1 flex justify-center min-w-0">
                    {matchData && (
                        <div className="flex items-center gap-3 md:gap-6 bg-white/[0.03] backdrop-blur-3xl px-3 md:px-8 py-2 rounded-full border border-white/10 shadow-xl group">
                            <div className="flex items-center gap-1.5 md:gap-3">
                                <span className="hidden xs:inline text-[10px] font-black text-blue-400">MI</span>
                                <span className="text-sm md:text-xl font-black tabular-nums tracking-tighter text-white">{matchData.homeScore}</span>
                            </div>
                            <div className="flex flex-col items-center border-x border-white/5 px-2 md:px-6">
                                <span className="text-sm md:text-xl font-black tabular-nums text-[var(--accent)] tracking-tighter glow-text">{matchClock}</span>
                            </div>
                            <div className="flex items-center gap-1.5 md:gap-3">
                                <span className="text-sm md:text-xl font-black tabular-nums tracking-tighter text-white">{matchData.awayScore}</span>
                                <span className="hidden xs:inline text-[10px] font-black text-yellow-400">CSK</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right: Fan Identity & Nav */}
                <div className="flex items-center justify-end gap-2 md:gap-6 min-w-0 md:min-w-[300px]">
                    <div className="hidden xl:flex items-center gap-6 bg-black/40 border border-white/10 px-6 py-2 rounded-full shrink-0">
                        <div className="flex flex-col items-end">
                            <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">Points</span>
                            <span className="text-sm font-black text-[var(--accent)] tabular-nums">{loyaltyPoints.toLocaleString()}</span>
                        </div>
                        
                        <div className="w-px h-6 bg-white/10" />

                        <div className="flex flex-col items-end">
                            <span className="text-[10px] font-mono text-cyan-400/80 font-bold tracking-widest">
                                {userData?.seat || 'HERO-GS01'}
                            </span>
                        </div>
                    </div>

                    <div className="flex lg:hidden items-center justify-center w-10 h-10 bg-white/5 rounded-full border border-white/10 text-[var(--accent)]">
                         <span className="text-[10px] font-black">{userData?.seat?.split('-')[1] || '01'}</span>
                    </div>

                    {/* Desktop Menu */}
                    <nav className="hidden lg:flex gap-1 bg-black/80 p-1.5 rounded-full border border-white/10">
                        {navTabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`relative px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                                    activeTab === tab.id ? 'text-black' : 'text-white/30 hover:text-white'
                                }`}
                            >
                                {activeTab === tab.id && (
                                    <div className="absolute inset-0 bg-[var(--accent)] rounded-full shadow-[0_0_20px_var(--accent-30)]" />
                                )}
                                <span className="relative z-10">{tab.label}</span>
                            </button>
                        ))}
                    </nav>
                </div>
            </header>

            {/* Commentary Deck */}
            <div className="bg-black/95 backdrop-blur-md border-b border-white/5 py-2 px-6 overflow-hidden pointer-events-auto">
                <div className="flex items-center gap-4 max-w-7xl mx-auto">
                    <Radio size={12} className="text-[var(--accent)] animate-pulse shrink-0" />
                    <p className="text-[11px] font-bold text-white/60 tracking-tight italic line-clamp-1">
                        {commentary}
                    </p>
                </div>
            </div>

            <div className="flex-1" />

            {/* Mobile Navigation */}
            <nav className="lg:hidden bg-[#0A0A0B]/95 backdrop-blur-3xl border-t border-white/10 px-4 py-3 flex items-center justify-around pointer-events-auto safe-bottom">
                {navTabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex flex-col items-center gap-1 transition-all ${activeTab === tab.id ? 'text-[var(--accent)]' : 'text-white/20'}`}
                    >
                        <div className={`p-2.5 rounded-xl ${activeTab === tab.id ? 'bg-[var(--accent-10)] border border-[var(--accent-30)]' : 'bg-white/5'}`}>
                            {React.cloneElement(tab.icon as React.ReactElement<any>, { size: 20 })}
                        </div>
                        <span className="text-[8px] font-black uppercase tracking-widest">{tab.label}</span>
                    </button>
                ))}
            </nav>
        </div>
    );
};
