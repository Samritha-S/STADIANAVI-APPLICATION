import React, { useState } from 'react';
import { Users, Search, UserPlus, X, MapPin, Radio } from 'lucide-react';
import { useStadium } from '@/context/StadiumContext';

/**
 * SocialSidebar Entry & Portal.
 */
const SocialSidebar: React.FC<{ buttonColor?: string; iconColor?: string }> = ({ buttonColor, iconColor }) => {
  const { friendMetadata, socialOpen, setSocialOpen, liveFriends, accentColor } = useStadium();
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <>
      <button
        onClick={() => setSocialOpen(true)}
        style={{ backgroundColor: buttonColor || 'var(--accent)', color: iconColor || 'black' }}
        className="w-14 h-14 hover:scale-110 rounded-full shadow-xl transition-all border border-white/20 flex items-center justify-center p-0"
        title="Fan Connect"
      >
        <Users size={24} />
      </button>

      {socialOpen && (
        <div className="fixed inset-0 z-[1000] flex justify-end pointer-events-none">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto" 
            onClick={() => setSocialOpen(false)}
          />
          
          <div className="relative w-full max-w-md h-full bg-[#0A0A0B]/95 backdrop-blur-3xl border-l border-white/10 flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.8)] pointer-events-auto animate-in slide-in-from-right duration-500">
            {/* Header */}
            <div className="p-8 border-b border-white/5 bg-white/[0.02]">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Fan Connect</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />
                            <p className="text-[10px] uppercase font-black text-white/30 tracking-[0.3em]">Neural Social Sync Active</p>
                        </div>
                    </div>
                    <button onClick={() => setSocialOpen(false)} className="w-12 h-12 flex items-center justify-center bg-white/5 border border-white/10 rounded-2xl text-white/40 hover:text-white transition-all">
                        <X size={24} />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar relative">
                {/* Geolocation CTA */}
                <section className="bg-[var(--accent-10)] border border-[var(--accent-20)] rounded-[32px] p-8 text-center relative overflow-hidden group">
                    <div className="w-16 h-16 bg-black/40 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
                        <MapPin className="text-[var(--accent)]" size={32} />
                    </div>
                    <h3 className="text-xl font-black text-white italic mb-2 tracking-tight">Spatial Sync Engine</h3>
                    <p className="text-[11px] text-white/50 uppercase font-black tracking-widest leading-relaxed mb-8 px-4">
                        Authorize telemetry to enable precision social wayfinding.
                    </p>
                    <button 
                        onClick={() => {
                            if (navigator.geolocation) {
                                navigator.geolocation.getCurrentPosition(() => alert("Sync Successful."));
                            }
                        }}
                        style={{ backgroundColor: accentColor }}
                        className="w-full py-4 rounded-2xl text-black font-black uppercase tracking-[0.2em] text-[10px] shadow-lg"
                    >
                        Synchronize Now
                    </button>
                </section>

                {/* Add Friend Section */}
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <h4 className="text-[10px] uppercase font-black text-white/30 tracking-[0.3em] flex items-center gap-2">
                            <UserPlus size={14} className="text-[var(--accent)]" />
                            Expand Protocol
                        </h4>
                        <div className="h-px flex-1 bg-white/5 mx-4" />
                    </div>
                    
                    <div className="flex gap-4 p-2 bg-white/5 border border-white/10 rounded-3xl group transition-all">
                        <input 
                            type="text" 
                            placeholder="Protocol ID or Name" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1 bg-transparent border-none px-6 py-4 text-xs font-bold text-white focus:outline-none placeholder:text-white/20 italic"
                        />
                        <button className="bg-white/5 hover:bg-white/10 p-4 rounded-2xl transition-all">
                            <Search size={18} className="text-white/40" />
                        </button>
                    </div>
                </section>

                {/* Active Squad */}
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <h4 className="text-[10px] uppercase font-black text-white/30 tracking-[0.3em] flex items-center gap-2">
                            <Radio size={14} className="text-red-500 animate-pulse" />
                            Active Squad Nodes
                        </h4>
                        <div className="h-px flex-1 bg-white/5 mx-4" />
                    </div>
                    <div className="space-y-4">
                        {liveFriends.map(friend => {
                            const meta = friendMetadata.find(m => m.userId === friend.id);
                            return (
                                <div key={friend.id} className="flex items-center justify-between p-6 bg-white/5 border border-white/5 rounded-[32px] hover:bg-white/[0.08] transition-all group">
                                    <div className="flex items-center gap-5">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black italic shadow-2xl relative ${meta?.jersey === 'CSK' ? 'bg-yellow-500 text-black' : 'bg-blue-600 text-white'}`}>
                                            {friend.name.charAt(0)}
                                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#0A0A0B] shadow-lg" />
                                        </div>
                                        <div>
                                            <p className="text-base font-black text-white tracking-tight">{friend.name}</p>
                                            <span className="text-[9px] text-white/30 uppercase font-black tracking-widest">{meta?.status || 'In Arena'}</span>
                                        </div>
                                    </div>
                                    <button className="p-4 bg-white/5 rounded-2xl border border-white/10 text-white/30 hover:bg-[var(--accent)] hover:text-black transition-all shadow-xl">
                                        <MapPin size={18} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </section>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SocialSidebar;
