"use client";

import React, { useState, useEffect } from "react";
import { useStadium } from "@/context/StadiumContext";
import { Shield, Users, ArrowRight, Zap, Target, Globe } from "lucide-react";

const STANDS = [
  "Sunil Gavaskar", "North Stand", "Vijay Merchant", "Sachin Tendulkar",
  "MCA", "Vitthal Divecha", "Garware", "Grand Stand"
];

const LEVELS = ["Level 1", "Level 2", "Corporate Balcony"];

export default function LoginPage() {
  const { login } = useStadium();
  const [loginMode, setLoginMode] = useState<"fan" | "admin">("fan");
  const [phone, setPhone] = useState("");
  const [stand, setStand] = useState(STANDS[0]);
  const [level, setLevel] = useState(LEVELS[0]);
  const [block, setBlock] = useState("");
  const [seat, setSeat] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleFanLogin = () => {
    login({ stand, level, block, seat, phone });
  };

  const handleAdminGuest = () => {
    login({}, "admin");
  };

  const handleFanGuest = () => {
    login({ guest: true });
  };

  return (
    <div className="min-h-screen bg-[#05060f] text-slate-200 flex items-center justify-center p-4 md:p-8 relative overflow-hidden font-sans">
      {/* Cinematic Background Image with Overlay */}
      <div 
        className="absolute inset-0 z-0 scale-105"
        style={{
          backgroundImage: `url('/stadianav_login_bg_1776627320455.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(0.3) blur(2px)'
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-tr from-[#05060f] via-transparent to-[#05060f]/80 z-[1]" />
      
      {/* Animated Glow Orbs */}
      <div className="absolute top-[20%] left-[15%] w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] animate-pulse pointer-events-none z-[1]" />
      <div className="absolute bottom-[20%] right-[15%] w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] animate-pulse delay-1000 pointer-events-none z-[1]" />

      <main className={`relative z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center transition-all duration-1000 transform ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
        
        {/* Brand/Experience Side */}
        <div className="hidden lg:flex flex-col space-y-10">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
              <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400">Tactical Readiness: Green</span>
            </div>
            <h1 className="text-8xl font-black tracking-tighter leading-none italic uppercase">
              Stadia<span className="text-transparent bg-clip-text bg-gradient-to-b from-cyan-400 to-blue-600">Nav</span>
            </h1>
            <p className="text-2xl font-light text-slate-400 tracking-tight max-w-md">
              High-fidelity twin for the ultimate match-day immersion.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {[
                { icon: <Target className="text-cyan-400" />, label: "Precision Nav", sub: "Centimeter accuracy" },
                { icon: <Zap className="text-blue-400" />, label: "Live Sync", sub: "0.2s Latency" },
                { icon: <Globe className="text-indigo-400" />, label: "Heatmaps", sub: "Real-time density" },
                { icon: <Shield className="text-emerald-400" />, label: "Eco-Secure", sub: "Gateless operations" },
            ].map((stat, i) => (
                <div key={i} className="p-4 bg-white/[0.03] border border-white/[0.05] rounded-3xl backdrop-blur-sm group hover:border-white/20 transition-all cursor-default">
                    <div className="mb-3 transform group-hover:scale-110 transition-transform">{stat.icon}</div>
                    <div className="text-sm font-black uppercase tracking-widest">{stat.label}</div>
                    <div className="text-[10px] text-slate-500 font-medium">{stat.sub}</div>
                </div>
            ))}
          </div>
        </div>

        {/* Auth Interface Side */}
        <div className="relative group">
          {/* Decorative Border Glow */}
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 to-blue-600/20 rounded-[40px] blur-xl group-hover:opacity-100 opacity-50 transition-opacity" />
          
          <div className="relative bg-[#0A0C16]/80 backdrop-blur-3xl border border-white/10 rounded-[36px] p-8 md:p-12 shadow-3xl overflow-hidden">
            
            {/* Mode Switcher */}
            <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5 mb-10 w-fit mx-auto">
              <button 
                onClick={() => setLoginMode("fan")}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${loginMode === 'fan' ? 'bg-white/10 text-white shadow-xl' : 'text-slate-500 hover:text-slate-200'}`}
              >
                <Users size={14} /> Fan Portal
              </button>
              <button 
                onClick={() => setLoginMode("admin")}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${loginMode === 'admin' ? 'bg-red-500/20 text-red-400 shadow-xl border border-red-500/20' : 'text-slate-500 hover:text-slate-200'}`}
              >
                <Shield size={14} /> Admin Node
              </button>
            </div>

            {loginMode === "fan" ? (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div className="space-y-2">
                    <h2 className="text-3xl font-black tracking-tight">Identity Discovery</h2>
                    <p className="text-slate-500 text-sm">Sync your ticket to personalize the tactical twin.</p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <label className="text-[10px] uppercase font-black tracking-widest text-[#00f2ff]/50">Stand Location</label>
                        <select 
                            value={stand}
                            onChange={(e) => setStand(e.target.value)}
                            className="w-full mt-2 bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 focus:border-cyan-500 outline-none appearance-none transition-all cursor-pointer"
                        >
                            {STANDS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] uppercase font-black tracking-widest text-slate-500">Level</label>
                        <select 
                            value={level}
                            onChange={(e) => setLevel(e.target.value)}
                            className="w-full mt-2 bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 focus:border-cyan-500 outline-none"
                        >
                            {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                    </div>
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <label className="text-[10px] uppercase font-black tracking-widest text-slate-500">Block</label>
                            <input 
                                value={block}
                                onChange={(e) => setBlock(e.target.value)}
                                placeholder="B-2"
                                className="w-full mt-2 bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 focus:border-cyan-500 outline-none text-center font-bold"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="text-[10px] uppercase font-black tracking-widest text-slate-500">Seat</label>
                            <input 
                                value={seat}
                                onChange={(e) => setSeat(e.target.value)}
                                placeholder="14"
                                className="w-full mt-2 bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 focus:border-cyan-500 outline-none text-center font-bold"
                            />
                        </div>
                    </div>
                  </div>

                  <button 
                    onClick={handleFanLogin}
                    className="w-full py-5 bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 rounded-2xl flex items-center justify-center gap-3 group transition-all"
                  >
                    <span className="text-sm font-black uppercase tracking-[0.2em] shadow-cyan-900/40 shadow-2xl">Initialize POV Mode</span>
                    <ArrowRight className="group-hover:translate-x-2 transition-transform" size={18} />
                  </button>

                  <div className="flex items-center gap-4 py-2">
                    <div className="h-px flex-1 bg-white/5" />
                    <span className="text-[10px] text-slate-700 font-bold uppercase">Alternate Stream</span>
                    <div className="h-px flex-1 bg-white/5" />
                  </div>

                  <button 
                    onClick={handleFanGuest}
                    className="w-full py-4 border border-white/5 bg-white/5 hover:bg-white/10 rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
                  >
                    Enter as Guest Witness
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-3">
                    <div className="w-16 h-16 bg-red-500/10 rounded-3xl flex items-center justify-center text-red-500 mb-6 border border-red-500/20">
                        <Shield size={32} />
                    </div>
                    <h2 className="text-3xl font-black tracking-tight">Nerve Centre Access</h2>
                    <p className="text-slate-500 text-sm italic">"Operational overrides requires encrypted biometric or legacy bypass."</p>
                </div>

                <div className="space-y-6">
                    <div className="bg-red-500/5 border border-red-500/10 p-6 rounded-3xl space-y-4">
                        <div className="flex items-center gap-3">
                            <Target className="text-red-500" size={16} />
                            <span className="text-xs font-black uppercase tracking-widest text-red-300">Demo Mode Enabled</span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                            Authorized personnel can enter the stadium management interface without credentials for demonstration purposes. Full tactical control, SOS dispatch, and CCTV overrides will be active.
                        </p>
                    </div>

                    <button 
                      onClick={handleAdminGuest}
                      className="w-full py-5 bg-red-600 hover:bg-red-500 rounded-2xl flex items-center justify-center gap-3 group transition-all shadow-[0_0_40px_rgba(220,38,38,0.2)]"
                    >
                      <span className="text-sm font-black uppercase tracking-[0.2em]">Deploy to Nerve Centre</span>
                      <Shield className="group-hover:rotate-12 transition-transform" size={18} />
                    </button>

                    <p className="text-center text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                       Secure Port Selection: 3002 (SYNCED)
                    </p>
                </div>
              </div>
            )}

            {/* Micro-Meta Footer */}
            <div className="mt-12 flex justify-between items-center px-2">
                <div className="flex gap-2">
                   <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
                   <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse delay-75" />
                   <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-pulse delay-150" />
                </div>
                <span className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">© 2026 StadiaNav Ops</span>
            </div>

          </div>
        </div>
      </main>

      <footer className={`absolute bottom-8 left-1/2 -translate-x-1/2 z-10 transition-all duration-1000 delay-500 ${isLoaded ? 'opacity-30' : 'opacity-0'}`}>
         <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.4em] text-white">
            <span>Mumbai</span>
            <span className="w-1 h-1 bg-white rounded-full" />
            <span>HQ Secure</span>
            <span className="w-1 h-1 bg-white rounded-full" />
            <span>Digital Twin v4.0</span>
         </div>
      </footer>
    </div>
  );
}
