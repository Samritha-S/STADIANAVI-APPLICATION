"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useStadium } from '@/context/StadiumContext';
import { X, MessageSquare, Send, Sparkles } from 'lucide-react';

export const GeminiConcierge = ({ buttonColor, iconColor }: { buttonColor?: string; iconColor?: string }) => {
    const { cvDensityMap, matchClock, conversationalHistory, addMessage, accentColor } = useStadium();
    const [inputValue, setInputValue] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [conversationalHistory, isOpen]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim()) return;
        addMessage(inputValue);
        setInputValue("");
    };

    return (
        <>
            <button 
                onClick={() => setIsOpen(true)}
                style={{ backgroundColor: buttonColor || '#00f2ff', boxShadow: `0 0 30px ${(buttonColor || '#00f2ff')}55` }}
                className="w-14 h-14 rounded-full flex items-center justify-center animate-pulse border border-white/20 transition-all hover:scale-110 active:scale-95"
            >
                <Sparkles size={24} style={{ color: iconColor || 'black' }} />
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-8 bg-black/60 backdrop-blur-md pointer-events-none">
                    <div className="relative w-full max-w-md h-[500px] bg-[#0A0A0B]/95 backdrop-blur-3xl border border-white/10 rounded-[40px] flex flex-col shadow-2xl pointer-events-auto animate-in zoom-in-95 duration-500 overflow-hidden">
                        {/* Header */}
                        <div className="bg-[#00f2ff] p-8 flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-3">
                                <Sparkles size={20} className="text-black" />
                                <span className="text-black font-black text-xs uppercase tracking-[0.2em]">Gemini Tactical AI</span>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="text-black/60 hover:text-black transition-all">
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar" ref={scrollRef}>
                            {conversationalHistory.map((msg, i) => (
                                <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] px-6 py-4 rounded-[24px] text-sm leading-relaxed shadow-xl ${
                                        msg.sender === 'user' 
                                        ? 'bg-[#00f2ff]/10 border border-[#00f2ff]/30 text-[#00f2ff]' 
                                        : 'bg-white/5 border border-white/10 text-white/80'
                                    }`}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}

                            {/* Proactive Intel Node */}
                            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-[28px] p-6 space-y-4 shadow-inner">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]" />
                                    <span className="text-emerald-400 font-black text-[9px] uppercase tracking-[0.3em]">Neural Insight</span>
                                </div>
                                <p className="text-xs text-white/40 leading-relaxed italic">
                                    {matchClock.endsWith(":00") ? "Crowd density peaking in North Sector. Redirection recommended via Stall 04." : "All systems nominal. Spatial drift within acceptable bounds."}
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleSend} className="p-8 bg-black/40 border-t border-white/5 shrink-0">
                            <div className="flex gap-4 items-center bg-white/5 p-2 rounded-3xl border border-white/10">
                                <input 
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    placeholder="Query spatial engine..."
                                    className="flex-1 bg-transparent border-none px-6 py-4 text-xs font-bold text-white focus:outline-none placeholder:text-white/20 italic"
                                />
                                <button type="submit" className="bg-[#00f2ff] text-black w-14 h-14 rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl">
                                    <Send size={20} />
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};
