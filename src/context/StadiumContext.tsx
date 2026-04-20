"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react";
import * as THREE from "three";
import { supabase } from "@/lib/supabaseClient";
import { getStadiumHeightAt } from "@/lib/stadiumUtils";
import { io } from "socket.io-client";

export interface CVDensityPoint {
  x: number;
  z: number;
  intensity: number;
}

export interface Coordinate {
  id: string;
  name: string;
  position: [number, number, number];
  locationID?: string;
  waitTime?: string;
  waitWeights?: { cv: number; user: number; history: number };
}

export interface FriendMetadata {
  userId: string;
  jersey: string;
  status: string;
}

export interface MatchData {
  homeTeam: string;
  awayTeam: string;
  homeScore: string;
  awayScore: string;
  overs: string;
  status: string;
}

export interface ZoneData {
  id: string;
  density: number;
}

export interface AIInsights {
  restroomWait: string;
  stallWait: string;
  prediction: string;
  lastUpdated: string;
}

export interface PollOption {
  id: string;
  label: string;
  votes: number;
}

export interface PollData {
  question: string;
  options: PollOption[];
}

export interface Venue {
  id: string;
  name: string;
  model_url: string;
  config: {
    center: [number, number, number];
    pitch_bounds: { min: [number, number]; max: [number, number] };
  };
  status: 'OPERATIONAL' | 'LOCKDOWN';
}

const DEFAULT_VENUE: Venue = {
  id: 'v-stadianav',
  name: 'StadiaNav Arena',
  model_url: 'procedural-v2',
  config: {
    center: [0, 0, 0],
    pitch_bounds: { min: [-50, -50], max: [50, 50] }
  },
  status: 'OPERATIONAL'
};

interface StadiumContextType {
  isEmergency: boolean;
  notifications: Array<{ id: string, message: string, type: string, ts: string }>;
  setNotifications: React.Dispatch<React.SetStateAction<Array<{ id: string, message: string, type: string, ts: string }>>>;
  setIsEmergency: (v: boolean) => void;
  activeVenue: Venue | null;
  setActiveVenue: (v: Venue) => void;
  venues: Venue[];
  refreshVenues: () => Promise<void>;
  focusTarget: [number, number, number] | null;
  setFocusTarget: (pos: [number, number, number] | null) => void;
  allTickets: any[];
  refreshTickets: () => Promise<void>;
  updateStallStatus: (stallId: string, status: string) => Promise<void>;
  friends: Coordinate[];
  addFriend: (id: string) => void;
  liveFriends: any[];
  setLiveFriends: (v: any[]) => void;
  userPosition: [number, number, number];
  setUserPosition: (pos: [number, number, number]) => void;
  densityMap: ZoneData[];
  cvDensityMap: CVDensityPoint[];
  aiInsights: AIInsights | null;
  lastSyncTime: number;
  isSimulating: boolean;
  setIsSimulating: (v: boolean) => void;
  restrooms: Coordinate[];
  foodStalls: Coordinate[];
  targetUtility: Coordinate | null;
  findNearestRestroom: () => void;
  clearTarget: () => void;
  updateAIInsights: () => Promise<void>;
  navSubject: Coordinate | null;
  setNavSubject: (subject: Coordinate | null) => void;
  staircases: Coordinate[];
  isLoggedIn: boolean;
  userData: OnboardingData | null;
  login: (data: OnboardingData) => void;
  logout: () => void;
  batterySaver: boolean;
  setBatterySaver: (v: boolean) => void;
  pollData: PollData;
  votePoll: (optionId: string) => void;
  selectedStall: Coordinate | null;
  setSelectedStall: (stall: Coordinate | null) => void;
  accentColor: string;
  setAccentColor: (v: string) => void;
  realtimeStalls: any[];
  fanPosts: any[];
  isConnected: boolean;
  loyaltyPoints: number;
  addPoints: (p: number) => void;
  friendMetadata: FriendMetadata[];
  matchClock: string;
  conversationalHistory: { sender: 'bot' | 'user'; text: string }[];
  addMessage: (msg: string) => void;
  setWayfindingStats: (v: { distance: number; time: number } | null) => void;
  wayfindingStats: { distance: number; time: number } | null;
  sosAlerts: any[];
  setSosAlerts: React.Dispatch<React.SetStateAction<any[]>>;
  sosOpen: boolean;
  setSosOpen: (v: boolean) => void;
  venueName: string;
  historyPath: [number, number, number][] | null;
  setHistoryPath: (v: [number, number, number][] | null) => void;
  initialLookAt: THREE.Vector3;
  activeTab: 'map' | 'fanzone' | 'services' | 'settings';
  setActiveTab: (tab: 'map' | 'fanzone' | 'services' | 'settings') => void;
  matchData: MatchData | null;
  commentary: string;
  socialFlares: CVDensityPoint[];
  addSocialFlare: (flare: CVDensityPoint) => void;
  emitSocket: (event: string, payload: any) => void;
  socialOpen: boolean;
  setSocialOpen: (v: boolean) => void;
  povMode: string;
  setPovMode: (v: string) => void;
}

export interface OnboardingData {
  stand?: string;
  level?: string;
  block?: string;
  seat?: string;
  groupCode?: string;
  phone?: string;
  position?: [number, number, number];
  guest?: boolean;
  name?: string;
}

const StadiumContext = createContext<StadiumContextType | undefined>(undefined);

export const StadiumProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userPosition, setUserPosition] = useState<[number, number, number]>([13.5, 12, -73.5]);
  const [navSubject, setNavSubject] = useState<Coordinate | null>(null);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [liveFriends, setLiveFriends] = useState<any[]>([]);
  const [historyPath, setHistoryPath] = useState<[number, number, number][] | null>(null);
  const [sosAlerts, setSosAlerts] = useState<any[]>([]);
  const [sosOpen, setSosOpen] = useState(false);
  const [densityMap, setDensityMap] = useState<ZoneData[]>([]);
  const [cvDensityMap, setCvDensityMap] = useState<CVDensityPoint[]>([]);
  const [wayfindingStats, setWayfindingStats] = useState<{ distance: number; time: number } | null>(null);
  const [notifications, setNotifications] = useState<Array<{ id: string, message: string, type: string, ts: string }>>([]);
  const [activeTab, setActiveTab] = useState<'map' | 'fanzone' | 'services' | 'settings'>('map');
  const [isSimulating, setIsSimulating] = useState(false);
  const [socialOpen, setSocialOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [isEmergency, setIsEmergency] = useState(false);
  const [accentColor, setAccentColor] = useState('#00f2ff');
  const [pollData, setPollData] = useState<PollData>({
      question: "Who will hit the next six?",
      options: [
          { id: 'opt1', label: 'Rohit Sharma', votes: 1420 },
          { id: 'opt2', label: 'Ishan Kishan', votes: 850 },
          { id: 'opt3', label: 'Suryakumar Yadav', votes: 2310 }
      ]
  });
  
  const [matchData, setMatchData] = useState<MatchData | null>({
    homeTeam: "Mumbai Indians",
    awayTeam: "Chennai Super Kings",
    homeScore: "172/4",
    awayScore: "0/0",
    overs: "20.0",
    status: "Innings Break"
  });
  const [commentary, setCommentary] = useState("Welcome to StadiaNav! Match starts in 10 minutes.");
  const [loyaltyPoints, setLoyaltyPoints] = useState(1250); 
  const [matchClock, setMatchClock] = useState("14:32");
  const [friendMetadata, setFriendMetadata] = useState<FriendMetadata[]>([]);
  const [conversationalHistory, setConversationalHistory] = useState<{ sender: 'bot' | 'user'; text: string }[]>([]);
  const [socialFlares, setSocialFlares] = useState<CVDensityPoint[]>([]);
  const [povMode, setPovMode] = useState("free");
  const socketRef = useRef<any>(null);

  const [foodStalls, setFoodStalls] = useState<Coordinate[]>([
    { id: 'fs-1', name: 'Wow! Momo', position: [115, 12.5, 5], waitTime: '4', locationID: 'North Stand Concourse' },
    { id: 'fs-2', name: 'Punjab Grill', position: [-80, 6.5, 90], waitTime: '12', locationID: 'Garware Pavilion' },
    { id: 'fs-3', name: 'Blue Tokai', position: [-110, 18.5, -40], waitTime: '8', locationID: 'Executive Suite Level' },
    { id: 'fs-4', name: 'Subway', position: [60, 0.5, -100], waitTime: '15', locationID: 'East Stand Lower' },
  ]);
  const [restrooms, setRestrooms] = useState<Coordinate[]>([
    { id: 'rr-1', name: 'Washroom Alpha', position: [100, 12.5, 30], locationID: 'North Stand' },
    { id: 'rr-2', name: 'Washroom Beta', position: [-100, 6.5, -50], locationID: 'Garware West' },
    { id: 'rr-3', name: 'Washroom Delta', position: [30, 0.5, 110], locationID: 'East Stand Gate 4' },
  ]);

  const [targetUtility, setTargetUtility] = useState<Coordinate | null>(null);

  const initialLookAt = useMemo(() => new THREE.Vector3(0, 0, 0), []);

  useEffect(() => {
    const savedNav = sessionStorage.getItem('stadium-nav');
    if (savedNav && savedNav !== 'undefined') {
      try {
        const parsed = JSON.parse(savedNav);
        if (parsed) setNavSubject(parsed);
      } catch (e) { console.error("Nav hydration failed", e); }
    }
    const savedPos = sessionStorage.getItem('stadium-pos');
    if (savedPos && savedPos !== 'undefined') {
      try {
        const parsed = JSON.parse(savedPos);
        if (Array.isArray(parsed) && parsed.length === 3) setUserPosition(parsed as [number, number, number]);
      } catch (e) { console.error("Pos hydration failed", e); }
    }
    setHasHydrated(true);
  }, []);

  useEffect(() => {
    const savedLogin = localStorage.getItem('stadianav-user');
    if (savedLogin) {
        setUserData(JSON.parse(savedLogin));
        setIsLoggedIn(true);
    }

    // Request Location for Demo
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => console.log("[Geo] Location Authorized", pos.coords),
            (err) => console.log("[Geo] Location Denied/Error", err)
        );
    }
  }, []);

  const login = async (data: any) => {
    const user = {
        id: data.phone ? `user-${data.phone}` : `guest-${Math.random().toString(36).substr(2, 6)}`,
        name: data.phone ? "Fan" : "Guest",
        ...data
    };
    localStorage.setItem('stadianav-user', JSON.stringify(user));
    setUserData(user);
    setIsLoggedIn(true);
    
    // Notify admin of new login
    socketRef.current?.emit("HERO_FAN_BROADCAST", { 
        userId: user.id, 
        event: "LOGIN", 
        userName: user.name,
        seatLabel: user.seat || 'Unknown'
    });
  };

  const logout = () => {
    localStorage.removeItem('stadianav-user');
    setUserData(null);
    setIsLoggedIn(false);
  };
  useEffect(() => {
    if (!hasHydrated) return;
    sessionStorage.setItem('stadium-pos', JSON.stringify(userPosition));
  }, [userPosition, hasHydrated]);

  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://127.0.0.1:3002";
    const socket = io(socketUrl);
    socketRef.current = socket;
    
    socket.on("connect", () => {
        console.log("[CV Core] Connected to Global Sync Engine");
        // Authenticate with a mock user ID for history/recovery
        socket.emit("authenticate", "user-1");
    });
    
    socket.on("GLOBAL_DENSITY_FRAME", (payload: { timestamp: number, data: CVDensityPoint[] }) => {
       setCvDensityMap(payload.data);
    });

    socket.on("MATCH_UPDATE", (payload: MatchData) => {
        setMatchData(payload);
    });

    socket.on("COMMENTARY_TICKER", (msg: string) => {
        setCommentary(msg);
    });

    socket.on("WAIT_TIMES_UPDATE", (waitTimesDict: Record<string, {queue_length: number, wait_time_mins: number}>) => {
        setFoodStalls(prev => prev.map(stall => {
             if (waitTimesDict[stall.id]) {
                 return { ...stall, waitTime: Math.max(1, waitTimesDict[stall.id].wait_time_mins).toString() };
             }
             return stall;
        }));
    });

    socket.on("SOCIAL_FLARE", (flare: CVDensityPoint) => {
        setSocialFlares(prev => [...prev, flare].slice(-20));
    });

    socket.on("MATCH_CLOCK", (time: string) => {
        setMatchClock(time);
    });

    socket.on("FRIEND_METADATA_UPDATE", (data: FriendMetadata[]) => {
        setFriendMetadata(data);
    });

    socket.on("POSITION_RECOVERY", (coords: { x: number, y: number, z: number }) => {
        console.log("[Recovery] Restoring position from backend:", coords);
        setUserPosition([coords.x, coords.y, coords.z]);
    });

    socket.on("NAV_MESH_UPDATE", ({ blockId, isActive }: { blockId: string, isActive: boolean }) => {
        console.log(`[Admin] Zone ${blockId} is now ${isActive ? 'OPEN' : 'CLOSED'}`);
        // This would update pathfinding graph weights in a real implementation
    });

    socket.on("SOS_TRIGGER", (payload: any) => {
        console.log("[Global SOS Trigger]", payload);
        
        setSosAlerts(prev => [{
            id: payload.alertId || `SOS-${Math.random().toString(36).slice(-4).toUpperCase()}`,
            userName: payload.userName,
            reason: payload.reason,
            status: 'Active',
            createdAt: new Date(),
            seatLabel: payload.seatLabel
        }, ...prev]);

        setNotifications(prev => [{ 
            id: Math.random().toString(), 
            message: `CRITICAL: SOS triggered at ${payload.seatLabel}!`, 
            type: 'emergency', 
            ts: new Date().toLocaleTimeString() 
        }, ...prev]);
    });

    socket.on("SOS_UPDATE", (payload: any) => {
        console.log("[Admin SOS Update]", payload);
        setNotifications(prev => [{ id: Math.random().toString(), message: payload.message, type: 'emergency', ts: new Date().toLocaleTimeString() }, ...prev]);
    });

    socket.on("ORDER_STATUS_UPDATE", (payload: any) => {
        console.log("[Order Sync]", payload);
        setNotifications(prev => [{ id: Math.random().toString(), message: `Order #${payload.orderId.slice(0,8)} is now ${payload.status}!`, type: 'info', ts: new Date().toLocaleTimeString() }, ...prev]);
    });

    socket.on("ADMIN_BROADCAST", (payload: any) => {
        console.log("[Global Broadcast]", payload);
        setNotifications(prev => [{ id: Math.random().toString(), message: payload.message, type: payload.type, ts: new Date().toLocaleTimeString() }, ...prev]);
        if (payload.type === 'emergency') setIsEmergency(true);
    });

    return () => {
        socket.disconnect();
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setMatchClock(prev => {
        const parts = prev.split(':').map(Number);
        if (parts.length < 2) return "14:32";
        const [m, s] = parts;
        let newS = s + 1;
        let newM = m;
        if (newS >= 60) {
            newS = 0;
            newM += 1;
        }
        return `${newM.toString().padStart(2, '0')}:${newS.toString().padStart(2, '0')}`;
      });
    }, 1000);

    const matchSimulator = setInterval(() => {
      const updates = [
        "FOUR! Rohit Sharma pulls it away for a boundary!",
        "Appeal for LBW! Not out, says the umpire.",
        "The crowd is going wild here at StadiaNav!",
        "Innings break approaching. Check out the deals at Wow! Momo.",
        "Strategic Timeout. Time to explore the FanZone!",
      ];
      setCommentary(updates[Math.floor(Math.random() * updates.length)]);
      
      if (Math.random() > 0.98) {
          setIsEmergency(true);
          setTimeout(() => setIsEmergency(false), 5000);
      }
    }, 15000);

    return () => {
      clearInterval(timer);
      clearInterval(matchSimulator);
    };
  }, []);

  const addPoints = useCallback(async (p: number) => {
    setLoyaltyPoints(prev => prev + p);
    
    // Backend Sync for Nerve Centre
    try {
        await fetch('/api/users/points', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                userId: userData?.id || 'prototype-fan-1', 
                phone: userData?.phone || '9999999999',
                amount: p 
            })
        });
    } catch (e) { 
        console.error("Loyalty sync failed", e); 
    }
  }, [userData]);

  const addMessage = useCallback((text: string) => {
    setConversationalHistory(prev => {
        const next = [...prev, { sender: 'user' as const, text }];
        // Simulate Gemini Reply
        setTimeout(() => {
            setConversationalHistory(current => [
                ...current, 
                { sender: 'bot' as const, text: `Analyzing spatial data for "${text}". All routes optimal.` }
            ].slice(-10));
        }, 1000);
        return next.slice(-10);
    });
  }, []);

  const findNearestRestroom = useCallback(() => {
    if (restrooms.length === 0) return;
    const userVec = new THREE.Vector3(...userPosition);
    let nearest = restrooms[0];
    let minDist = userVec.distanceTo(new THREE.Vector3(...restrooms[0].position));

    restrooms.forEach(rr => {
      const dist = userVec.distanceTo(new THREE.Vector3(...rr.position));
      if (dist < minDist) {
        minDist = dist;
        nearest = rr;
      }
    });

    setNavSubject(nearest);
  }, [restrooms, userPosition]);

  const updateStallStatus = async (stallId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('stalls')
        .update({ status })
        .eq('id', stallId);
      if (error) throw error;
      
      setFoodStalls(prev => prev.map(s => s.id === stallId ? { ...s, status } : s));
    } catch (e) {
      console.error("Failed to update stall status", e);
    }
  };

  const votePoll = useCallback(async (optionId: string) => {
      setPollData(prev => ({
          ...prev,
          options: prev.options.map(opt => opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt)
      }));
      
      addPoints(10); // Reward for voting

      if (userData?.id) {
          try {
              const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://127.0.0.1:3002";
              await fetch(`${socketUrl}/api/fan/vote`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ optionId, userId: userData.id })
              });
          } catch (e) { console.error("Vote sync failed", e); }
      }
  }, [userData, addPoints]);

  const contextValue: StadiumContextType = {
    isEmergency, setIsEmergency,
    notifications, setNotifications,
    activeVenue: null, setActiveVenue: () => {},
    venues: [], refreshVenues: async () => {},
    focusTarget: null, setFocusTarget: () => {},
    allTickets: [], refreshTickets: async () => {},
    updateStallStatus,
    friends: [], addFriend: () => {},
    liveFriends, setLiveFriends,
    userPosition, setUserPosition,
    densityMap,
    cvDensityMap,
    aiInsights: null, lastSyncTime: Date.now(),
    isSimulating: false, setIsSimulating: () => {},
    restrooms, foodStalls, targetUtility,
    findNearestRestroom, clearTarget: () => setNavSubject(null),
    updateAIInsights: async () => {},
    navSubject, setNavSubject, staircases: [],
    isLoggedIn, userData, login, logout,
    batterySaver: false, setBatterySaver: () => {},
    pollData, votePoll,
    selectedStall: null, setSelectedStall: () => {},
    accentColor, setAccentColor,
    realtimeStalls: [], fanPosts: [], isConnected: true,
    loyaltyPoints, addPoints,
    friendMetadata, matchClock, conversationalHistory,
    addMessage,
    wayfindingStats, setWayfindingStats,
    sosAlerts, setSosAlerts,
    sosOpen, setSosOpen,
    venueName: "StadiaNav Arena",
    historyPath, setHistoryPath,
    initialLookAt,
    activeTab, setActiveTab,
    matchData, commentary, socialFlares,
    addSocialFlare: (flare) => setSocialFlares(prev => [...prev, flare].slice(-20)),
    emitSocket: (e, p) => socketRef.current?.emit(e, p),
    socialOpen, setSocialOpen,
    povMode, setPovMode,
  };

  return (
    <StadiumContext.Provider value={contextValue}>
      <style dangerouslySetInnerHTML={{__html: `
        :root {
          --accent: ${accentColor};
          --accent-50: ${accentColor}80;
          --accent-20: ${accentColor}33;
          --accent-10: ${accentColor}1A;
        }
      `}} />
      {children}
    </StadiumContext.Provider>
  );
};

export const useStadium = () => {
  const context = useContext(StadiumContext);
  if (!context) throw new Error("useStadium must be used within a StadiumProvider");
  return context;
};
