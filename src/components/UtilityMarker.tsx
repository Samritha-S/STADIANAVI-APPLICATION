import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { Clock, MapPin } from 'lucide-react';

interface UtilityMarkerProps {
    id: string;
    name: string;
    position: [number, number, number];
    type: 'food' | 'restroom';
    waitTime?: string;
    locationID?: string;
}

const UtilityMarker: React.FC<UtilityMarkerProps> = ({ name, position, type, waitTime, locationID }) => {
    const groupRef = useRef<THREE.Group>(null);
    const themeColor = type === 'food' ? "#00f2ff" : "#10b981";

    useFrame((state) => {
        if (!groupRef.current) return;

        const worldPos = new THREE.Vector3(...position);
        const dist = state.camera.position.distanceTo(worldPos);
        
        // Performance Culling: Hide markers beyond 150m
        groupRef.current.visible = dist < 150;

        if (groupRef.current.visible) {
            // Legibility scaling
            const scaleFactor = Math.max(1, dist / 60);
            groupRef.current.scale.setScalar(scaleFactor);
        }
    });

    return (
        <group ref={groupRef} position={position}>
            {/* Ground Indicator */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
                <ringGeometry args={[1.5, 2.0, 32]} />
                <meshBasicMaterial color={themeColor} transparent opacity={0.2} />
            </mesh>
            
            <Billboard position={[0, 4, 0]} follow={true}>
                <Html center distanceFactor={15}>
                    <div className="flex flex-col items-center pointer-events-none select-none">
                        <div className="px-5 py-3 bg-black/80 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl flex flex-col items-center gap-2 min-w-[140px]">
                            <div className="flex items-center justify-between w-full gap-4">
                                <span className="text-white font-black text-sm uppercase italic tracking-tighter whitespace-nowrap">
                                    {name}
                                </span>
                                {waitTime && (
                                    <div className={`px-2 py-0.5 rounded text-[10px] font-black flex items-center gap-1 ${parseInt(waitTime) < 10 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                        <Clock size={10} />
                                        {waitTime}M
                                    </div>
                                )}
                            </div>
                            <div className="w-full h-[1px] bg-white/5" />
                            <div className="flex items-center gap-1.5 w-full opacity-40">
                                <MapPin size={10} color={themeColor} />
                                <span className="text-[8px] font-black uppercase tracking-widest text-white">{locationID || 'Concourse'}</span>
                            </div>
                        </div>
                        {/* Stem */}
                        <div className={`w-[2px] h-6 bg-gradient-to-t from-transparent via-${themeColor}/30 to-${themeColor}/50 shadow-[0_0_10px_${themeColor}44]`} />
                    </div>
                </Html>
            </Billboard>
        </group>
    );
};

export default UtilityMarker;
