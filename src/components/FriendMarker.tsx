import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Billboard } from '@react-three/drei';
import * as THREE from 'three';

interface FriendMarkerProps {
  userId: string;
  name: string;
  position: [number, number, number];
  isPOV?: boolean;
}

/**
 * FriendMarker: Tactical 3D Presence Layer
 * 1. Implements Distance Culling (120m threshold).
 * 2. Visual rendering for both Drone and POV modes.
 * 3. Dynamic scaling for legibility across tiers.
 */
const FriendMarker: React.FC<FriendMarkerProps> = ({ name, position, isPOV = false }) => {
  const groupRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  
  // High-visibility color for friends
  const themeColor = "#3DFFB5";

  useFrame((state) => {
    if (!groupRef.current) return;

    // 1. DISTANCE CULLING (120m threshold)
    const worldPos = new THREE.Vector3(...position);
    const dist = state.camera.position.distanceTo(worldPos);
    
    // Auto-cull if too far to save performance
    groupRef.current.visible = dist < 120;

    if (groupRef.current.visible) {
      // 2. ADAPTIVE SCALING (Ensure visibility at distance)
      const scaleBase = isPOV ? 0.8 : 1.2;
      const scaleFactor = Math.max(1, dist / 80);
      groupRef.current.scale.setScalar(scaleBase * scaleFactor);

      // 3. AMBIENT GLOW ANIMATION
      if (glowRef.current) {
        glowRef.current.rotation.z += 0.01;
        const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.2 + 0.8;
        glowRef.current.scale.set(pulse, pulse, pulse);
      }
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Target Ring (Surface Anchor) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <ringGeometry args={[0.8, 1.2, 32]} />
        <meshBasicMaterial color={themeColor} transparent opacity={0.4} />
      </mesh>

      {/* Pulsing Core Sphere */}
      <mesh position={[0, 0.5, 0]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshBasicMaterial color={themeColor} />
      </mesh>

      {/* Identity Banner (Billboarded) */}
      <Billboard position={[0, 2.5, 0]} follow={true}>
        <Html center distanceFactor={12}>
          <div className="flex flex-col items-center group pointer-events-none">
            <div className={`px-4 py-1.5 rounded-full border-[1.5px] bg-black/70 backdrop-blur-xl shadow-2xl transition-all`}>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: themeColor }} />
                <span className="text-[12px] font-black tracking-tighter text-white uppercase italic">
                  {name}
                </span>
              </div>
            </div>
            {/* HUD Stem */}
            <div className="w-[1.5px] h-4 bg-gradient-to-t from-transparent to-[#3DFFB5]/80" />
          </div>
        </Html>
      </Billboard>
    </group>
  );
};

export default FriendMarker;
