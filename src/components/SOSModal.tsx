"use client";

import React, { useState, useEffect } from 'react';
import { ShieldAlert, X, Send, AlertTriangle } from 'lucide-react';
import { useStadium } from '@/context/StadiumContext';

export const SOSModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    const { userData, emitSocket, setSosAlerts, accentColor } = useStadium();
    const [reason, setReason] = useState("");
    const [location, setLocation] = useState(userData?.seat || "");
    const [isDispatched, setIsDispatched] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (isOpen && userData?.seat) setLocation(userData.seat);
    }, [isOpen, userData?.seat]);

    const handleDispatch = async () => {
        if (!reason.trim() || !location.trim()) {
            setError("All tactical fields mandatory");
            return;
        }

        setIsDispatched(true);
        setError("");
        
        const payload = {
            alertId: `SOS-${Math.random().toString(36).slice(-4).toUpperCase()}`,
            userId: userData?.id || "guest-user",
            userName: userData?.name || "Anonymous Fan",
            seatLabel: location,
            reason: reason,
            timestamp: new Date().toISOString()
        };

        // Backend Sync for Nerve Centre
        try {
            await fetch('/api/admin/sos-alert', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        } catch (e) {
            console.error("SOS Alert Persistence Error", e);
        }

        // Local State Sync
        setSosAlerts(prev => [{
            id: payload.alertId,
            userName: payload.userName,
            reason: payload.reason,
            status: 'Active',
            createdAt: new Date(),
            seatLabel: payload.seatLabel
        }, ...prev]);

        // Socket Broadcast
        emitSocket("SOS_TRIGGER", payload);
        
        setTimeout(() => {
            onClose();
            setIsDispatched(false);
            setReason("");
            setError("");
        }, 3000);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-[10000] pointer-events-auto animate-in slide-in-from-bottom-10 duration-700">
            <div 
                className="backdrop-blur-3xl border-2 rounded-[40px] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.9)] relative"
                style={{ 
                    backgroundColor: `${accentColor}20`, // Transparent version of theme accent
                    borderColor: `${accentColor}40`,
                    boxShadow: `0 40px 100px rgba(0,0,0,0.9), 0 0 20px ${accentColor}15`
                }}
            >
                
                {/* ── AESTHETIC EMERGENCY LIGHTS ────────────────── */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent animate-pulse" />
                <div className="absolute inset-0 bg-red-600/5 mix-blend-overlay pointer-events-none" />
                <div className="absolute -top-24 -left-24 w-48 h-48 bg-red-600/20 rounded-full blur-[80px] animate-pulse" />
                
                {!isDispatched ? (
                    <div className="p-8 space-y-6">
                        {/* Header: Compact Tactical */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-2xl bg-red-600 flex items-center justify-center shadow-[0_0_20px_#ef4444] animate-pulse">
                                    <ShieldAlert size={20} className="text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black uppercase tracking-tighter text-white italic leading-none">Emergency Hub</h2>
                                    <p className="text-[8px] font-black uppercase tracking-widest mt-1" style={{ color: accentColor }}>Status: Tactical Sync</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="text-white/20 hover:text-white transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Mandatory Input: Location */}
                        <div className="space-y-2">
                             <div className="flex justify-between items-center ml-2">
                                <label className="text-[8px] font-black text-white/40 uppercase tracking-[0.3em]">Secure Location*</label>
                                <div className="w-1 h-1 rounded-full bg-red-500" />
                             </div>
                             <input 
                                type="text"
                                className="w-full bg-black/60 border rounded-2xl p-4 text-xs font-bold text-white focus:outline-none transition-all placeholder:text-white/10"
                                style={{ borderColor: `${accentColor}20`, borderStyle: 'solid', borderWidth: '1px' }}
                                placeholder="e.g. North Stand-A12"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                             />
                        </div>

                        {/* Mandatory Input: Reason */}
                        <div className="space-y-2">
                            <label className="text-[8px] font-black text-white/40 uppercase tracking-[0.3em] ml-2">Emergency Details*</label>
                            <textarea 
                                className="w-full bg-black/60 border rounded-2xl p-4 text-xs font-bold text-white focus:outline-none transition-all placeholder:text-white/10 h-24 resize-none shadow-inner"
                                style={{ borderColor: `${accentColor}20`, borderStyle: 'solid', borderWidth: '1px' }}
                                placeholder="Describe the emergency situation..."
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                            />
                        </div>

                        {error && (
                            <div className="flex items-center justify-center gap-2 py-2 bg-red-600/10 border border-red-600/20 rounded-xl">
                                <AlertTriangle size={12} className="text-red-500" />
                                <p className="text-[8px] font-black text-red-500 uppercase tracking-widest">{error}</p>
                            </div>
                        )}

                        {/* Action Hub */}
                        <div className="grid grid-cols-1 gap-3">
                            <button 
                                onClick={handleDispatch}
                                className="py-5 rounded-3xl bg-red-600 text-white font-black uppercase tracking-[0.3em] text-[11px] shadow-[0_15px_40px_rgba(220,38,38,0.5)] hover:bg-red-500 active:scale-95 transition-all text-center"
                            >
                                Dispatch Emergency Unit
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="p-12 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-700">
                        <div className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center mb-6 shadow-[0_0_60px_rgba(16,185,129,0.4)] relative">
                            <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-20" />
                            <Send size={32} className="text-black relative z-10" />
                        </div>
                        <h3 className="text-2xl font-black uppercase tracking-tighter text-white italic mb-2">Signal Secured</h3>
                        <p className="text-white/40 text-[9px] font-black uppercase tracking-[0.2em] max-w-[200px] leading-relaxed">Security & Medical teams are responding to <span className="text-emerald-400">{location}</span></p>
                    </div>
                )}

                {/* Footer Security Tab */}
                <div className="px-8 py-3 flex items-center justify-center gap-2" style={{ backgroundColor: `${accentColor}10`, borderTop: `1px solid ${accentColor}20` }}>
                    <div className="w-1 h-1 rounded-full bg-red-600 animate-pulse" />
                    <span className="text-[7px] font-black uppercase tracking-[0.5em]" style={{ color: `${accentColor}80` }}>StadiaNav Secured Transmission</span>
                </div>
            </div>
        </div>
    );
};
