"use client";

import React, { useMemo, useRef, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Line, Text, Billboard, useGLTF, Html } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";
import { useStadium } from "@/context/StadiumContext";
import { ProceduralStadium } from "./ProceduralStadium";
import { buildStadiumGraph, findPath } from "@/lib/pathfinding";
import { getStadiumHeightAt } from "@/lib/stadiumUtils";
import FriendMarker from "./FriendMarker";
import { Bell, ShieldAlert, CheckCircle2, Info, X } from "lucide-react";

interface StadiumNotification {
    id: string;
    message: string;
    type: string;
    ts: string;
}

// --- Notification Overlay ---
const NotificationOverlay = () => {
    const { notifications, setNotifications } = useStadium();
    
    if (notifications.length === 0) return null;

    return (
        <div className="fixed top-28 right-4 lg:top-32 lg:right-8 z-[9999] flex flex-col gap-4 pointer-events-none w-[90vw] md:w-80 animate-in slide-in-from-right-10 duration-500">
            {notifications.slice(0, 3).map((notif: StadiumNotification) => (
                <div 
                    key={notif.id} 
                    className={`pointer-events-auto flex items-start gap-4 p-5 rounded-[24px] border backdrop-blur-3xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] transition-all duration-300 ${
                        notif.type === 'emergency' 
                        ? 'bg-red-500/20 border-red-500/30 text-red-100' 
                        : 'bg-black/80 border-white/10 text-white hover:bg-black/90'
                    }`}
                >
                    <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-inner ${notif.type === 'emergency' ? 'bg-red-500 shadow-red-400/50' : 'bg-[var(--accent)] shadow-[var(--accent-20)]'}`}>
                        {notif.type === 'emergency' ? <ShieldAlert size={16} className="text-white" /> : <Bell size={16} className="text-black" />}
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">{notif.type} // {notif.ts}</span>
                            <button onClick={() => setNotifications((prev: StadiumNotification[]) => prev.filter((n: StadiumNotification) => n.id !== notif.id))} className="opacity-20 hover:opacity-100 transition-opacity p-1">
                                <X size={12} />
                            </button>
                        </div>
                        <p className="text-xs font-bold leading-relaxed">{notif.message}</p>
                    </div>
                </div>
            ))}
        </div>
    );
};

const COLORS = {
  HEAT_EMPTY: "#15803D",
  HEAT_MID: "#b45309",
  HEAT_FULL: "#B91C1C",
};

const LandingZone = ({ position, color }: { position: [number, number, number], color: string }) => {
    const ringRef = useRef<THREE.Mesh>(null);
    useFrame((state) => {
        if (ringRef.current) {
            const scale = 1 + (state.clock.elapsedTime % 2) * 2;
            ringRef.current.scale.set(scale, scale, 1);
            (ringRef.current.material as THREE.MeshBasicMaterial).opacity = 1 - (state.clock.elapsedTime % 2) / 2;
        }
    });

    return (
        <group position={[position[0], position[1] + 0.1, position[2]]}>
            <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[3.8, 4, 32]} />
                <meshBasicMaterial color={color} transparent opacity={0.5} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[4, 32]} />
                <meshBasicMaterial color={color} transparent opacity={0.1} />
            </mesh>
            <mesh position={[0, 10, 0]}>
                <cylinderGeometry args={[0.1, 1.5, 20, 32, 1, true]} />
                <meshBasicMaterial color={color} transparent opacity={0.2} />
            </mesh>
            <pointLight color={color} intensity={10} distance={20} />
            <Billboard>
                <Text position={[0, 22, 0]} fontSize={2.5} color="#ffffff" fontWeight="black" textAlign="center">
                    DESTINATION
                </Text>
            </Billboard>
        </group>
    );
};

const TacticalPath = ({ points, color }: { points: THREE.Vector3[]; color: string }) => {
  const lineRef = useRef<any>(null);
  const chevronRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const smoothPoints = useMemo(() => {
    if (points.length < 2) return points;
    const curve = new THREE.CatmullRomCurve3(points);
    return curve.getPoints(points.length * 30).map(p => {
        const groundLevel = getStadiumHeightAt(p.x, p.z) + 0.15; 
        if (p.y < groundLevel) p.y = groundLevel;
        return p;
    });
  }, [points]);

  const curve = useMemo(() => new THREE.CatmullRomCurve3(smoothPoints), [smoothPoints]);

  useFrame((state) => {
    if (chevronRef.current) {
        const time = state.clock.elapsedTime * 0.4;
        const count = 40; 
        for (let i = 0; i < count; i++) {
            const t = ((i / count) + time) % 1;
            const pos = curve.getPointAt(t);
            const tangent = curve.getTangentAt(t);
            
            dummy.position.copy(pos).add(new THREE.Vector3(0, 0.05, 0));
            dummy.lookAt(pos.clone().add(tangent));
            dummy.rotation.x = -Math.PI / 2; // Flat on floor
            dummy.scale.set(1.4, 0.8, 1); 
            dummy.updateMatrix();
            chevronRef.current.setMatrixAt(i, dummy.matrix);
        }
        chevronRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* Glossy Under-glow */}
      <Line points={smoothPoints} color={color} lineWidth={22} transparent opacity={0.15} depthTest={false} />
      {/* Precision Core */}
      <Line points={smoothPoints} color={color} lineWidth={4} transparent opacity={0.8} depthTest={false} />
      {/* Directional Chevrons */}
      <instancedMesh ref={chevronRef} args={[undefined, undefined, 40]} frustumCulled={false}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.6} side={THREE.DoubleSide} depthTest={false} />
      </instancedMesh>
    </group>
  );
};

const NavigationLayer = () => {
  const { navSubject, accentColor, userPosition, foodStalls, restrooms, setWayfindingStats } = useStadium();
  const lastUpdateTime = useRef(0);

  useFrame((state) => {
    if (!navSubject) return;
    const now = state.clock.elapsedTime;
    if (now - lastUpdateTime.current < 2) return;
    
    lastUpdateTime.current = now;
    const dist = state.camera.position.distanceTo(new THREE.Vector3(...navSubject.position));
    setWayfindingStats?.({ distance: dist, time: Math.max(1, Math.ceil(dist / 80)) });
  });

  const wayfinding = useMemo(() => {
    if (!navSubject || navSubject.name === 'Hero Fan') return null;
    try {
      const graph = buildStadiumGraph([...foodStalls, ...restrooms], userPosition);
      const targetId = `stall_${navSubject.id}`;
      const pathIds = graph[targetId] ? findPath(graph, 'start', targetId) : null;
      if (!pathIds || pathIds.length < 2) return { points: [new THREE.Vector3(...userPosition), new THREE.Vector3(...navSubject.position)] };
      return { points: pathIds.map(id => new THREE.Vector3(graph[id].x, graph[id].y + 0.5, graph[id].z)) };
    } catch { return null; }
  }, [navSubject?.id, userPosition, foodStalls, restrooms]);

  return wayfinding ? <TacticalPath points={wayfinding.points} color={accentColor} /> : null;
};

const FriendLayer = () => {
  const { liveFriends, povMode } = useStadium();
  const { camera } = useThree();
  
  const visibleFriends = useMemo(() => {
    return liveFriends.filter(f => {
      const pos = new THREE.Vector3(...f.position);
      // PERFORMANCE: Cull markers beyond 120m
      return camera.position.distanceTo(pos) < 120;
    });
  }, [liveFriends, camera.position]);

  return (
    <group>
      {visibleFriends.map(f => <FriendMarker key={f.id} userId={f.id} name={f.name} position={f.position} isPOV={povMode === 'fan'} />)}
    </group>
  );
};

const HeatmapLayer = () => {
  const { liveFriends, densityMap, cvDensityMap } = useStadium();

  return (
    <group>
      {/* Live Friends — floating pills above seats */}
      {liveFriends.map((f, i) => (
        <mesh key={`heat-friend-${i}`} position={[f.position[0], f.position[1] + 1, f.position[2]]}>
          <sphereGeometry args={[2, 8, 8]} />
          <meshBasicMaterial color="#ef4444" transparent opacity={0.4} />
        </mesh>
      ))}

      {/* Stand Density Zones (Aggregate) */}
      {densityMap.map((z, i) => {
          const theta = (i / 20) * Math.PI * 2;
          const r = 75;
          const x = Math.cos(theta) * r;
          const z_pos = Math.sin(theta) * r;
          const color = z.density > 0.7 ? "#B91C1C" : z.density > 0.4 ? "#b45309" : "#15803D";
          return (
            <mesh key={z.id} position={[x, 0.1, z_pos]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[15, 32]} />
              <meshBasicMaterial color={color} transparent opacity={z.density * 0.3} depthTest={false} />
            </mesh>
          );
      })}

      {/* CV Pipeline Density Heatmap — per-point blobs on the floor */}
      {cvDensityMap.map((p, i) => {
        const floorY = getStadiumHeightAt(p.x, p.z) + 0.05;
        // intensity 0–1: green → yellow → red
        const color = p.intensity > 0.7 ? "#dc2626" : p.intensity > 0.4 ? "#f97316" : "#16a34a";
        const radius = 4 + p.intensity * 8; // 4m–12m blob radius
        const opacity = 0.12 + p.intensity * 0.18; // very subtle, max ~0.30
        return (
          <mesh key={`cv-heat-${i}`} position={[p.x, floorY, p.z]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[radius, 24]} />
            <meshBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} depthTest={false} />
          </mesh>
        );
      })}
    </group>
  );
};

import UtilityMarker from "./UtilityMarker";

const UtilityLayer = () => {
    const { foodStalls, restrooms } = useStadium();
    return (
        <group>
            {foodStalls.map(stall => (
                <UtilityMarker 
                    key={stall.id} 
                    id={stall.id} 
                    name={stall.name} 
                    position={stall.position} 
                    type="food" 
                    waitTime={stall.waitTime} 
                    locationID={stall.locationID} 
                />
            ))}
            {restrooms.map(rr => (
                <UtilityMarker 
                    key={rr.id} 
                    id={rr.id} 
                    name={rr.name} 
                    position={rr.position} 
                    type="restroom" 
                    locationID={rr.locationID} 
                />
            ))}
        </group>
    );
};

const CVDebugLayer = ({ visible }: { visible: boolean }) => {
  const { cvDensityMap } = useStadium();
  if (!visible || !cvDensityMap) return null;
  
  return (
    <group>
       {cvDensityMap.map((p, i) => (
           <mesh key={`cv-${i}`} position={[p.x, getStadiumHeightAt(p.x, p.z) + 1.5, p.z]}>
              <sphereGeometry args={[1.0, 8, 8]} />
              <meshBasicMaterial color="#00f2ff" transparent opacity={0.6} wireframe />
           </mesh>
       ))}
    </group>
  );
};

const SocialFlareLayer = () => {
  const { socialFlares } = useStadium();
  
  return (
    <group>
      {socialFlares.map((flare, i) => (
        <group key={`flare-${i}`} position={[flare.x, getStadiumHeightAt(flare.x, flare.z) + 0.1, flare.z]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[2, 2.5, 32]} />
            <meshBasicMaterial color="#00f2ff" transparent opacity={0.8} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[2.5, 32]} />
            <meshBasicMaterial color="#00f2ff" transparent opacity={0.2} />
          </mesh>
          <pointLight color="#00f2ff" intensity={5} distance={10} />
        </group>
      ))}
    </group>
  );
};

const HistoryLayer = () => {
  const { historyPath } = useStadium();
  const points = useMemo(() => historyPath?.map(p => new THREE.Vector3(...p)), [historyPath]);
  return points ? <TacticalPath points={points} color="#fca5a1" /> : null;
};

const DEFAULT_CAM_POS = new THREE.Vector3(0, 150, 200);

const CameraController = () => {
  const { userPosition } = useStadium();
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  
  const hasInitialized = useRef(false);

  useFrame(() => {
    if (!controlsRef.current) return;
    const controls = controlsRef.current;
    
    const currentSeat = new THREE.Vector3(...userPosition);
    const eyePos = currentSeat.clone().add(new THREE.Vector3(0, 1.6, 0));

    // Strictly lock the pivot target to the exact eye position
    controls.target.copy(eyePos);
    
    // Only set the physical camera placement on the very first start-up
    if (!hasInitialized.current) {
        const lookDir = new THREE.Vector3(0, 0, 0).sub(eyePos).normalize();
        if (lookDir.lengthSq() === 0) lookDir.set(0, 0, -1);
        const lockedCamPos = eyePos.clone().sub(lookDir.multiplyScalar(0.01));
        camera.position.copy(lockedCamPos);
        hasInitialized.current = true;
    }
    
    // Enforce POV mechanics (No panning away from seat, no zooming out)
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.minDistance = 0.01;
    controls.maxDistance = 0.01;

    controls.update();
  });

  return (
    <>
      <PerspectiveCamera makeDefault position={DEFAULT_CAM_POS} fov={60} near={0.1} far={2000} />
      <OrbitControls ref={controlsRef} makeDefault rotateSpeed={0.5} maxPolarAngle={Math.PI / 1.7} />
    </>
  );
};

export const StadiumView = ({ showCVDots = false }: { showCVDots?: boolean }) => {
  const { navSubject, accentColor } = useStadium();
  return (
    <div className="w-full h-full bg-[#0A0A0B]">
      <Canvas shadows>
        <ambientLight intensity={0.8} />
        <pointLight position={[100, 200, 100]} intensity={3} castShadow shadow-mapSize={[2048, 2048]} />
        <ProceduralStadium />
        <NavigationLayer />
        {navSubject && <LandingZone position={navSubject.position} color={accentColor} />}
        <FriendLayer />
        <HeatmapLayer />
        <UtilityLayer />
        <SocialFlareLayer />
        <CVDebugLayer visible={showCVDots} />
        <HistoryLayer />
        <CameraController />
        <fog attach="fog" args={["#0A0A0B", 600, 4000]} />
      </Canvas>
    </div>
  );
};

export default StadiumView;
