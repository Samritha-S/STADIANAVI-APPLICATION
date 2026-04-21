"use client";

import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import {
  Map as MapIcon, Video, AlertTriangle, MessageSquare,
  Utensils, Droplets, GitBranch, Activity, Users,
  Megaphone, Trash2, ShieldAlert, Radio, TrendingUp,
  CheckCircle, XCircle, Bell, Server, ShoppingBag,
  Clock, Package, Truck, CheckCircle2, X
} from 'lucide-react';
import Link from 'next/link';
import { StadiumProvider, useStadium } from '@/context/StadiumContext';

// --------------- Data & Types ---------------
type NavTab = 'overview' | 'cctv' | 'sos' | 'orders' | 'heatmap' | 'services' | 'social' | 'routing';

interface SosAlert {
  id: string;
  user: string;
  userId?: string;
  reason: string;
  status: 'Active' | 'Dispatched' | 'Resolved';
  time: string;
  seatLabel?: string;
}
interface SocialPost {
  id: string; userName: string; text: string; flags: number; time: string;
}
interface Section {
  id: string; active: boolean;
}

interface Order {
  id: string; stallName: string; seatLabel: string; status: string; totalAmount: number; createdAt: string; items: any[];
}

const SectionPanel = ({ title, children, className = '' }: { title?: string; children: React.ReactNode; className?: string }) => (
  <div className={`bg-[#0D0D0F] border border-white/[0.08] rounded-2xl overflow-hidden ${className}`}>
    {title && (
      <div className="px-6 py-4 border-b border-white/[0.06] bg-white/[0.02]">
        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40">{title}</span>
      </div>
    )}
    <div className="p-6">{children}</div>
  </div>
);

const Badge = ({ count, color = 'red' }: { count: number; color?: string }) => {
  if (count === 0) return null;
  return (
    <span
      className={`absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[9px] font-black text-white px-1 z-10 shadow-lg`}
      style={{ backgroundColor: color === 'red' ? '#dc2626' : color === 'yellow' ? '#ca8a04' : '#16a34a' }}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
};

// Overview Tab
const OverviewView = ({ sosAlerts, socialFeed }: { sosAlerts: SosAlert[]; socialFeed: SocialPost[] }) => {
  const { foodStalls, restrooms, cvDensityMap } = useStadium();
  const activeAlerts = sosAlerts.filter(a => a.status === 'Active').length;
  const flaggedPosts = socialFeed.filter(p => p.flags > 0).length;
  const busyStalls = foodStalls.filter((s: any) => parseInt(s.waitTime || '0') > 12).length;

  const kpis = [
    { label: 'Active SOS', value: activeAlerts, icon: <ShieldAlert size={20} />, color: '#dc2626', glow: 'rgba(220,38,38,0.3)' },
    { label: 'Flagged Posts', value: flaggedPosts, icon: <MessageSquare size={20} />, color: '#ca8a04', glow: 'rgba(202,138,4,0.3)' },
    { label: 'Busy Stalls', value: `${busyStalls}/${foodStalls.length}`, icon: <Utensils size={20} />, color: busyStalls > 0 ? '#f97316' : '#16a34a', glow: 'rgba(249,115,22,0.2)' },
    { label: 'CV Density Pts', value: cvDensityMap.length, icon: <Activity size={20} />, color: '#00f2ff', glow: 'rgba(0,242,255,0.3)' },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-4">
        {kpis.map(k => (
          <div key={k.label} className="bg-[#0D0D0F] border border-white/[0.08] rounded-2xl p-5 flex items-center gap-4"
            style={{ boxShadow: `0 0 30px ${k.glow}` }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${k.color}20`, color: k.color }}>
              {k.icon}
            </div>
            <div>
              <div className="text-2xl font-black" style={{ color: k.color }}>{k.value}</div>
              <div className="text-[9px] uppercase font-black text-white/30 tracking-widest">{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent SOS + Social flagged */}
      <div className="grid grid-cols-2 gap-6">
        <SectionPanel title="Recent SOS Alerts">
          <div className="space-y-3">
            {sosAlerts.slice(0, 2).map(a => (
              <div key={a.id} className="flex items-center gap-3 p-3 bg-red-950/30 border border-red-600/30 rounded-xl">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-white truncate">{a.user}</div>
                  <div className="text-[10px] text-red-300 italic truncate">"{a.reason}"</div>
                </div>
                <span className={`text-[9px] px-2 py-0.5 rounded font-black shrink-0 ${a.status === 'Active' ? 'bg-red-600 text-white' : 'bg-yellow-600/30 text-yellow-400'}`}>{a.status}</span>
              </div>
            ))}
          </div>
        </SectionPanel>

        <SectionPanel title="Top Flagged Posts">
          <div className="space-y-3">
            {socialFeed.filter(f => f.flags > 0).map(f => (
              <div key={f.id} className="flex items-center gap-3 p-3 bg-yellow-950/20 border border-yellow-600/20 rounded-xl">
                <div className="w-5 h-5 bg-yellow-500/20 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-[9px] font-black text-yellow-400">{f.flags}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-bold text-white/50">{f.userName}</div>
                  <div className="text-xs text-white truncate">{f.text}</div>
                </div>
              </div>
            ))}
          </div>
        </SectionPanel>
      </div>

      {/* Live System Status */}
      <SectionPanel title="System Status">
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'CV Pipeline', status: 'Operational', ok: true },
            { label: 'Socket Engine', status: 'Connected', ok: true },
            { label: 'Supabase DB', status: 'Latency 12ms', ok: true },
            { label: 'CCTV Feeds', status: '3 / 3 Live', ok: true },
            { label: 'NavMesh', status: 'All Nodes Open', ok: true },
            { label: 'Emergency net', status: 'Standby', ok: false },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-3 p-3 bg-black/40 rounded-xl border border-white/5">
              {s.ok ? <CheckCircle size={14} className="text-emerald-400 shrink-0" /> : <XCircle size={14} className="text-yellow-500 shrink-0" />}
              <div>
                <div className="text-[10px] font-black text-white/60">{s.label}</div>
                <div className={`text-[9px] font-bold ${s.ok ? 'text-emerald-400' : 'text-yellow-400'}`}>{s.status}</div>
              </div>
            </div>
          ))}
        </div>
      </SectionPanel>
    </div>
  );
};

// CCTV Tab
const CCTVView = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-3 gap-5">
      {[{ id: 1, loc: 'North Concourse A', zone: 'A' }, { id: 2, loc: 'Garware Pavilion', zone: 'B' }, { id: 3, loc: 'East Gate 4', zone: 'C' },
        { id: 4, loc: 'Press Box Level', zone: 'D' }, { id: 5, loc: 'VIP Entry', zone: 'E' }, { id: 6, loc: 'Pitch Perimeter', zone: 'F' }].map(cam => (
        <div key={cam.id} className="bg-[#0D0D0F] border border-white/[0.08] rounded-2xl overflow-hidden group hover:border-white/20 transition-all">
          <div className="aspect-video bg-black relative flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
            <div className="absolute top-2 left-2 flex items-center gap-1.5">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-[8px] font-black text-red-400 uppercase">LIVE</span>
            </div>
            <div className="absolute top-2 right-2 bg-black/60 px-2 py-0.5 rounded text-[8px] font-black text-white/40">CAM {String(cam.id).padStart(2,'0')}</div>
            <div className="text-white/10 text-4xl font-black">📷</div>
          </div>
          <div className="px-4 py-3 border-t border-white/[0.05] flex justify-between items-center">
            <div>
              <div className="text-xs font-bold text-white">{cam.loc}</div>
              <div className="text-[9px] text-white/30 uppercase tracking-wider">Zone {cam.zone}</div>
            </div>
            <button className="text-[9px] px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg font-black uppercase text-white/50 hover:bg-white/10 transition-all">Full</button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Heatmap Tab
const HeatmapView = () => (
  <div className="space-y-6">
    <SectionPanel title="2D Drone Radar — Live Crowd Density">
      <div className="w-full flex justify-center py-4">
        <div className="relative w-full max-w-[400px] aspect-square bg-[#050505] rounded-full border border-white/10 overflow-hidden shadow-2xl">
          {/* Circular Ground Features */}
          <div className="absolute inset-[2%] border-2 border-[#00f2ff]/10 rounded-full" />
          <div className="absolute inset-[32%] border border-dashed border-white/5 rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[14%] h-[26%] bg-amber-900/10 border border-amber-600/10 rounded-sm" />
          
          {/* Heatmap blobs (Simulated) */}
          <div className="absolute top-[20%] left-[25%] w-20 h-20 bg-red-600/40 rounded-full blur-2xl animate-pulse" />
          <div className="absolute bottom-[28%] right-[22%] w-24 h-24 bg-yellow-500/30 rounded-full blur-2xl animate-pulse" />
          <div className="absolute top-[55%] left-[45%] w-12 h-12 bg-red-500/20 rounded-full blur-xl animate-pulse" />
          
          {/* Sector Labels */}
          {['North Stand','South Block','East Gate','West VIP'].map((z,i) => (
            <div key={z} className={`absolute text-[8px] font-black uppercase text-white/20 tracking-widest ${
              i===0 ? 'top-4 left-1/2 -translate-x-1/2' : 
              i===1 ? 'bottom-4 left-1/2 -translate-x-1/2' : 
              i===2 ? 'right-4 top-1/2 -translate-y-1/2 rotate-90' : 
              'left-4 top-1/2 -translate-y-1/2 -rotate-90'
            }`}>{z}</div>
          ))}
          <span className="absolute bottom-3 right-6 text-[8px] text-white/10 font-black uppercase tracking-widest z-10">STADIANAV RADAR V2</span>
        </div>
      </div>
    </SectionPanel>

    {/* Zone density table */}
    <SectionPanel title="Zone Density Breakdown">
      <div className="grid grid-cols-2 gap-4">
        {[
          { zone: 'North Concourse A', density: 87, level: 'Critical' },
          { zone: 'Garware Pavilion', density: 63, level: 'High' },
          { zone: 'East Block Lower', density: 41, level: 'Moderate' },
          { zone: 'West VIP Terrace', density: 22, level: 'Low' },
          { zone: 'Press Box Level', density: 55, level: 'High' },
          { zone: 'South Grandstand', density: 78, level: 'Critical' },
        ].map(z => (
          <div key={z.zone} className="flex items-center gap-4 p-3 bg-black/40 rounded-xl border border-white/5">
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-white mb-1">{z.zone}</div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${z.density}%`, backgroundColor: z.density > 75 ? '#dc2626' : z.density > 50 ? '#f97316' : '#16a34a' }} />
              </div>
            </div>
            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded shrink-0 ${z.level === 'Critical' ? 'bg-red-500/20 text-red-400' : z.level === 'High' ? 'bg-orange-500/20 text-orange-400' : z.level === 'Moderate' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-emerald-500/20 text-emerald-400'}`}>{z.density}%</span>
          </div>
        ))}
      </div>
    </SectionPanel>
  </div>
);

// SOS Tab
const SOSView = ({ sosAlerts, handleDispatch, handleResolve, handleClear }: { sosAlerts: SosAlert[]; handleDispatch: (alertId: string, userId: string, seatLabel?: string) => Promise<void>; handleResolve: (alertId: string) => Promise<void>; handleClear: (alertId: string) => Promise<void>; }) => {
  const [filter, setFilter] = useState<'active' | 'resolved'>('active');
  const filteredAlerts = filter === 'active' 
      ? sosAlerts.filter(a => a.status === 'Active' || a.status === 'Dispatched')
      : sosAlerts.filter(a => a.status === 'Resolved');

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b border-white/10 pb-4 mb-4">
          <button 
             onClick={() => setFilter('active')}
             className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filter === 'active' ? 'bg-[#00f2ff]/20 text-[#00f2ff] border border-[#00f2ff]/30' : 'text-white/40 hover:text-white/70 bg-transparent border border-transparent'}`}
          >
             Live Feed ({sosAlerts.filter(a => a.status === 'Active' || a.status === 'Dispatched').length})
          </button>
          <button 
             onClick={() => setFilter('resolved')}
             className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filter === 'resolved' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-white/40 hover:text-white/70 bg-transparent border border-transparent'}`}
          >
             Resolved Log ({sosAlerts.filter(a => a.status === 'Resolved').length})
          </button>
      </div>

      {filteredAlerts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-white/20">
          <CheckCircle size={48} className="mb-4" />
          <p className="font-black uppercase tracking-widest text-sm text-center">No {filter === 'active' ? 'Active Alerts' : 'Resolved Logs'} Found</p>
        </div>
      )}
      {filteredAlerts.map(alert => (
        <div key={alert.id} className={`border rounded-2xl p-6 relative overflow-hidden bg-[#0D0D0F] ${alert.status === 'Active' ? 'shadow-[0_0_15px_rgba(220,38,38,0.2)] border-red-500/30' : alert.status === 'Dispatched' ? 'border-yellow-600/30' : 'border-white/[0.08]'}`}>
          {alert.status === 'Resolved' && <div className="absolute inset-0 bg-emerald-950/10 pointer-events-none" />}
          <div className="flex items-start justify-between mb-4 relative z-10">
            <div className="flex items-center gap-3">
              {alert.status === 'Active' && <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping shrink-0 shadow-[0_0_8px_#ef4444]" />}
              <span className={`text-[10px] px-3 py-1 rounded-md font-black uppercase tracking-widest ${alert.status === 'Active' ? 'bg-red-600/20 text-red-500 border border-red-500/30' : alert.status === 'Dispatched' ? 'bg-yellow-600/20 text-yellow-400 border border-yellow-500/30' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>{alert.status}</span>
              <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">{alert.id}</span>
            </div>
            <span className="text-[10px] text-white/30 font-bold tabular-nums">{alert.time}</span>
          </div>
          <div className="mb-1 text-base font-black text-white relative z-10">{alert.user}</div>
          <div className="text-sm font-bold opacity-80 italic mb-5 px-4 py-2 rounded-lg relative z-10" style={{ backgroundColor: alert.status === 'Resolved' ? 'rgba(16,185,129,0.1)' : 'rgba(220,38,38,0.1)', color: alert.status === 'Resolved' ? '#a7f3d0' : '#fecaca' }}>"{alert.reason}"</div>
          <div className="flex gap-3 relative z-10">
            {filter === 'active' && (
              <>
                <button onClick={() => handleDispatch(alert.id, alert.userId || 'unknown', alert.seatLabel)}
                  className="flex-1 py-3 bg-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-red-500 transition-all shadow-lg shadow-red-600/30">
                  Dispatch Unit
                </button>
                <button onClick={() => handleResolve(alert.id)}
                  className="flex-1 py-3 border border-emerald-500/40 rounded-xl text-[10px] font-black uppercase tracking-widest text-emerald-400 hover:bg-emerald-500/10 transition-all">
                  Mark Resolved
                </button>
              </>
            )}
            <button onClick={() => handleClear(alert.id)}
              className={`${filter === 'resolved' ? 'flex-1' : 'px-6'} py-3 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/40 hover:bg-white/5 hover:text-white transition-all`}>
              Delete Log
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

// Services Tab
const ServicesView = ({ handleDispatch }: { handleDispatch: (id: string, userId: string, seatLabel?: string) => void }) => {
  const { foodStalls, restrooms } = useStadium();
  return (
    <div className="space-y-6">
      <SectionPanel title="Food Stall Queue Monitor">
        <div className="space-y-3">
          {(foodStalls as any[]).map(stall => {
            const wait = parseInt(stall.waitTime || '0');
            return (
              <div key={stall.id} className="flex items-center gap-4 p-4 bg-black/40 rounded-xl border border-white/5">
                <Utensils size={14} className={wait > 12 ? 'text-red-400' : 'text-emerald-400'} />
                <div className="flex-1">
                  <div className="text-sm font-bold text-white mb-1">{stall.name}</div>
                  <div className="text-[10px] text-white/40 uppercase">{stall.locationID}</div>
                </div>
                <div className="h-1.5 w-24 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${Math.min(100, wait * 5)}%`, backgroundColor: wait > 12 ? '#dc2626' : wait > 7 ? '#f97316' : '#16a34a' }} />
                </div>
                <span className={`text-xs font-black px-3 py-1 rounded-lg ${wait > 12 ? 'bg-red-500/20 text-red-400' : wait > 7 ? 'bg-orange-500/20 text-orange-400' : 'bg-emerald-500/20 text-emerald-400'}`}>{wait} min</span>
              </div>
            );
          })}
        </div>
      </SectionPanel>
      <SectionPanel title="Restroom Density Status">
        <div className="grid grid-cols-2 gap-4">
          {(restrooms as any[]).map(wc => (
            <div key={wc.id} className="p-4 bg-black/40 rounded-xl border border-white/5 flex items-center gap-3">
              <Droplets size={16} className="text-blue-400 shrink-0" />
              <div>
                <div className="text-sm font-bold text-white">{wc.name}</div>
                <div className="text-[10px] text-white/40">{wc.locationID}</div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleDispatch(wc.id, (wc as any).userId)}
                      className="flex-1 py-1.5 bg-red-600 rounded text-[9px] font-black uppercase text-white shadow-lg shadow-red-600/30 hover:bg-red-500 transition-colors"
                    >
                      Dispatch Help
                    </button>
                    <button className="flex-1 py-1.5 border border-red-500/50 rounded text-[9px] font-black uppercase text-red-400">Clear</button>
                  </div>
              </div>
            </div>
          ))}
        </div>
      </SectionPanel>
    </div>
  );
};

// Social Tab
const SocialView = ({ socialFeed, handleNotifyUser, handleDeletePost }: { socialFeed: SocialPost[]; handleNotifyUser: (id: string, currentFlags: number) => Promise<void>; handleDeletePost: (id: string) => Promise<void>; }) => (
  <div className="space-y-4">
    {socialFeed.length === 0 && (
      <div className="flex flex-col items-center justify-center py-20 text-white/20">
        <CheckCircle size={48} className="mb-4" />
        <p className="font-black uppercase tracking-widest text-sm">Clean Feed</p>
      </div>
    )}
    {socialFeed.map(feed => (
      <div key={feed.id} className={`border rounded-2xl p-5 relative ${feed.flags > 2 ? 'bg-yellow-950/20 border-yellow-600/30' : 'bg-[#0D0D0F] border-white/[0.08]'}`}>
        {feed.flags > 0 && (
          <div className="absolute -top-2 -right-2 bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg border border-red-500">
            {feed.flags} {feed.flags === 1 ? 'Flag' : 'Flags'}
          </div>
        )}
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-black text-white">{feed.userName}</span>
          <div className="flex gap-2">
            <button onClick={() => handleNotifyUser(feed.id, feed.flags)} 
              className="flex items-center gap-1.5 text-[10px] font-black uppercase px-3 py-1.5 rounded-lg bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 hover:bg-yellow-500/20 transition-all">
              <Megaphone size={11} /> Flag
            </button>
            <button onClick={() => handleDeletePost(feed.id)} 
              className="flex items-center gap-1.5 text-[10px] font-black uppercase px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all">
              <Trash2 size={11} /> Delete
            </button>
          </div>
        </div>
        <p className="text-sm text-white/70">{feed.text}</p>
      </div>
    ))}
  </div>
);

// Routing Tab
const RoutingView = ({ sections, setSections }: { sections: Section[]; setSections: React.Dispatch<React.SetStateAction<Section[]>> }) => {
  const toggleSection = async (id: string, active: boolean) => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://127.0.0.1:3002";
      await fetch(`${baseUrl}/api/admin/toggle-section`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockId: id, isActive: active })
      });
      setSections(prev => prev.map(s => s.id === id ? { ...s, active } : s));
    } catch (e) { console.error("Reroute failed", e); }
  };

  return (
    <div className="space-y-6">
      <SectionPanel title="NavMesh Zone Overrides">
        <div className="space-y-3">
          {sections.map(section => (
            <div key={section.id} className="flex items-center justify-between p-4 bg-black/40 rounded-xl border border-white/5">
              <div className="flex items-center gap-3">
                <GitBranch size={14} className={section.active ? 'text-emerald-400' : 'text-red-400'} />
                <span className="text-sm font-bold text-white">{section.id.replace(/-/g, ' ')}</span>
              </div>
              <button 
                onClick={() => toggleSection(section.id, !section.active)}
                className={`px-5 py-2 rounded-xl text-xs font-black uppercase transition-all ${section.active ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-emerald-500/20 hover:text-emerald-400 hover:border-emerald-500/30'}`}>
                {section.active ? 'Open' : 'Closed'}
              </button>
            </div>
          ))}
        </div>
      </SectionPanel>
    </div>
  );
};

// Orders Tab
const OrdersView = ({ orders, setOrders }: { orders: Order[]; setOrders: React.Dispatch<React.SetStateAction<Order[]>> }) => {
  const handleStatusUpdate = async (orderId: string, userId: string, newStatus: string) => {
    try {
      // 1. Update Database
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, status: newStatus })
      });
      
      if (res.ok) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      }
    } catch (err) {
      console.error("Order update failed", err);
    }
  };

  const statusColors: Record<string, string> = {
    'PENDING': 'bg-white/10 text-white/50 border-white/20',
    'PREPARING': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'DELIVERING': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    'DELIVERED': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    'CANCELLED': 'bg-red-500/20 text-red-400 border-red-500/30'
  };

  return (
    <div className="space-y-4">
      {orders.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-white/20">
          <ShoppingBag size={48} className="mb-4" />
          <p className="font-black uppercase tracking-widest text-sm">No Orders Received</p>
        </div>
      )}
      <div className="grid grid-cols-1 gap-4">
        {orders.map(order => (
          <div key={order.id} className="bg-[#0D0D0F] border border-white/[0.08] rounded-2xl overflow-hidden hover:border-white/20 transition-all">
            <div className="px-6 py-4 flex items-center justify-between border-b border-white/[0.04] bg-white/[0.01]">
              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${statusColors[order.status] || statusColors.PENDING}`}>
                  {order.status}
                </span>
                <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">#{order.id.slice(0, 8)}</span>
                <span className="text-[10px] text-white/20">• {new Date(order.createdAt).toLocaleTimeString()}</span>
              </div>
              <div className="text-sm font-black text-emerald-400">₹{order.totalAmount}</div>
            </div>
            
            <div className="p-6 flex items-start gap-8">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-xl">🍱</div>
                  <div>
                    <div className="text-base font-black text-white">{order.stallName}</div>
                    <div className="text-[10px] text-white/30 uppercase tracking-widest">Deliver to Seat {order.seatLabel}</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {order.items.map((it: any) => (
                    <span key={it.id} className="text-[10px] px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-white/60">
                      {it.quantity}x {it.emoji} {it.name}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="flex flex-col gap-2 shrink-0">
                <div className="text-[9px] font-black uppercase text-white/20 tracking-widest mb-1">Update Status</div>
                <select 
                    value={order.status.toUpperCase()}
                    onChange={(e) => handleStatusUpdate(order.id, (order as any).userId || 'user-1', e.target.value)}
                    className="bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-[10px] text-white focus:outline-none focus:border-[#00f2ff]/50"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="PREPARING">Preparing</option>
                    <option value="DELIVERING">Delivering</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --------------- Main Dashboard ---------------
const NerveCentreDashboard = () => {
  const { isAdminLoggedIn, isAuthLoading } = useStadium();
  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  const [time, setTime] = useState<string>('');
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'online' | 'offline' | 'connecting'>('connecting');
  const [sections, setSections] = useState<Section[]>([
    { id: 'North-Concourse-A', active: true },
    { id: 'Garware-Aisle-3', active: true },
    { id: 'Grandstand-Level-1', active: true },
    { id: 'East-Exit-Gate-4', active: true },
  ]);
  const [sosAlerts, setSosAlerts] = useState<SosAlert[]>([]);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAdminLoggedIn) {
    if (typeof window !== 'undefined') window.location.href = "/";
    return null;
  }

  const handleDispatch = async (alertId: string, userId: string, seatLabel?: string) => {
     try {
       await fetch('/api/admin/dispatch-sos', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ alertId, userId, seatLabel, action: 'DISPATCH' })
       });
       setSosAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: 'Dispatched' } : a));
     } catch (e) { console.error("SOS Dispatch failed", e); }
  };

  const socketRef = useRef<any>(null);

  useEffect(() => {
    // 1. Client-side clock to avoid hydration mismatch
    const iv = setInterval(() => {
        setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  const [logins, setLogins] = useState<any[]>([]);

  useEffect(() => {
     // 2. Real-time Admin Sync
     const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://127.0.0.1:3002";
     const socket = io(socketUrl);
     socketRef.current = socket;
     
     socket.on("connect", () => {
        setSyncStatus('online');
        socket.emit("authenticate", "admin-node-1");
     });

     socket.on("disconnect", () => {
        setSyncStatus('offline');
     });

     socket.on("HERO_FAN_BROADCAST", (data: any) => {
        if (data.event === "LOGIN") {
            setLogins(prev => [...prev, data].slice(-50));
        }
     });

      socket.on("SOS_TRIGGER", (data: any) => {
        setSosAlerts(prev => [{
            id: `SOS-${Math.random().toString(36).substr(2, 4)}`.toUpperCase(),
            user: data.userName || 'Guest User',
            userId: data.userId,
            reason: data.reason || 'Medical Emergency',
            status: 'Active',
            time: 'Just Now',
            seatLabel: data.seatLabel || data.seat_label || 'Unknown Seat'
        }, ...prev]);
      });

      // 3. Initial SOS Fetch from Database
      const fetchAlerts = async () => {
         try {
           const res = await fetch('/api/admin/sos-alert');
           if (!res.ok) throw new Error("Fetch failed");
           const data = await res.json();
           if (Array.isArray(data)) {
             setSosAlerts(data.map((a: any) => ({
                id: a.id,
                user: a.userName,
                userId: a.userId,
                reason: a.reason,
                status: a.status === 'ACTIVE' ? 'Active' : a.status === 'DISPATCHED' ? 'Dispatched' : 'Resolved',
                time: new Date(a.createdAt).toLocaleTimeString(),
                seatLabel: a.seatLabel
             })));
           }
         } catch (e) { console.error("SOS fetch failed", e); }
      };
      fetchAlerts();
      
      const sosPolling = setInterval(fetchAlerts, 5000); // Fail-safe check every 5s

      return () => { 
        socket.disconnect(); 
        clearInterval(sosPolling);
      };
  }, []);
  const handleResolve = async (alertId: string) => {
     try {
       await fetch('/api/admin/sos-alert', {
         method: 'PATCH',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ alertId, status: 'RESOLVED' })
       });
       setSosAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: 'Resolved' } : a));
     } catch (e) { console.error("SOS Resolve failed", e); }
  };

  const handleClear = async (alertId: string) => {
     try {
       await fetch(`/api/admin/sos-alert?id=${alertId}`, { method: 'DELETE' });
       setSosAlerts(prev => prev.filter(a => a.id !== alertId));
     } catch (e) { console.error("SOS Clear failed", e); }
  };

  const [socialFeed, setSocialFeed] = useState<SocialPost[]>([]);

  useEffect(() => {
    const fetchSocial = async () => {
      try {
        const res = await fetch('/api/social/chat');
        const data = await res.json();
        if (Array.isArray(data)) setSocialFeed(data);
      } catch (e) { console.error("Fetch social failed", e); }
    };
    fetchSocial();
    const interval = setInterval(fetchSocial, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleNotifyUser = async (id: string, currentFlags: number) => {
      try {
        await fetch('/api/social/chat', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messageId: id, flags: currentFlags + 1 })
        });
        setSocialFeed(prev => prev.map(f => f.id === id ? { ...f, flags: f.flags + 1 } : f));
      } catch (e) { console.error("Notify user failed", e); }
  };

  const handleDeletePost = async (id: string) => {
      try {
        await fetch(`/api/social/chat?id=${id}`, { method: 'DELETE' });
        setSocialFeed(prev => prev.filter(f => f.id !== id));
        // Real-time deletion broadcast if possible, but interval will catch it
      } catch (e) { console.error("Delete post failed", e); }
  };

  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch('/api/admin/orders');
        const data = await res.json();
        if (data.orders) setOrders(data.orders);
      } catch (e) { console.error("Fetch orders failed", e); }
    };
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  const activeSos = sosAlerts.filter(a => a.status === 'Active').length;
  const flaggedPosts = socialFeed.filter(f => f.flags > 0).length;

  const navItems: { tab: NavTab; label: string; icon: React.ReactNode; badge?: number; badgeColor?: string }[] = [
    { tab: 'overview', label: 'Overview', icon: <TrendingUp size={16} /> },
    { tab: 'heatmap', label: '2D Heatmap', icon: <MapIcon size={16} /> },
    { tab: 'cctv', label: 'CCTV', icon: <Video size={16} /> },
    { tab: 'sos', label: 'SOS Alerts', icon: <AlertTriangle size={16} />, badge: activeSos, badgeColor: 'red' },
    { tab: 'orders', label: 'Live Orders', icon: <ShoppingBag size={16} />, badge: orders.filter(o => o.status === 'PENDING').length, badgeColor: '#4f46e5' },
    { tab: 'services', label: 'Services', icon: <Utensils size={16} /> },
    { tab: 'social', label: 'Social Mod', icon: <MessageSquare size={16} />, badge: flaggedPosts, badgeColor: '#ca8a04' },
    { tab: 'routing', label: 'Routing', icon: <GitBranch size={16} /> },
  ];

  const tabTitles: Record<NavTab, string> = {
    overview: 'System Overview',
    heatmap: '2D Drone Heatmap',
    cctv: 'CCTV Monitoring',
    sos: 'SOS Alert Centre',
    orders: 'Live Seat Delivery Orders',
    services: 'Service Monitoring',
    social: 'Social Moderation Feed',
    routing: 'NavMesh Routing Overrides'
  };

  return (
    <div className="min-h-screen bg-[#080809] text-white flex flex-col" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* Top Header Bar */}
      <header className="flex items-center justify-between px-8 py-4 border-b border-white/[0.08] bg-[#0A0A0B]/80 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 border border-white/10 rounded-full">
            <span className={`w-2 h-2 rounded-full ${syncStatus === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-[10px] font-black uppercase tracking-widest text-white/50">{syncStatus}</span>
          </div>
          <div>
            <h1 className="text-lg font-black uppercase tracking-tighter leading-none">StadiaNav Nerve Centre</h1>
            <p className="text-[9px] text-[#00f2ff] font-bold uppercase tracking-[0.3em] mt-0.5">God View — Secured Admin Protocol</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-red-950/40 border border-red-600/30 px-4 py-2 rounded-xl">
            <ShieldAlert size={14} className="text-red-500" />
            <span className="text-xs font-black text-red-400 uppercase tracking-wider">Admin Access</span>
          </div>
          <div className="relative">
            <button 
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className={`w-9 h-9 border rounded-xl flex items-center justify-center transition-all ${isNotifOpen ? 'bg-[#00f2ff]/20 border-[#00f2ff]/40 text-[#00f2ff]' : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'}`}
            >
              <Bell size={16} />
            </button>
            {(activeSos + flaggedPosts) > 0 && !isNotifOpen && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full text-[8px] font-black flex items-center justify-center">
                {activeSos + flaggedPosts}
              </span>
            )}

            {/* Notification Panel */}
            {isNotifOpen && (
                <div className="absolute top-12 right-0 w-80 bg-[#0A0A0B] border border-white/10 rounded-2xl shadow-2xl p-4 z-[100] animate-in fade-in zoom-in duration-200">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-[#00f2ff]">Active Security Feed</h4>
                        <button onClick={() => setIsNotifOpen(false)}><X size={12}/></button>
                    </div>
                    <div className="space-y-3">
                        {sosAlerts.slice(0, 3).map(a => (
                            <div key={a.id} className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
                                <ShieldAlert size={14} className="text-red-500 shrink-0 mt-0.5" />
                                <div>
                                    <div className="text-[10px] font-black text-red-100">{a.user}</div>
                                    <p className="text-[9px] text-red-200/60 leading-tight">{a.reason}</p>
                                </div>
                            </div>
                        ))}
                        {sosAlerts.length === 0 && <p className="text-[10px] text-white/20 text-center py-4 italic">No pending alerts</p>}
                    </div>
                </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-56 bg-[#080809] border-r border-white/[0.06] flex flex-col shrink-0 py-4">
          <nav className="flex flex-col gap-1 px-3">
            {navItems.map(item => (
              <button
                key={item.tab}
                onClick={() => setActiveTab(item.tab)}
                className={`relative flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all text-left group ${
                  activeTab === item.tab
                    ? 'bg-white/10 text-white shadow-lg'
                    : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04]'
                }`}
              >
                {activeTab === item.tab && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-white rounded-full" />
                )}
                <span className={`transition-colors ${activeTab === item.tab ? 'text-white' : 'text-white/30 group-hover:text-white/50'}`}>
                  {item.icon}
                </span>
                {item.label}
                {item.badge != null && item.badge > 0 && (
                  <span className="ml-auto min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[9px] font-black text-white px-1"
                    style={{ backgroundColor: item.badgeColor || '#dc2626' }}>
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Sidebar footer */}
          <div className="mt-auto px-4 pb-2 flex flex-col gap-2">
            <Link
              href="/admin/backend"
              className="flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-blue-400 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-all"
            >
              <Server size={14} /> Backend Engine
            </Link>
            <div className="p-3 bg-emerald-950/30 border border-emerald-600/20 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">All Systems Go</span>
              </div>
              <p className="text-[8px] text-white/20">CV pipeline nominal</p>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-8">
          {/* Section header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-white">{tabTitles[activeTab]}</h2>
              <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] mt-0.5">StadiaNav Stadium — Live Operations</p>
            </div>
            <div className="text-[10px] text-white/20 font-bold tabular-nums">
              {time || '--:--:--'}
            </div>
          </div>

          {/* Tab content */}
          {activeTab === 'overview' && <OverviewView sosAlerts={sosAlerts} socialFeed={socialFeed} />}
          {activeTab === 'cctv' && <CCTVView />}
          {activeTab === 'heatmap' && <HeatmapView />}
          {activeTab === 'sos' && <SOSView sosAlerts={sosAlerts} handleDispatch={handleDispatch} handleResolve={handleResolve} handleClear={handleClear} />}
          {activeTab === 'orders' && <OrdersView orders={orders} setOrders={setOrders} />}
          {activeTab === 'services' && <ServicesView handleDispatch={handleDispatch} />}
          {activeTab === 'social' && <SocialView socialFeed={socialFeed} handleNotifyUser={handleNotifyUser} handleDeletePost={handleDeletePost} />}
          {activeTab === 'routing' && <RoutingView sections={sections} setSections={setSections} />}
        </main>
      </div>
    </div>
  );
};

// --------------- Page Export ---------------
export default function AdminPage() {
  return (
    <StadiumProvider>
      <NerveCentreDashboard />
    </StadiumProvider>
  );
}
