"use client";

import React, { useState, useEffect } from 'react';
import { Shield, Map as MapIcon, History, X, AlertTriangle, Video, Users, MessageSquare, Megaphone, Trash2 } from 'lucide-react';
import { useStadium } from '@/context/StadiumContext';

interface AdminPanelProps {
  onToggleSection: (id: string, state: boolean) => void;
  onClearHeatmap: () => void;
  onShowHistory: (userId: string) => void;
}

const NerveCentre: React.FC<AdminPanelProps> = ({ onToggleSection }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { foodStalls, restrooms, cvDensityMap, sosAlerts, setSosAlerts } = useStadium();
  
  const [sections, setSections] = useState<{id: string, active: boolean}[]>([
    { id: "North-Concourse-A", active: true },
    { id: "Garware-Aisle-3", active: true },
    { id: "Grandstand-Level-1", active: true },
    { id: "East-Exit-Gate-4", active: true },
  ]);

  // Real-time SOS Stream
  useEffect(() => {
    // Initial Fetch from DB
    const loadAlrt = async () => {
        try {
            const res = await fetch('/api/admin/sos-alert');
            const data = await res.json();
            if (Array.isArray(data)) setSosAlerts(data);
        } catch (e) { console.log("Alert load failed", e); }
    };
    if (isOpen) loadAlrt();
  }, [isOpen]);

  const [socialFeed, setSocialFeed] = useState([
    { id: 1, user: 'AngryFan99', msg: 'This is the worst match ever!', flags: 2 },
    { id: 2, user: 'BlueArmy', msg: 'MI winning this one easily!', flags: 0 },
    { id: 3, user: 'Bot_003', msg: 'Spam link here: bit.ly/1234', flags: 5 }
  ]);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        title="Admin Nerve Centre"
        className="fixed top-4 right-4 z-[100] p-3 bg-red-600/90 hover:bg-red-500 text-white rounded-full shadow-[0_0_20px_#dc262688] backdrop-blur-md transition-all border border-red-400"
      >
        <Shield size={20} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-3xl overflow-y-auto pt-6 px-10 pb-20 fade-in">
          <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-6">
            <div>
                <h1 className="text-4xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                    <span className="w-4 h-4 bg-red-600 rounded-full animate-pulse" />
                    StadiaNav Nerve Centre
                </h1>
                <p className="text-red-500 font-bold uppercase tracking-[0.3em] text-xs mt-2">God View Authorization Enabled</p>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/40 hover:text-white p-3 bg-white/5 rounded-full transition-all">
                <X size={24} />
            </button>
          </div>

          <div className="grid grid-cols-12 gap-8">
            
            {/* LEFT COLUMN: Map & CCTV */}
            <div className="col-span-12 lg:col-span-8 flex flex-col gap-8">
                
                {/* Drone Map Widget */}
                <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 relative overflow-hidden">
                    <h3 className="text-sm font-black uppercase tracking-widest text-[#00f2ff] mb-4 flex items-center gap-2"><MapIcon size={16}/> 2D Drone Heatmap</h3>
                    <div className="w-full aspect-video bg-black rounded-2xl border border-white/5 relative overflow-hidden flex items-center justify-center">
                        <div className="absolute inset-4 border-2 border-[#00f2ff]/20 rounded-full shadow-[inset_0_0_50px_#00f2ff11]" />
                        <div className="absolute w-[60%] h-[30%] bg-green-500/10 border border-white/10 rounded" />
                        
                        {/* Mock Heatmap Nodes */}
                        <div className="absolute top-1/4 left-1/4 w-12 h-12 bg-red-500/40 rounded-full blur-xl animate-pulse" />
                        <div className="absolute bottom-1/3 right-1/4 w-20 h-20 bg-yellow-500/40 rounded-full blur-xl animate-pulse" />
                        
                        <p className="text-white/20 font-bold uppercase tracking-widest z-10">Live Radar Feed</p>
                    </div>
                </div>

                {/* CCTV Grid */}
                <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6">
                    <h3 className="text-sm font-black uppercase tracking-widest text-white/50 mb-4 flex items-center gap-2"><Video size={16}/> Security CCTV Feeds</h3>
                    <div className="grid grid-cols-3 gap-4">
                        {[1,2,3].map(cam => (
                            <div key={cam} className="aspect-video bg-black rounded-xl border border-white/10 relative overflow-hidden group">
                                <span className="absolute top-2 left-2 px-2 py-1 bg-red-600 text-white text-[8px] font-black rounded uppercase">Live</span>
                                <span className="absolute bottom-2 left-2 text-white/50 text-[10px] font-bold">Cam 0{cam}: Quadrant {['A', 'B', 'C'][cam-1]}</span>
                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/tv-noise.png')] opacity-20 mix-blend-screen pointer-events-none" />
                            </div>
                        ))}
                    </div>
                </div>
                
                {/* Stall & Restroom Status */}
                <div className="grid grid-cols-2 gap-8">
                    <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6">
                        <h3 className="text-sm font-black uppercase tracking-widest text-[#00f2ff] mb-4">Service Queues</h3>
                        <div className="space-y-3">
                            {foodStalls.map(stall => (
                                <div key={stall.id} className="flex justify-between items-center p-3 bg-black/40 rounded-xl border border-white/5">
                                    <span className="text-xs font-bold text-white">{stall.name}</span>
                                    <span className={`text-[10px] font-black px-2 py-1 rounded ${parseInt(stall.waitTime || '0') > 12 ? 'bg-red-500/20 text-red-500' : 'bg-emerald-500/20 text-emerald-400'}`}>{stall.waitTime} Min Wait</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6">
                        <h3 className="text-sm font-black uppercase tracking-widest text-emerald-400 mb-4">Restroom Density</h3>
                        <div className="space-y-3">
                            {restrooms.map(wc => (
                                <div key={wc.id} className="flex justify-between items-center p-3 bg-black/40 rounded-xl border border-white/5">
                                    <span className="text-xs font-bold text-white">{wc.name}</span>
                                    <span className="text-[10px] font-black text-emerald-500">Nominal</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN: Action & Alerts */}
            <div className="col-span-12 lg:col-span-4 flex flex-col gap-8">
                
                {/* SOS Center */}
                <div className="bg-red-950/30 border border-red-600/50 rounded-3xl p-6 shadow-[0_0_30px_#dc262622]">
                    <h3 className="text-sm font-black uppercase tracking-widest text-red-500 mb-4 flex items-center gap-2"><AlertTriangle size={16}/> Active SOS Alerts</h3>
                    <div className="space-y-3">
                        {sosAlerts.map((alert, idx) => (
                            <div key={alert.id || idx} className="p-4 bg-red-900/20 border border-red-500/30 rounded-xl animate-in slide-in-from-right-4 duration-500">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded font-black">
                                        {alert.status?.toUpperCase() || 'ACTIVE'}
                                    </span>
                                    <span className="text-[10px] font-bold text-white/50">
                                        {alert.createdAt ? new Date(alert.createdAt).toLocaleTimeString() : 'LIVE'}
                                    </span>
                                </div>
                                <div className="text-sm font-black text-white mb-0.5">Fan: {alert.userName || alert.user || 'Unknown'}</div>
                                <div className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-2">Location: {alert.seatLabel || 'UNASSIGNED'}</div>
                                <div className="text-xs text-red-100/70 italic mb-4 leading-relaxed line-clamp-2">"{alert.reason}"</div>
                                <div className="flex gap-2">
                                    <button className="flex-1 py-1.5 bg-red-600 rounded text-[9px] font-black uppercase text-white shadow-lg shadow-red-600/30 hover:brightness-125 transition-all">Dispatch Team</button>
                                    <button 
                                        onClick={() => setSosAlerts(prev => prev.filter(a => a.id !== alert.id))}
                                        className="flex-1 py-1.5 border border-red-500/50 rounded text-[9px] font-black uppercase text-red-400 hover:bg-red-500/10 transition-all"
                                    >
                                        Clear Alert
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Crowd Management NavMesh Tool */}
                <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6">
                    <h3 className="text-sm font-black uppercase tracking-widest text-white/50 mb-4 flex items-center gap-2"><MapIcon size={16}/> Routing Overrides</h3>
                    <div className="space-y-3">
                        {sections.map(section => (
                            <div key={section.id} className="p-3 bg-black/40 rounded-xl flex items-center justify-between border border-white/5">
                                <span className="text-[10px] font-bold text-white/70">{section.id}</span>
                                <button 
                                    onClick={() => setSections(prev => prev.map(s => s.id === section.id ? { ...s, active: !s.active } : s))}
                                    className={`px-3 py-1 rounded text-[9px] font-black uppercase transition-all ${section.active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-500'}`}
                                >
                                    {section.active ? 'Open' : 'Closed'}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Social Moderation */}
                <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 flex-1">
                    <h3 className="text-sm font-black uppercase tracking-widest text-[#00f2ff] mb-4 flex items-center gap-2"><MessageSquare size={16}/> Social Mod Feed</h3>
                    <div className="space-y-3">
                        {socialFeed.map(feed => (
                            <div key={feed.id} className="p-3 bg-black/40 rounded-xl border border-white/5 relative group hover:border-[#00f2ff]/30 transition-all">
                                {feed.flags > 0 && <div className="absolute -top-2 -right-2 bg-red-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full">{feed.flags} Flags</div>}
                                <span className="text-[10px] text-white/50 font-bold mb-1 block">{feed.user}</span>
                                <p className="text-xs text-white mb-2">{feed.msg}</p>
                                <div className="flex gap-2 pt-2 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => alert(`Warning Sent to ${feed.user}`)} className="flex items-center gap-1 text-[9px] uppercase font-black text-yellow-500 hover:text-yellow-400"><Megaphone size={10}/> Notify</button>
                                    <button onClick={() => setSocialFeed(prev => prev.filter(f => f.id !== feed.id))} className="flex items-center gap-1 text-[9px] uppercase font-black text-red-500 hover:text-red-400"><Trash2 size={10}/> Delete</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NerveCentre;
