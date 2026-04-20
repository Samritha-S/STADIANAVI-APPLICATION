"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useStadium } from '@/context/StadiumContext';
import {
  Upload, Camera, Database, Users, Activity, FileVideo,
  RefreshCw, Download, Trash2, Play, Pause, Server,
  ChevronRight, Eye, Filter, Search, AlertCircle, CheckCircle,
  Settings, Code, Cpu, Zap, BarChart2
} from 'lucide-react';
import Link from 'next/link';

// ─── Types ───────────────────────────────────────────────────────────────────

type BackendTab = 'cctv' | 'cv-data' | 'users' | 'stalls' | 'logs';

interface UploadedFile {
  id: string;
  name: string;
  size: string;
  camera: string;
  status: 'queued' | 'processing' | 'done' | 'error';
  progress: number;
  timestamp: string;
  detections?: number;
}

interface CVDataPoint {
  id: string;
  x: number;
  z: number;
  intensity: number;
  camera: string;
  ts: string;
}

interface DbUser {
  id: string;
  name?: string;
  phone: string;
  assignedSeatId?: string;
  createdAt: string;
  sosCount?: number;
  loyaltyPts?: number;
}

// ─── Shared Shell ─────────────────────────────────────────────────────────────

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-[#0D0D0F] border border-white/[0.07] rounded-2xl overflow-hidden ${className}`}>{children}</div>
);

const CardHeader = ({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) => (
  <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-white/[0.02]">
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40">{title}</p>
      {sub && <p className="text-[9px] text-white/20 mt-0.5">{sub}</p>}
    </div>
    {action}
  </div>
);

const StatusPill = ({ status }: { status: UploadedFile['status'] }) => {
  const map = {
    queued: 'bg-white/10 text-white/40',
    processing: 'bg-blue-500/20 text-blue-400 animate-pulse',
    done: 'bg-emerald-500/20 text-emerald-400',
    error: 'bg-red-500/20 text-red-400',
  };
  return (
    <span className={`text-[9px] px-2.5 py-1 rounded-full font-black uppercase ${map[status]}`}>{status}</span>
  );
};

// ─── CCTV Upload Tab ──────────────────────────────────────────────────────────

const CCTVTab = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([
    { id: 'f1', name: 'north_concourse_20260419_1900.mp4', size: '1.2 GB', camera: 'CAM-01 / North Concourse A', status: 'done', progress: 100, timestamp: '19:00–20:00', detections: 1842 },
    { id: 'f2', name: 'garware_gate3_20260419_1930.mp4', size: '890 MB', camera: 'CAM-02 / Garware Pavilion', status: 'processing', progress: 63, timestamp: '19:30–20:00' },
    { id: 'f3', name: 'press_box_20260419_1945.mp4', size: '540 MB', camera: 'CAM-05 / Press Box', status: 'queued', progress: 0, timestamp: '19:45–20:00' },
  ]);

  const cameras = ['CAM-01 / North Concourse A', 'CAM-02 / Garware Pavilion', 'CAM-03 / East Gate 4', 'CAM-04 / VIP Entry', 'CAM-05 / Press Box', 'CAM-06 / Pitch Perimeter'];
  const [selectedCam, setSelectedCam] = useState(cameras[0]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const dropped = Array.from(e.dataTransfer.files);
    addFiles(dropped);
  }, [selectedCam]);

  const { foodStalls } = useStadium();
  const hiddenVideoRef = useRef<HTMLVideoElement>(null);
  const hiddenCanvasRef = useRef<HTMLCanvasElement>(null);

  const addFiles = async (raw: File[]) => {
    const newFiles: UploadedFile[] = raw.map(f => ({
      id: Math.random().toString(36).slice(2),
      name: f.name,
      size: `${(f.size / 1e9).toFixed(2)} GB`,
      camera: selectedCam,
      status: 'queued',
      progress: 0,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }));
    setFiles(prev => [...newFiles, ...prev]);

    for (const nf of newFiles) {
      const file = raw.find(f => f.name === nf.name);
      if (!file) continue;
      setFiles(prev => prev.map(f => f.id === nf.id ? { ...f, status: 'processing', progress: 10 } : f));
      try {
        let b64 = "";
        if (file.type.startsWith('image/')) {
          b64 = await new Promise((r) => { const rd = new FileReader(); rd.onload = (e) => r((e.target?.result as string).split(',')[1]); rd.readAsDataURL(file); });
        } else {
          const vurl = URL.createObjectURL(file);
          if (hiddenVideoRef.current && hiddenCanvasRef.current) {
            const v = hiddenVideoRef.current; v.src = vurl;
            await new Promise((r) => { v.onloadeddata = () => { v.currentTime = 1; r(0); }; });
            await new Promise((r) => { v.onseeked = () => r(0); });
            const c = hiddenCanvasRef.current; c.width = v.videoWidth; c.height = v.videoHeight;
            c.getContext('2d')?.drawImage(v, 0, 0); b64 = c.toDataURL('image/jpeg').split(',')[1];
            URL.revokeObjectURL(vurl);
          }
        }
        setFiles(prev => prev.map(f => f.id === nf.id ? { ...f, progress: 50 } : f));
        const res = await fetch('/api/admin/process-cctv', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stalls: foodStalls.map(s => ({ id: s.id, stall_name: s.name, location_id: s.locationID })), frameBase64: b64 || undefined })
        });
        const d = await res.json();
        setFiles(prev => prev.map(f => f.id === nf.id ? { ...f, status: 'done', progress: 100, detections: d.results?.reduce((s:number,r:any)=>s+r.people_count,0) || 0 } : f));
      } catch (e) {
        setFiles(prev => prev.map(f => f.id === nf.id ? { ...f, status: 'error' } : f));
      }
    }
  };

  return (
    <div className="space-y-6">
      <video ref={hiddenVideoRef} className="hidden" muted />
      <canvas ref={hiddenCanvasRef} className="hidden" />

      {/* Upload zone */}
      <Card>
        <CardHeader title="Upload CCTV Footage" sub="Accepts MP4, MKV, AVI. Processed by YOLOv8 CV pipeline." />
        <div className="p-6 space-y-4">
          {/* Camera selector */}
          <div className="flex items-center gap-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 shrink-0">Assign to Camera</label>
            <select
              value={selectedCam}
              onChange={e => setSelectedCam(e.target.value)}
              className="flex-1 bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/30 appearance-none"
            >
              {cameras.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`w-full h-48 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${dragActive ? 'border-blue-400 bg-blue-500/10' : 'border-white/10 hover:border-white/25 hover:bg-white/[0.02]'}`}
          >
            <FileVideo size={32} className={dragActive ? 'text-blue-400' : 'text-white/20'} />
            <p className="text-sm font-black text-white/40 uppercase tracking-widest">
              {dragActive ? 'Drop to Queue' : 'Drag & Drop or Click to Browse'}
            </p>
            <p className="text-[10px] text-white/20">MP4 · MKV · AVI · MOV — up to 10 GB per file</p>
            <input ref={fileInputRef} type="file" accept="video/*,image/*" multiple className="hidden"
              onChange={e => e.target.files && addFiles(Array.from(e.target.files))} />
          </div>

          {/* Hidden utilities for frame extraction */}
          <video ref={hiddenVideoRef} className="hidden" muted />
          <canvas ref={hiddenCanvasRef} className="hidden" />
        </div>
      </Card>

      {/* Upload queue */}
      <Card>
        <CardHeader
          title="Processing Queue"
          sub={`${files.filter(f => f.status === 'processing').length} active · ${files.filter(f => f.status === 'queued').length} queued`}
          action={
            <button className="flex items-center gap-1.5 text-[10px] font-black uppercase text-white/30 hover:text-white transition-colors">
              <RefreshCw size={12} /> Refresh
            </button>
          }
        />
        <div className="divide-y divide-white/[0.04]">
          {files.map(f => (
            <div key={f.id} className="px-6 py-4 flex items-center gap-4 hover:bg-white/[0.02] transition-all">
              <FileVideo size={16} className="text-white/20 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <p className="text-xs font-bold text-white truncate">{f.name}</p>
                  <StatusPill status={f.status} />
                </div>
                <div className="flex items-center gap-4 text-[9px] text-white/30">
                  <span>{f.camera}</span>
                  <span>{f.size}</span>
                  <span>{f.timestamp}</span>
                  {f.detections != null && <span className="text-emerald-400">{f.detections.toLocaleString()} detections</span>}
                </div>
                {f.status === 'processing' && (
                  <div className="mt-2 h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${f.progress}%` }} />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {f.status === 'done' && <button className="text-white/20 hover:text-white transition-colors"><Download size={14} /></button>}
                <button onClick={() => setFiles(prev => prev.filter(x => x.id !== f.id))} className="text-white/20 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* CV Config */}
      <Card>
        <CardHeader title="CV Pipeline Configuration" sub="cv_pipeline.py — YOLOv8 inference settings" />
        <div className="p-6 grid grid-cols-3 gap-4">
          {[
            { label: 'Model', value: 'YOLOv8n', note: 'Nano — fastest' },
            { label: 'Frame Skip', value: '5', note: 'Process every 5th frame' },
            { label: 'Secs/Person', value: '45s', note: 'Queue wait estimate' },
            { label: 'CCTV URL', value: 'RTSP / localhost:0', note: 'Live stream endpoint' },
            { label: 'Sync Target', value: 'localhost:3002', note: 'Socket Engine' },
            { label: 'Classes', value: 'person [0]', note: 'COCO class filter' },
          ].map(cfg => (
            <div key={cfg.label} className="p-4 bg-black/40 rounded-xl border border-white/5">
              <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-1">{cfg.label}</p>
              <p className="text-sm font-black text-white">{cfg.value}</p>
              <p className="text-[9px] text-white/20 mt-0.5">{cfg.note}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

// ─── CV Data Tab ──────────────────────────────────────────────────────────────

const CVDataTab = () => {
  const mockPoints: CVDataPoint[] = Array.from({ length: 18 }, (_, i) => ({
    id: `cv-${i}`,
    x: parseFloat((Math.random() * 200 - 100).toFixed(2)),
    z: parseFloat((Math.random() * 200 - 100).toFixed(2)),
    intensity: parseFloat(Math.random().toFixed(2)),
    camera: `CAM-0${(i % 6) + 1}`,
    ts: `20:${(30 + i).toString().padStart(2, '0')}:${Math.floor(Math.random() * 59).toString().padStart(2, '0')}`,
  }));

  const [search, setSearch] = useState('');
  const filtered = mockPoints.filter(p => p.camera.includes(search.toUpperCase()) || p.id.includes(search));

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Points', value: mockPoints.length, color: '#00f2ff', icon: <Activity size={16} /> },
          { label: 'High Density', value: mockPoints.filter(p => p.intensity > 0.7).length, color: '#dc2626', icon: <AlertCircle size={16} /> },
          { label: 'Active Cameras', value: 6, color: '#16a34a', icon: <Camera size={16} /> },
          { label: 'Avg Intensity', value: (mockPoints.reduce((s, p) => s + p.intensity, 0) / mockPoints.length).toFixed(2), color: '#f97316', icon: <BarChart2 size={16} /> },
        ].map(s => (
          <Card key={s.label} className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${s.color}15`, color: s.color }}>{s.icon}</div>
            <div>
              <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[9px] uppercase font-black text-white/30 tracking-widest">{s.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Mini 2D circular scatter */}
      <Card>
        <CardHeader title="Spatial Density Scatter" sub="Normalized Circular Stadium coordinates — current frame" />
        <div className="p-6 flex justify-center">
          <div className="relative w-full max-w-[500px] aspect-square bg-[#050505] rounded-full border border-white/5 overflow-hidden shadow-2xl">
            {/* 1. Boundary Rope */}
            <div className="absolute inset-[2%] border-2 border-white/10 rounded-full" />
            
            {/* 2. Outfield Greenery (Subtle) */}
            <div className="absolute inset-[2%] bg-gradient-to-br from-green-900/10 via-transparent to-green-900/5 rounded-full" />

            {/* 3. 30-Yard Circle (Inner Circle) */}
            <div className="absolute inset-[30%] border border-dashed border-white/5 rounded-full" />

            {/* 4. Central Pitch Area */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[12%] h-[24%] bg-amber-900/20 border border-amber-600/20 rounded-sm" />
            
            {mockPoints.map(p => {
              // Map -100 to 100 range to 0% to 100%
              const left = ((p.x + 100) / 200) * 100;
              const top = ((p.z + 100) / 200) * 100;
              const col = p.intensity > 0.7 ? '#dc2626' : p.intensity > 0.4 ? '#f97316' : '#16a34a';
              return (
                <div key={p.id} title={`${p.id} — intensity ${p.intensity}`}
                  className="absolute rounded-full transition-all z-20"
                  style={{ left: `${left}%`, top: `${top}%`, width: 8 + p.intensity * 10, height: 8 + p.intensity * 10, backgroundColor: col, opacity: 0.8, transform: 'translate(-50%,-50%)', boxShadow: `0 0 ${p.intensity * 15}px ${col}` }} />
              );
            })}
            
            {/* Compass / Marks */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 text-[8px] font-black text-white/20 uppercase tracking-[0.2em]">North Stand</div>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[8px] font-black text-white/20 uppercase tracking-[0.2em]">South Stand</div>
            <p className="absolute bottom-3 right-8 text-[8px] text-white/10 font-bold">STADIANAV CIRCULAR — CV CORE</p>
          </div>
        </div>
      </Card>

      {/* Data table */}
      <Card>
        <CardHeader
          title="Raw CV Data Points"
          sub="Latest batch from cv_pipeline.py"
          action={
            <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-xl px-3 py-2">
              <Search size={12} className="text-white/30" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter camera..." className="bg-transparent text-xs text-white placeholder-white/20 outline-none w-28" />
            </div>
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {['ID', 'Camera', 'X', 'Z', 'Intensity', 'Timestamp'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-[9px] font-black uppercase tracking-widest text-white/30">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-3 font-mono text-white/50">{p.id}</td>
                  <td className="px-6 py-3 font-bold text-white">{p.camera}</td>
                  <td className="px-6 py-3 font-mono text-blue-300">{p.x}</td>
                  <td className="px-6 py-3 font-mono text-blue-300">{p.z}</td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${p.intensity * 100}%`, backgroundColor: p.intensity > 0.7 ? '#dc2626' : p.intensity > 0.4 ? '#f97316' : '#16a34a' }} />
                      </div>
                      <span className="font-mono text-white/60">{p.intensity.toFixed(2)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3 font-mono text-white/30">{p.ts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

// ─── Users Tab ────────────────────────────────────────────────────────────────

const UsersTab = () => {
  const [users, setUsers] = useState<DbUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/admin/users');
        const data = await res.json();
        if (data.users) setUsers(data.users);
      } catch (e) { console.error("Fetch users failed", e); }
      finally { setLoading(false); }
    };
    fetchUsers();
  }, []);

  const [search, setSearch] = useState('');
  const filtered = users.filter(u => 
    (u.name || 'Guest').toLowerCase().includes(search.toLowerCase()) || 
    (u.assignedSeatId || '').includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Registered', value: users.length, color: '#00f2ff' },
          { label: 'SOS Raised', value: users.reduce((s, u) => s + (u.sosCount || 0), 0), color: '#dc2626' },
          { label: 'Avg Loyalty Pts', value: users.length > 0 ? Math.floor(users.reduce((s, u) => s + (u.loyaltyPts || Math.floor(Math.random()*1000)), 0) / users.length).toLocaleString() : '0', color: '#f97316' },
        ].map(s => (
          <Card key={s.label} className="p-5 flex items-center gap-4">
            <p className="text-3xl font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/30">{s.label}</p>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader
          title="User Registry"
          sub="All fan accounts currently in the system"
          action={
            <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-xl px-3 py-2">
              <Search size={12} className="text-white/30" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or seat..." className="bg-transparent text-xs text-white placeholder-white/20 outline-none w-36" />
            </div>
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {['ID', 'Name', 'Seat', 'Stand', 'Loyalty Pts', 'SOS Count', 'Last Active', 'Phone'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[9px] font-black uppercase tracking-widest text-white/30">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {loading ? (
                <tr><td colSpan={8} className="px-5 py-20 text-center text-white/20 animate-pulse">Loading database registry...</td></tr>
              ) : filtered.length === 0 ? (
                 <tr><td colSpan={8} className="px-5 py-20 text-center text-white/20">No users found in database.</td></tr>
              ) : filtered.map(u => (
                <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3 font-mono text-white/30 text-[10px]">{u.id.slice(0,8)}...</td>
                  <td className="px-5 py-3 font-bold text-white">{u.name || 'Guest User'}</td>
                  <td className="px-5 py-3 font-mono text-blue-300">{u.assignedSeatId || '—'}</td>
                  <td className="px-5 py-3 text-white/50">StadiaNav General</td>
                  <td className="px-5 py-3 font-black text-amber-400">{(Math.random()*2000).toFixed(0)}</td>
                  <td className="px-5 py-3">
                    <span className="text-white/20">—</span>
                  </td>
                  <td className="px-5 py-3 font-mono text-white/30 text-[10px]">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="px-5 py-3 font-mono text-white/30 text-[10px]">{u.phone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

// ─── Stalls & Config Tab ───────────────────────────────────────────────────────

const StallsTab = () => {
  const stalls = [
    { id: 'fs-1', name: 'Wow! Momo', loc: 'North Stand Concourse', roiX1: 100, roiY1: 150, roiX2: 400, roiY2: 450, active: true },
    { id: 'fs-2', name: 'Punjab Grill', loc: 'Garware Pavilion', roiX1: 500, roiY1: 200, roiX2: 800, roiY2: 500, active: true },
    { id: 'fs-3', name: 'Blue Tokai', loc: 'Executive Suite Level', roiX1: 200, roiY1: 100, roiX2: 500, roiY2: 400, active: false },
    { id: 'fs-4', name: 'Subway', loc: 'East Stand Lower', roiX1: 600, roiY1: 300, roiX2: 900, roiY2: 600, active: true },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Stall ROI Configuration" sub="Pixel bounding boxes in CCTV frame space — fed to cv_pipeline.py STALL_ROIS" />
        <div className="divide-y divide-white/[0.04]">
          {stalls.map(s => (
            <div key={s.id} className="px-6 py-5 flex items-center gap-6 hover:bg-white/[0.018] transition-all">
              <div className={`w-2 h-2 rounded-full shrink-0 ${s.active ? 'bg-emerald-500 shadow-[0_0_8px_#16a34a]' : 'bg-white/20'}`} />
              <div className="w-40">
                <p className="text-sm font-black text-white">{s.name}</p>
                <p className="text-[10px] text-white/30">{s.loc}</p>
              </div>
              <div className="flex-1 grid grid-cols-4 gap-2">
                {[['X1', s.roiX1], ['Y1', s.roiY1], ['X2', s.roiX2], ['Y2', s.roiY2]].map(([label, val]) => (
                  <div key={label as string} className="bg-black/40 border border-white/5 rounded-xl p-3">
                    <p className="text-[9px] text-white/30 uppercase font-bold mb-1">{label}</p>
                    <input defaultValue={val as number} type="number" className="w-full bg-transparent text-sm font-mono text-white focus:outline-none" />
                  </div>
                ))}
              </div>
              <label className="flex items-center gap-2 cursor-pointer shrink-0">
                <div className={`relative w-9 h-5 rounded-full transition-all ${s.active ? 'bg-emerald-500' : 'bg-white/10'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${s.active ? 'left-[18px]' : 'left-0.5'}`} />
                </div>
                <span className="text-[10px] font-black uppercase text-white/30">{s.active ? 'Active' : 'Off'}</span>
              </label>
            </div>
          ))}
        </div>
        <div className="px-6 py-4 border-t border-white/[0.05] flex justify-end gap-3">
          <button className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-black uppercase text-white/40 hover:bg-white/10 transition-all">Reset</button>
          <button className="px-5 py-2.5 bg-blue-600 rounded-xl text-xs font-black uppercase text-white hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/30">Save to cv_pipeline.py</button>
        </div>
      </Card>
    </div>
  );
};

// ─── Logs Tab ─────────────────────────────────────────────────────────────────

const LogsTab = () => {
  const logs = [
    { ts: '20:35:12', level: 'INFO', src: 'CV Pipeline', msg: 'Uploaded 42 density points | Wait Times: {food-1: 4.5, food-2: 12.0}' },
    { ts: '20:35:07', level: 'WARN', src: 'Socket Engine', msg: 'Client user-003 reconnected after 3s gap' },
    { ts: '20:35:00', level: 'INFO', src: 'CV Pipeline', msg: 'Uploaded 38 density points' },
    { ts: '20:34:55', level: 'ERROR', src: 'CV Pipeline', msg: 'Sync Failed: Connection refused localhost:3002' },
    { ts: '20:34:43', level: 'INFO', src: 'Socket Engine', msg: 'GLOBAL_DENSITY_FRAME emitted to 12 clients' },
    { ts: '20:34:38', level: 'INFO', src: 'Supabase', msg: 'stall fs-1 status → nominal (latency 11ms)' },
    { ts: '20:34:20', level: 'WARN', src: 'CV Pipeline', msg: 'High density detected: Zone North-Concourse-A — 87%' },
    { ts: '20:33:59', level: 'INFO', src: 'Socket Engine', msg: 'SOS_ALERT emitted: SOS-02 dispatched' },
    { ts: '20:33:44', level: 'INFO', src: 'CV Pipeline', msg: 'Model YOLOv8n loaded OK — frame_skip=5' },
    { ts: '20:33:30', level: 'INFO', src: 'Server', msg: 'Backend Data Engine started on port 3002' },
  ];

  const col = { INFO: 'text-white/40', WARN: 'text-yellow-400', ERROR: 'text-red-400' } as const;
  const bg = { INFO: '', WARN: 'bg-yellow-950/10', ERROR: 'bg-red-950/20' } as const;

  return (
    <Card>
      <CardHeader title="System Logs" sub="Live feed from CV pipeline, socket engine and DB" action={
        <button className="flex items-center gap-1.5 text-[10px] font-black uppercase text-white/30 hover:text-white transition-colors">
          <Download size={12} /> Export
        </button>
      } />
      <div className="divide-y divide-white/[0.03] font-mono">
        {logs.map((l, i) => (
          <div key={i} className={`flex items-start gap-4 px-6 py-3 ${bg[l.level as keyof typeof bg]} hover:bg-white/[0.02] transition-all`}>
            <span className="text-[10px] text-white/20 shrink-0 mt-px">{l.ts}</span>
            <span className={`text-[9px] font-black uppercase w-10 shrink-0 mt-px ${col[l.level as keyof typeof col]}`}>{l.level}</span>
            <span className="text-[10px] text-blue-300 w-28 shrink-0 truncate">[{l.src}]</span>
            <span className="text-[11px] text-white/60">{l.msg}</span>
          </div>
        ))}
      </div>
    </Card>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BackendPage() {
  const [activeTab, setActiveTab] = useState<BackendTab>('cctv');

  const tabs: { tab: BackendTab; label: string; icon: React.ReactNode }[] = [
    { tab: 'cctv', label: 'CCTV Upload', icon: <Camera size={14} /> },
    { tab: 'cv-data', label: 'CV Data', icon: <Cpu size={14} /> },
    { tab: 'users', label: 'Users', icon: <Users size={14} /> },
    { tab: 'stalls', label: 'Stall Config', icon: <Settings size={14} /> },
    { tab: 'logs', label: 'System Logs', icon: <Code size={14} /> },
  ];

  return (
    <div className="min-h-screen bg-[#080809] text-white" style={{ fontFamily: 'system-ui,-apple-system,sans-serif' }}>
      {/* Top bar */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-8 py-4 border-b border-white/[0.07] bg-[#080809]/80 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="flex items-center gap-2 text-white/30 hover:text-white transition-colors text-xs font-black uppercase tracking-widest">
            <ChevronRight size={14} className="rotate-180" /> Nerve Centre
          </Link>
          <span className="text-white/10">/</span>
          <div className="flex items-center gap-2">
            <Server size={14} className="text-blue-400" />
            <span className="text-sm font-black uppercase tracking-widest">Backend Data Engine</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-emerald-400">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            Pipeline Online
          </div>
        </div>
      </header>

      {/* Tab nav */}
      <div className="px-8 pt-6 border-b border-white/[0.06]">
        <nav className="flex gap-1">
          {tabs.map(t => (
            <button
              key={t.tab}
              onClick={() => setActiveTab(t.tab)}
              className={`flex items-center gap-2 px-5 py-3 rounded-t-xl text-xs font-black uppercase tracking-widest transition-all border-b-2 -mb-px ${
                activeTab === t.tab
                  ? 'text-white border-blue-500 bg-white/[0.03]'
                  : 'text-white/30 border-transparent hover:text-white/60 hover:bg-white/[0.02]'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-8 py-8">
        {activeTab === 'cctv' && <CCTVTab />}
        {activeTab === 'cv-data' && <CVDataTab />}
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'stalls' && <StallsTab />}
        {activeTab === 'logs' && <LogsTab />}
      </main>
    </div>
  );
}
