"use client";

import React, { useState, useEffect } from 'react';
import { useStadium } from '@/context/StadiumContext';
import { User, Settings, Bell, Palette, CreditCard, Shield, Camera } from 'lucide-react';

export const SettingsView = ({ visible }: { visible: boolean }) => {
    const { accentColor, setAccentColor, userData } = useStadium();
    const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'notifications' | 'payments' | 'security'>('profile');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(userData?.avatarUrl || null);
    
    // Bio State
    const [firstName, setFirstName] = useState(userData?.firstName || "John");
    const [lastName, setLastName] = useState(userData?.lastName || "Doe");
    const [email, setEmail] = useState(userData?.email || "hello@example.com");
    const [seat, setSeat] = useState(userData?.seat || "E4 / 12 / 07");
    const [dietary, setDietary] = useState(userData?.dietary || "None");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        try {
            const saved = localStorage.getItem('stadia_nav_user_profile');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.firstName) setFirstName(parsed.firstName);
                if (parsed.lastName) setLastName(parsed.lastName);
                if (parsed.email) setEmail(parsed.email);
                if (parsed.seat) setSeat(parsed.seat);
                if (parsed.dietary) setDietary(parsed.dietary);
                if (parsed.avatarUrl) setAvatarUrl(parsed.avatarUrl);
            }
        } catch (e) {
            console.error("Local load failed", e);
        }
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await fetch('/api/users/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: userData?.id || 'guest-demo-user',
                    firstName,
                    lastName,
                    email,
                    avatarUrl,
                    seatLabel: seat,
                    dietaryPreference: dietary
                })
            });
            localStorage.setItem('stadia_nav_user_profile', JSON.stringify({
                firstName, lastName, email, seat, dietary, avatarUrl
            }));
            alert("Meta Details Secured in Database");
        } catch (e) {
            console.error("Save failed", e);
        } finally {
            setIsSaving(false);
        }
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

    if (!visible) return null;

    return (
        <div className="fixed top-[120px] inset-x-0 bottom-0 z-[300] flex items-center justify-center p-8 bg-black/60 backdrop-blur-md pointer-events-none fade-in">
            <div className="w-[800px] h-full bg-[#0A0A0B]/95 backdrop-blur-2xl border border-white/10 rounded-3xl flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.8)] pointer-events-auto overflow-hidden animate-in zoom-in-95 duration-300">
                
                {/* Header */}
                <div className="p-8 border-b border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent shrink-0">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center border shadow-lg" style={{ backgroundColor: `${accentColor}15`, borderColor: `${accentColor}40` }}>
                            <Settings style={{ color: accentColor }} size={24} />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black uppercase tracking-tighter text-white">Fan Profile</h2>
                            <p className="text-[10px] uppercase font-bold text-white/40 tracking-[0.3em]">Manage Identity & Preferences</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar Nav */}
                    <div className="w-64 border-r border-white/5 p-6 flex flex-col gap-2 shrink-0">
                        <button onClick={() => setActiveTab('profile')} className={`flex items-center gap-3 px-4 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'profile' ? 'bg-white/10 text-white' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}>
                            <User size={16} /> Identity Details
                        </button>
                        <button onClick={() => setActiveTab('preferences')} className={`flex items-center gap-3 px-4 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'preferences' ? 'bg-white/10 text-white' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}>
                            <Palette size={16} /> Preferences
                        </button>
                        <button onClick={() => setActiveTab('notifications')} className={`flex items-center gap-3 px-4 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'notifications' ? 'bg-white/10 text-white' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}>
                            <Bell size={16} /> Notification Rules
                        </button>
                        <button onClick={() => setActiveTab('payments')} className={`flex items-center gap-3 px-4 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'payments' ? 'bg-white/10 text-white' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}>
                            <CreditCard size={16} /> Saved Payment Methods
                        </button>
                        <button onClick={() => setActiveTab('security')} className={`flex items-center gap-3 px-4 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all mt-auto ${activeTab === 'security' ? 'bg-white/10 text-white' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}>
                            <Shield size={16} /> Privacy & Security
                        </button>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                        {activeTab === 'profile' && (
                            <div className="space-y-8 fade-in">
                                {/* Profile Picture */}
                                <div className="flex items-center gap-6">
                                    <div 
                                        onClick={() => document.getElementById('avatar-upload')?.click()}
                                        className="w-24 h-24 rounded-full border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-white/5 transition-all group relative overflow-hidden"
                                        style={{ borderColor: `${accentColor}40` }}
                                    >
                                        {avatarUrl ? (
                                            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <>
                                                <Camera size={20} className="text-white/30 group-hover:text-white/60" />
                                                <span className="text-[9px] uppercase font-bold text-white/40">Upload</span>
                                            </>
                                        )}
                                        <input 
                                            id="avatar-upload" 
                                            type="file" 
                                            accept="image/*" 
                                            className="hidden" 
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) setAvatarUrl(URL.createObjectURL(file));
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black uppercase tracking-wider text-white">Avatar Image</h3>
                                        <p className="text-xs text-white/40 mt-1">At least 800x800 px recommended. JPG or PNG is allowed.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-white/40">First Name</label>
                                        <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white transition-colors" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Last Name</label>
                                        <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white transition-colors" />
                                    </div>
                                    <div className="space-y-2 col-span-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Email Address</label>
                                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white transition-colors" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Seat Registration (Section/Row/Num)</label>
                                        <input type="text" value={seat} onChange={(e) => setSeat(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white transition-colors" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Dietary Preferences</label>
                                        <select value={dietary} onChange={(e) => setDietary(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white transition-colors appearance-none text-white">
                                            <option>None</option>
                                            <option>Vegetarian</option>
                                            <option>Vegan</option>
                                            <option>Gluten-Free</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-white/5">
                                    <button 
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        style={{ backgroundColor: accentColor }} 
                                        className="px-6 py-3 rounded-xl text-black font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-all disabled:opacity-50"
                                    >
                                        {isSaving ? 'Securing...' : 'Save Changes'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'preferences' && (
                            <div className="space-y-8 fade-in">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <Palette className="text-white/50" size={20} />
                                        <h3 className="text-lg font-black uppercase tracking-wider text-white">Global Application Theme</h3>
                                    </div>
                                    <p className="text-xs text-white/40 mb-4">Choose your franchise allegiance to seamlessly skin the entire Digital Twin platform with your team's colors.</p>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        {themes.map(t => (
                                            <button 
                                                key={t.name}
                                                onClick={() => setAccentColor(t.color)}
                                                className="relative h-20 rounded-2xl flex items-center justify-between px-6 border-2 group transition-all"
                                                style={{ 
                                                    backgroundColor: `${t.bg}40`, 
                                                    borderColor: accentColor === t.color ? t.color : 'rgba(255,255,255,0.1)' 
                                                }}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-6 h-6 rounded-full border border-white/20 shadow-inner" style={{ backgroundColor: t.color }} />
                                                    <span className="text-xs font-black uppercase tracking-widest text-white">{t.name}</span>
                                                </div>
                                                {accentColor === t.color && <div className="w-3 h-3 bg-white rounded-full shadow-[0_0_10px_white]" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4 pt-6 border-t border-white/5">
                                    <h3 className="text-lg font-black uppercase tracking-wider text-white">Data Collection</h3>
                                    <label className="flex items-start gap-4 p-4 rounded-xl border border-white/10 hover:bg-white/5 transition-all cursor-pointer">
                                        <input type="checkbox" defaultChecked className="mt-1 w-4 h-4" />
                                        <div>
                                            <p className="text-sm font-bold text-white mb-1">Share Anonymous Location Data</p>
                                            <p className="text-xs text-white/40">Help the CV Pipeline accurately gauge wait times by pinging your device's Bluetooth distance beacon to services endpoints.</p>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        )}

                        {activeTab === 'notifications' && (
                            <div className="space-y-8 fade-in">
                                <div className="space-y-4">
                                    <h3 className="text-lg font-black uppercase tracking-wider text-white">Interactive Alerting</h3>
                                    <p className="text-xs text-white/40">Configure how you receive critical stadium updates and social pings.</p>
                                    
                                    <div className="space-y-3">
                                        {[
                                            { title: 'Emergency SOS Alerts', desc: 'Critical security & medical broadcasts', default: true },
                                            { title: 'Order Status Pings', desc: 'Live updates from food stalls & concierge', default: true },
                                            { title: 'Social Pulse Notifications', desc: 'When friends flare or message you', default: false },
                                            { title: 'Match Event Highlights', desc: 'Wickets, Sixes, and Tactical updates', default: true }
                                        ].map(n => (
                                            <div key={n.title} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                                                <div>
                                                    <p className="text-sm font-bold text-white">{n.title}</p>
                                                    <p className="text-[10px] text-white/20 uppercase tracking-widest mt-1">{n.desc}</p>
                                                </div>
                                                <div className={`w-10 h-5 rounded-full relative transition-all cursor-pointer ${n.default ? 'bg-emerald-500/40 border border-emerald-500/50' : 'bg-white/5 border border-white/10'}`}>
                                                    <div className={`absolute top-1 bottom-1 w-3 rounded-full transition-all ${n.default ? 'right-1 bg-white' : 'left-1 bg-white/20'}`} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'payments' && (
                            <div className="space-y-8 fade-in">
                                <div className="space-y-6">
                                    <h3 className="text-lg font-black uppercase tracking-wider text-white">Secured Wallets</h3>
                                    <div className="p-8 border-2 border-dashed border-white/5 rounded-[32px] flex flex-col items-center justify-center text-center gap-4 bg-white/[0.01] hover:bg-white/[0.02] transition-all cursor-pointer group">
                                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-2xl group-hover:scale-110 transition-all">💳</div>
                                        <div>
                                            <p className="text-sm font-bold text-white">No Payment Methods Saved</p>
                                            <p className="text-[10px] text-white/20 uppercase tracking-[0.2em] mt-1 italic">Link your UPI or Card for 1-tap Ordering</p>
                                        </div>
                                        <button className="mt-2 px-6 py-2 bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/20 transition-all">Add New Method</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="space-y-8 fade-in">
                                <section className="space-y-4">
                                    <h3 className="text-lg font-black uppercase tracking-wider text-white">Data Sovereignity</h3>
                                    <div className="grid grid-cols-1 gap-4">
                                        {[
                                            { title: 'Biometric Access Control', desc: 'Use FaceID for rapid entry gate scanning' },
                                            { title: 'Bluetooth Beacon Proximity', desc: 'Allow stadium nodes to detect your device' },
                                            { title: 'Encrypted Chat Logs', desc: 'Secure history of your FanZone interactions' }
                                        ].map(s => (
                                            <div key={s.title} className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-bold text-white">{s.title}</p>
                                                    <p className="text-[10px] text-white/20 uppercase tracking-widest mt-1">{s.desc}</p>
                                                </div>
                                                <button className="text-[9px] font-black uppercase tracking-widest px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-all">Configure</button>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="p-6 bg-red-900/10 border border-red-500/20 rounded-3xl mt-8">
                                        <p className="text-xs font-bold text-red-400 mb-2 uppercase tracking-tighter">Danger Zone</p>
                                        <p className="text-[10px] text-red-400/40 leading-relaxed uppercase font-bold tracking-widest italic">Requesting a full account reset will wipe all Loyalty Points, Social Connections, and Match Day credentials from the stadium node.</p>
                                        <button className="mt-4 text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-red-500 transition-colors underline underline-offset-4">Reset Fan Profile</button>
                                    </div>
                                </section>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
