"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Radio } from 'lucide-react';
import { useStadium } from '@/context/StadiumContext';

export const FanZoneView = ({ visible }: { visible: boolean }) => {
    const { userPosition, emitSocket, addPoints, pollData, votePoll, accentColor, setAccentColor } = useStadium();
    const [isCapturing, setIsCapturing] = useState(false);
    const [isBooting, setIsBooting] = useState(false);
    const [useFallback, setUseFallback] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isMobile, setIsMobile] = useState(false);
    const [cameraMode, setCameraMode] = useState<"user" | "environment">("user");

    useEffect(() => {
        setIsMobile(/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent));
    }, []);

    const [chatMsg, setChatMsg] = useState("");
    const [chats, setChats] = useState<{user: string, text: string, time: string}[]>([
        { user: "Sachin_Fan", text: "What a shot! 🏏", time: "19:02" },
        { user: "BlueArmy", text: "We need a wicket now...", time: "19:04" }
    ]);
    const [hasVoted, setHasVoted] = useState(false);

    const startCamera = async () => {
        setIsBooting(true);
        await new Promise(r => setTimeout(r, 1500));
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: isMobile ? { facingMode: cameraMode } : true 
            });
            if (videoRef.current) videoRef.current.srcObject = stream;
            setIsCapturing(true);
            setUseFallback(false);
        } catch (err) {
            console.error("Camera access denied", err);
            setUseFallback(true);
            setIsCapturing(true);
        } finally {
            setIsBooting(false);
        }
    };

    const takePhoto = () => {
        if (!canvasRef.current || !videoRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(videoRef.current, 0, 0, 400, 300);
        ctx.fillStyle = "rgba(0, 242, 255, 0.8)";
        ctx.font = "bold 20px Rajdhani";
        ctx.fillText("STADIANAV PULSE", 20, 280);
        
        emitSocket("SOCIAL_FLARE_TRIGGER", { x: userPosition[0], z: userPosition[2], intensity: 1.0 });
        
        // Backend Sync for Nerve Centre
        fetch('/api/social/flare', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: "guest-user",
                x: userPosition[0],
                z: userPosition[2],
                intensity: 1.0
            })
        }).catch(e => console.log("Flare sync failed", e));

        addPoints?.(50);
        
        if (!useFallback && videoRef.current?.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
        setIsCapturing(false);
        alert("Fan Gesture Uploaded! +50 Loyalty Points awarded.");
    };

    const handleSendChat = async () => {
        if (!chatMsg.trim()) return;
        const msgTime = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        // Optimistic UI update
        const newMsg = { user: "You", text: chatMsg, time: msgTime };
        setChats(prev => [...prev, newMsg]);
        setChatMsg("");
        addPoints?.(5);

        // Backend Sync
        try {
            await fetch('/api/social/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userName: "You",
                    text: chatMsg,
                    time: msgTime,
                    userId: "guest-user" 
                })
            });
        } catch (e) {
            console.error("Chat sync failed", e);
        }
    };

    const handleVote = (id: string) => {
        if (hasVoted) return;
        votePoll(id);
        setHasVoted(true);
        addPoints?.(10);
    };

    const themes = [
        { name: "MI - Blue", color: "#00f2ff", bg: "#004BA0" },
        { name: "CSK - Yellow", color: "#FFFF00", bg: "#F9CD05" },
        { name: "RCB - Red", color: "#FF3333", bg: "#000000" },
        { name: "GT - Teal", color: "#00Bfff", bg: "#0B1D40" },
        { name: "LSG - Cyan", color: "#00D2FF", bg: "#13003F" },
        { name: "KKR - Gold", color: "#E0B700", bg: "#3D2256" },
        { name: "RR - Pink", color: "#FF007F", bg: "#0B2664" },
        { name: "DC - Imperial", color: "#0047AB", bg: "#EF4123" },
        { name: "SRH - Orange", color: "#FF822A", bg: "#000000" },
        { name: "PBKS - Silver", color: "#D71920", bg: "#EAF2F6" }
    ];

    useEffect(() => {
        const fetchChats = async () => {
            try {
                const res = await fetch('/api/social/chat');
                const data = await res.json();
                if (Array.isArray(data)) {
                    // Map backend schema (userName) to frontend state (user)
                    setChats(data.map(d => ({ user: d.userName, text: d.text, time: d.time })));
                }
            } catch (e) {
                console.error("Failed to fetch fast chat sync");
            }
        };
        fetchChats();
        const iv = setInterval(fetchChats, 5000);
        return () => clearInterval(iv);
    }, []);

    if (!visible) return null;

    const totalVotes = pollData.options.reduce((acc, o) => acc + o.votes, 0);

    return (
        <div className="fixed inset-0 lg:top-24 lg:left-8 lg:right-8 lg:bottom-12 z-[300] flex items-center justify-center p-0 lg:p-0 bg-black/80 lg:bg-transparent backdrop-blur-md lg:backdrop-blur-none pointer-events-none">
            <div className={`w-full h-full bg-[#0A0A0B]/95 backdrop-blur-3xl border-white/10 lg:rounded-[32px] overflow-hidden shadow-[0_80px_160px_rgba(0,0,0,1)] pointer-events-auto flex flex-col lg:border transition-all duration-500 mt-[72px] lg:mt-0 mb-[76px] lg:mb-0 ${visible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}>
                <div className="p-4 md:p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-white">FanZone<span style={{color: accentColor}}>.Pulse</span></h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_#ef4444]" />
                            <p className="text-[10px] uppercase font-black text-white/30 tracking-[0.3em]">Stadium-Wide Sync Activated</p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 overflow-y-auto lg:overflow-hidden">
                    {/* LEFT PANEL: Media & Cam */}
                    <div className="p-6 md:p-8 border-b lg:border-b-0 lg:border-r border-white/5 flex flex-col gap-6 md:gap-8 overflow-y-visible lg:overflow-y-auto scroll-smooth custom-scrollbar" style={{ willChange: 'scroll-position' }}>
                        <section>
                            <h3 className="text-[10px] font-black uppercase text-white/30 tracking-[0.2em] mb-6 flex items-center gap-2">
                                <div className="w-1 h-1 bg-[var(--accent)] rounded-full" />
                                Interactive Visual Stream
                            </h3>
                            {isBooting ? (
                                <div className="w-full aspect-video bg-white/[0.02] border border-white/10 rounded-3xl flex flex-col items-center justify-center gap-6 overflow-hidden relative">
                                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--accent-20)] to-transparent opacity-20" />
                                    <div className="relative">
                                        <div className="w-28 h-28 border-4 border-white/5 rounded-full border-t-[var(--accent)] animate-[spin_3s_cubic-bezier(0.4,0,0.2,1)_infinite]" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-16 h-16 border-2 border-white/10 rounded-full border-b-[var(--accent)] animate-[spin_2s_cubic-bezier(0.2,0.8,0.2,1)_infinite_reverse]" />
                                        </div>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-8 h-8 rounded-full bg-[var(--accent)]/30 animate-ping" />
                                        </div>
                                    </div>
                                    <div className="text-center z-10">
                                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--accent)] animate-pulse">Initializing Feed</p>
                                        <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest mt-2">Connecting to Stadium Node...</p>
                                    </div>
                                </div>
                            ) : !isCapturing ? (
                                <div className="w-full aspect-video bg-white/[0.02] border border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center gap-4 text-white/20 group hover:border-[var(--accent-40)] hover:bg-white/[0.04] transition-all duration-500">
                                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center text-4xl group-hover:scale-110 transition-transform">📸</div>
                                    <div className="text-center">
                                        <p className="text-xs font-bold text-white mb-2">Initialize Stadium Cam</p>
                                        <p className="text-[10px] uppercase tracking-widest opacity-50 italic">Share your jersey & cheer</p>
                                    </div>
                                    
                                    {isMobile && (
                                        <div className="flex gap-2.5 mt-2 bg-black/60 p-1.5 rounded-xl border border-white/5">
                                            <button 
                                                onClick={() => setCameraMode('user')} 
                                                className={`px-4 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${cameraMode === 'user' ? 'bg-[var(--accent)] text-black' : 'text-white/40 hover:text-white'}`}
                                            >
                                                Front Cam
                                            </button>
                                            <button 
                                                onClick={() => setCameraMode('environment')} 
                                                className={`px-4 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${cameraMode === 'environment' ? 'bg-[var(--accent)] text-black' : 'text-white/40 hover:text-white'}`}
                                            >
                                                Back Cam
                                            </button>
                                        </div>
                                    )}

                                    <button 
                                        onClick={startCamera}
                                        style={{ backgroundColor: accentColor }}
                                        className="mt-4 px-10 py-4 text-black font-black uppercase tracking-[0.2em] text-[11px] rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-[0_20px_40px_var(--accent-10)]"
                                    >
                                        Activate Feed
                                    </button>
                                </div>
                            ) : (
                                <div className="relative w-full aspect-video bg-black rounded-3xl overflow-hidden border-2 shadow-2xl" style={{ borderColor: accentColor }}>
                                    {useFallback ? (
                                        <div className="w-full h-full relative group">
                                            <img 
                                                src="https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=1600&auto=format&fit=crop" 
                                                className="w-full h-full object-cover opacity-60 grayscale hover:grayscale-0 transition-all duration-1000"
                                                alt="Digital Feed" 
                                            />
                                            <div className="absolute inset-0 bg-blue-500/10 mix-blend-overlay" />
                                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 bg-black/40">
                                                <Radio size={48} className="text-white/20 mb-4 animate-pulse" />
                                                <p className="text-sm font-black uppercase tracking-tighter italic text-white/80">Hardware Unavailable</p>
                                                <p className="text-[9px] font-bold text-[var(--accent)] uppercase tracking-widest mt-2">Switching to Digital Visual Stream</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                                    )}
                                    <div className="absolute top-6 left-6 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-red-500/50">
                                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_#ef4444]" />
                                        <span className="text-[9px] font-black uppercase tracking-widest text-white">Live Link</span>
                                    </div>
                                    <button 
                                        onClick={takePhoto}
                                        className="absolute bottom-8 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full border-4 border-white/20 flex items-center justify-center bg-white/10 hover:bg-white/20 transition-all hover:scale-110 group disabled:opacity-50"
                                        disabled={useFallback}
                                    >
                                        <div className="w-14 h-14 rounded-full bg-white shadow-[0_0_30px_rgba(255,255,255,0.5)]" />
                                    </button>
                                </div>
                            )}
                            <canvas ref={canvasRef} width={400} height={300} className="hidden" />
                        </section>

                        {/* Live Fan Poll */}
                        <section className="bg-white/[0.03] p-8 rounded-[32px] border border-white/5">
                            <div className="flex items-center gap-5 mb-8">
                                <div className="w-12 h-12 bg-[var(--accent-10)] rounded-2xl flex items-center justify-center text-2xl border border-[var(--accent-20)]">📊</div>
                                <div>
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Intelligence Retrieval</h3>
                                    <p className="text-lg font-black italic text-white mt-1">{pollData.question}</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                {pollData.options.map(opt => {
                                    const pct = Math.round((opt.votes / totalVotes) * 100) || 0;
                                    return (
                                        <button 
                                            key={opt.id}
                                            onClick={() => handleVote(opt.id)}
                                            disabled={hasVoted}
                                            className="relative w-full bg-black/40 border border-white/5 rounded-2xl overflow-hidden group text-left h-14 disabled:cursor-default"
                                        >
                                            <div 
                                                className="absolute top-0 left-0 bottom-0 opacity-10 transition-all duration-1000 ease-out" 
                                                style={{ width: `${pct}%`, backgroundColor: accentColor }} 
                                            />
                                            <div className="absolute inset-0 flex items-center justify-between px-6 z-10">
                                                <span className="text-sm font-bold text-white/80">{opt.label}</span>
                                                <div className="flex flex-col items-end">
                                                    <span className="text-xs font-black text-white">{pct}%</span>
                                                    <span className="text-[8px] font-bold text-white/20 uppercase tracking-tighter">{opt.votes.toLocaleString()} VOTES</span>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                            {hasVoted && (
                                <div className="mt-6 flex items-center justify-center gap-2">
                                    <div className="h-px flex-1 bg-white/5" />
                                    <p style={{color: accentColor}} className="text-[9px] font-black uppercase tracking-[0.3em] whitespace-nowrap">Vote Registered • +10 XP</p>
                                    <div className="h-px flex-1 bg-white/5" />
                                </div>
                            )}
                        </section>
                    </div>

                    {/* RIGHT PANEL: Live Chat */}
                    <div className="flex flex-col bg-white/[0.01] h-[500px] lg:h-full overflow-hidden shrink-0 lg:shrink">
                        <div className="p-6 md:p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02] shrink-0">
                            <div className="flex flex-col">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 flex items-center gap-2">
                                    <Radio size={14} className="text-red-500" />
                                    Live Match Feedback Loop
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Channel Secured</span>
                                </div>
                            </div>
                            <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">2.4K ACTIVE</span>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar bg-black/40 scroll-smooth">
                            {chats.map((c, i) => (
                                <div key={i} className={`flex flex-col gap-3 group animate-in slide-in-from-bottom-4 duration-700 ${c.user === 'You' ? 'items-end' : 'items-start'}`}>
                                    <div className={`flex items-center gap-4 ${c.user === 'You' ? 'flex-row-reverse' : ''}`}>
                                        <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-xs font-black text-white/20 transition-all group-hover:border-[var(--accent-30)]" 
                                            style={{ boxShadow: `0 10px 20px ${accentColor}05` }}>
                                            {c.user[0]}
                                        </div>
                                        <div className={`flex flex-col ${c.user === 'You' ? 'items-end' : ''}`}>
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">{c.user}</span>
                                            <span className="text-[8px] font-bold text-white/10 mt-0.5">{c.time}</span>
                                        </div>
                                    </div>
                                    <div 
                                        className={`backdrop-blur-2xl p-5 rounded-3xl max-w-[80%] relative overflow-hidden transition-all duration-300 group-hover:scale-[1.02] shadow-2xl ${c.user === 'You' ? 'rounded-tr-none' : 'rounded-tl-none'}`}
                                        style={{ 
                                            backgroundColor: c.user === 'You' ? `${accentColor}15` : 'rgba(255,255,255,0.03)',
                                            border: `1px solid ${c.user === 'You' ? `${accentColor}40` : 'rgba(255,255,255,0.1)'}`,
                                            boxShadow: c.user === 'You' ? `0 20px 40px ${accentColor}10` : 'none'
                                        }}
                                    >
                                        <div className={`absolute top-0 w-1.5 h-full ${c.user === 'You' ? 'right-0' : 'left-0'}`} style={{ backgroundColor: accentColor }} />
                                        <p className="text-sm font-medium text-white/95 leading-relaxed tracking-tight">{c.text}</p>
                                    </div>
                                </div>
                            ))}
                            <div id="chat-end" />
                        </div>

                        <div className="px-4 py-4 md:px-8 md:py-6 border-t border-white/5 bg-black/80 backdrop-blur-3xl shrink-0 relative z-[500] shadow-[0_-20px_60px_rgba(0,0,0,0.5)]">
                            <div className="flex gap-2 md:gap-4 items-center bg-white/[0.04] p-1.5 md:p-2 rounded-[24px] md:rounded-[28px] border border-white/10 ring-1 ring-white/5 shadow-2xl relative max-w-[98%] ml-auto focus-within:border-[var(--accent-40)] transition-all">
                                <input 
                                    type="text" 
                                    value={chatMsg}
                                    onChange={(e) => setChatMsg(e.target.value)}
                                    placeholder="Enter tactical signal..."
                                    className="flex-1 bg-transparent border-none rounded-2xl px-6 py-3 text-sm font-bold text-white focus:outline-none placeholder:text-white/20 select-none"
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                                />
                                <button 
                                    onClick={handleSendChat}
                                    style={{ backgroundColor: accentColor }}
                                    className="px-8 py-3 rounded-[20px] text-black font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl hover:scale-[1.05] active:scale-95 transition-all"
                                >
                                    SEND SIGNAL
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
