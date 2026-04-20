"use client";

import React, { useMemo, useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Billboard, Text, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useStadium } from "@/context/StadiumContext";

const THEME_DATA = {
  dark: {
    CONCRETE: "#1f2937", // Lighter grey (Slate 800)
    SEAT: "#94a3b8",     // Slate 400 - Polished Grey
    FLOOR: "#0f172a",
    NEON_BLUE: "#00f2ff",
    ROOF: "rgba(255,255,255,0.05)"
  },
  light: {
    CONCRETE: "#F1F5F9",
    SEAT: "#FFFFFF",
    FLOOR: "#E2E8F0",
    NEON_BLUE: "#3b82f6",
    ROOF: "rgba(255,255,255,0.8)"
  }
};

export const StructuralShell = () => {
  const colors = THEME_DATA.dark;
  const pillars = useMemo(() => {
    const points = [];
    for (let i = 0; i < 24; i++) {
      const theta = (i / 24) * Math.PI * 2;
      points.push([Math.cos(theta) * 122, 20, Math.sin(theta) * 122]);
    }
    return points;
  }, []);

  return (
    <group>
      {/* Structural Bowl */}
      <mesh position={[0, 20, 0]} receiveShadow>
        <cylinderGeometry args={[120, 120, 40, 64, 1, true]} />
        <meshStandardMaterial color={colors.CONCRETE} roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
      {/* Pillars */}
      {pillars.map((p, i) => (
        <mesh key={i} position={p as [number, number, number]} castShadow>
          <boxGeometry args={[3, 40, 3]} />
          <meshStandardMaterial color="#475569" />
        </mesh>
      ))}
      {/* Pillars */}
      {pillars.map((p, i) => (
        <mesh key={i} position={p as [number, number, number]} castShadow>
          <boxGeometry args={[3, 40, 3]} />
          <meshStandardMaterial color="#475569" />
        </mesh>
      ))}

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]} receiveShadow>
        <ringGeometry args={[52, 125, 64]} />
        <meshStandardMaterial color="#1e293b" metalness={0.2} roughness={0.8} />
      </mesh>

      {/* NEW: PREMIUM TENSILE ROOF */}
      <mesh position={[0, 42, 0]} rotation={[Math.PI, 0, 0]}>
        <ringGeometry args={[80, 135, 64]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.3} side={THREE.DoubleSide} metalness={0.1} roughness={0.5} />
      </mesh>

      {/* NEW: GLASS RAILINGS - Lowered to clear POV */}
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[56, 56, 1, 64, 1, true]} />
        <meshStandardMaterial color="#38bdf8" transparent opacity={0.1} side={THREE.DoubleSide} />
      </mesh>



      {/* FLOODLIGHTS */}
      {[ [80, 50, 80], [-80, 50, 80], [80, 50, -80], [-80, 50, -80] ].map((pos, i) => (
        <group key={i} position={pos as [number, number, number]}>
           <mesh position={[0, -25, 0]}>
              <boxGeometry args={[4, 50, 4]} />
              <meshStandardMaterial color="#475569" />
           </mesh>
           <mesh position={[0, 0, 0]} rotation={[Math.PI / 4, 0, 0]}>
              <boxGeometry args={[10, 6, 2]} />
              <meshBasicMaterial color="#ffffff" />
           </mesh>
           <pointLight intensity={10} distance={100} color="#ffffff" />
        </group>
      ))}
    </group>
  );
};

export const CirculationRamps = () => {
  const rampGaps = [0, 1, 2, 3, 4, 5, 6, 7];
  return (
    <group>
      {rampGaps.map((i) => {
        const theta = i * (Math.PI / 4) + 0.1;
        const midR = 125;
        const midY = 12.5;
        const length = 32;
        const angle = Math.atan2(25, 30);
        return (
          <group key={i} position={[Math.cos(theta) * midR, midY, Math.sin(theta) * midR]} rotation={[0, -theta + Math.PI / 2, angle]}>
             <mesh castShadow receiveShadow>
               <boxGeometry args={[length, 0.5, 6]} />
               <meshStandardMaterial color="#475569" roughness={0.8} />
             </mesh>
          </group>
        );
      })}
    </group>
  );
};


export const ProceduralStadiumBowl = () => {
  const { densityMap, cvDensityMap } = useStadium();
  const colors = THEME_DATA.dark;
  const seatsPerStand = 4138;
  const totalSeats = seatsPerStand * 8;
  const baseMeshRef = useRef<THREE.InstancedMesh>(null);
  const heatMeshRef = useRef<THREE.InstancedMesh>(null);
  const floorMeshRef = useRef<THREE.InstancedMesh>(null);
  
  const segments = [
    { name: "Stand A", start: 0 * (Math.PI / 4) + 0.04 },
    { name: "Stand B", start: 1 * (Math.PI / 4) + 0.04 },
    { name: "Stand C", start: 2 * (Math.PI / 4) + 0.04 },
    { name: "Stand D", start: 3 * (Math.PI / 4) + 0.04 },
    { name: "Stand E", start: 4 * (Math.PI / 4) + 0.04 },
    { name: "Stand F", start: 5 * (Math.PI / 4) + 0.04 },
    { name: "Stand G", start: 6 * (Math.PI / 4) + 0.04 },
    { name: "Stand H", start: 7 * (Math.PI / 4) + 0.04 },
  ];

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);

  const HEAT_EMPTY = "#15803D"; // Standard Green for Heatmap
  const HEAT_FULL = "#B91C1C"; // Standard Red for Heatmap

  const cvUniforms = useMemo(() => ({
      u_cvCount: { value: 0 },
      u_cvPoints: { value: [] }
  }), []);

  // For native WebGL uniforms
  const cvDataUniform = useMemo(() => {
     const arr = new Float32Array(50 * 3);
     return { value: arr };
  }, []);
  const cvCountUniform = useMemo(() => ({ value: 0 }), []);

  useEffect(() => {
    const dummyMat = new THREE.Object3D();
    dummyMat.scale.set(0, 0, 0);
    dummyMat.updateMatrix();
    for (let i = 0; i < totalSeats; i++) {
      if (baseMeshRef.current) baseMeshRef.current.setMatrixAt(i, dummyMat.matrix);
      if (heatMeshRef.current) heatMeshRef.current.setMatrixAt(i, dummyMat.matrix);
      if (floorMeshRef.current) floorMeshRef.current.setMatrixAt(i, dummyMat.matrix);
    }

    // Init static positions ONCE to avoid CPU choking
    let idx = 0;
    segments.forEach((seg) => {
      const rows = 55;
      const seatsInRow = Math.floor(seatsPerStand / rows);

      for (let r = 0; r < rows; r++) {
        let radius = 55 + r * 1.0;
        let height = 2 + r * 0.5;
        if (r > 30) { radius += 10; height += 5; }

        for (let s = 0; s < seatsInRow; s++) {
          if (idx >= totalSeats) break;
          const theta = seg.start + (s / seatsInRow) * (Math.PI / 4 - 0.08);

          dummy.position.set(Math.cos(theta) * radius, height, Math.sin(theta) * radius);
          dummy.rotation.set(0, -theta + Math.PI / 2, 0.4);
          dummy.scale.set(0.6, 0.2, 0.6);
          dummy.updateMatrix();
          
          if (baseMeshRef.current) baseMeshRef.current.setMatrixAt(idx, dummy.matrix);
          if (baseMeshRef.current) baseMeshRef.current.setColorAt(idx, new THREE.Color(colors.SEAT));
          
          dummy.scale.set(0.65, 0.25, 0.65);
          dummy.updateMatrix();
          if (heatMeshRef.current) heatMeshRef.current.setMatrixAt(idx, dummy.matrix);
          
          if (floorMeshRef.current) {
            dummy.position.set(Math.cos(theta) * radius, height - 0.2, Math.sin(theta) * radius);
            dummy.scale.set(1.1, 0.4, 1.1);
            dummy.rotation.set(0, -theta + Math.PI / 2, 0);
            dummy.updateMatrix();
            floorMeshRef.current.setMatrixAt(idx, dummy.matrix);
            floorMeshRef.current.setColorAt(idx, new THREE.Color(colors.FLOOR));
          }
          idx++;
        }
      }
    });

    if (baseMeshRef.current) {
        baseMeshRef.current.instanceMatrix.needsUpdate = true;
        if (baseMeshRef.current.instanceColor) baseMeshRef.current.instanceColor.needsUpdate = true;
        baseMeshRef.current.computeBoundingSphere();
    }
    if (heatMeshRef.current) {
        heatMeshRef.current.instanceMatrix.needsUpdate = true;
        heatMeshRef.current.computeBoundingSphere();
    }
    if (floorMeshRef.current) {
      floorMeshRef.current.instanceMatrix.needsUpdate = true;
      if (floorMeshRef.current.instanceColor) floorMeshRef.current.instanceColor.needsUpdate = true;
      floorMeshRef.current.computeBoundingSphere();
    }
  }, [totalSeats, baseMeshRef.current, heatMeshRef.current, floorMeshRef.current]);

  useFrame(() => {
    // 5. PERFORMANCE GUARD: Update GPU uniforms directly instead of looping 33,000 instances
    const count = Math.min(cvDensityMap?.length || 0, 50);
    cvCountUniform.value = count;
    
    for(let i=0; i<count; i++) {
        cvDataUniform.value[i*3 + 0] = cvDensityMap[i].x;
        cvDataUniform.value[i*3 + 1] = cvDensityMap[i].z;
        cvDataUniform.value[i*3 + 2] = cvDensityMap[i].intensity;
    }
  });

  return (
    <group>
      <instancedMesh ref={floorMeshRef} args={[undefined, undefined, totalSeats]} receiveShadow frustumCulled={false}>
        <boxGeometry args={[0.7, 0.7, 0.3]} />
        <meshStandardMaterial roughness={1} metalness={0} />
      </instancedMesh>
      <instancedMesh ref={baseMeshRef} args={[undefined, undefined, totalSeats]} castShadow frustumCulled={false}>
        <boxGeometry args={[0.7, 0.7, 0.3]} />
        <meshStandardMaterial roughness={0.5} metalness={0.1} emissive="#1e293b" emissiveIntensity={0.2} />
      </instancedMesh>
      <instancedMesh ref={heatMeshRef} args={[undefined, undefined, totalSeats]} frustumCulled={false}>
        <boxGeometry args={[0.72, 0.72, 0.32]} />
        <meshStandardMaterial 
           transparent 
           opacity={0.6} 
           polygonOffset 
           polygonOffsetFactor={-1}
           onBeforeCompile={(shader) => {
              shader.uniforms.u_cvCount = cvCountUniform;
              shader.uniforms.u_cvPoints = cvDataUniform;

              shader.vertexShader = `
                 uniform int u_cvCount;
                 uniform vec3 u_cvPoints[50];
                 varying float v_Heat;
              ` + shader.vertexShader;

              shader.vertexShader = shader.vertexShader.replace(
                 `#include <begin_vertex>`,
                 `#include <begin_vertex>
                 vec4 wPos = instanceMatrix * vec4(position, 1.0);
                 float heat = 0.05; // Base ambient heat
                 for(int cv_i=0; cv_i<50; cv_i++) {
                    if (cv_i >= u_cvCount) break;
                    float dist = distance(wPos.xz, u_cvPoints[cv_i].xy);
                    float influence = smoothstep(20.0, 0.0, dist) * u_cvPoints[cv_i].z;
                    heat += influence;
                 }
                 v_Heat = clamp(heat, 0.0, 1.0);
                 `
              );

              shader.fragmentShader = `
                 varying float v_Heat;
              ` + shader.fragmentShader;

              shader.fragmentShader = shader.fragmentShader.replace(
                 `vec4 diffuseColor = vec4( diffuse, opacity );`,
                 `
                 vec3 heatEmpty = vec3(0.082, 0.501, 0.239);
                 vec3 heatFull = vec3(0.85, 0.1, 0.1);
                 vec3 finalColor = mix(heatEmpty, heatFull, v_Heat);
                 vec4 diffuseColor = vec4( finalColor, opacity * max(0.1, v_Heat) );
                 `
              );
           }}
        />
      </instancedMesh>
    </group>
  );
};

export const CorporateBalcony = () => {
  const segments = [
    { name: "Executive Suite", start: (Math.PI / 4) * 0.5 },
    { name: "VIP Club", start: (Math.PI / 4) * 2.5 },
    { name: "Press Box", start: (Math.PI / 4) * 4.5 },
    { name: "Members Lounge", start: (Math.PI / 4) * 6.5 },
  ];

  return (
    <group position={[0, 18, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[85, 120, 64]} />
        <meshStandardMaterial color="#1e293b" side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 2, 0]}>
        <cylinderGeometry args={[85.5, 85.5, 4, 128, 1, true]} />
        <meshStandardMaterial color="#60a5fa" transparent opacity={0.4} metalness={0.9} roughness={0.1} side={THREE.DoubleSide} />
      </mesh>
      {segments.map((seg, i) => (
        <group key={i} position={[Math.cos(seg.start) * 85.4, 2, Math.sin(seg.start) * 85.4]}>
          <Billboard>
            <Text fontSize={3} color="#60a5fa" fontWeight="black" textAlign="center">{seg.name}</Text>
          </Billboard>
        </group>
      ))}
    </group>
  );
};

export const CantileveredRoof = () => (
  <group position={[0, 42, 0]}>
    <mesh rotation={[-Math.PI / 2, 0, 0]} castShadow>
      <ringGeometry args={[100, 145, 64]} />
      <meshStandardMaterial color="white" transparent opacity={0.3} side={THREE.DoubleSide} roughness={0.2} metalness={0.8} />
    </mesh>
  </group>
);

export const FieldAndPitch = () => {
  const stripeMap = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      for (let i = 0; i < 16; i++) {
         ctx.fillStyle = i % 2 === 0 ? "#1b5e20" : "#2e7d32";
         ctx.fillRect(0, i * 32, 512, 32);
      }
    }
    return new THREE.CanvasTexture(canvas);
  }, []);

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]} receiveShadow>
        <circleGeometry args={[52, 64]} />
        <meshStandardMaterial color="#1b5e20" roughness={1} map={stripeMap} />
      </mesh>
      
      {/* 1. Boundary Rope (Visual) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.15, 0]}>
        <ringGeometry args={[50, 50.8, 128]} />
        <meshStandardMaterial color="white" />
      </mesh>

      {/* 2. 30-Yard Inner Circle Marker */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.12, 0]}>
        <ringGeometry args={[22, 22.3, 64]} />
        <meshBasicMaterial color="white" transparent opacity={0.2} />
      </mesh>

      <group position={[0, 0.15, 0]}>
        {/* The Rectangular Pitch (Main Strips) */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[12, 22]} />
          <meshStandardMaterial color="#8d6e63" />
        </mesh>
        
        {/* Crease Marks */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 10]}>
          <planeGeometry args={[10, 0.15]} /> 
          <meshBasicMaterial color="white" transparent opacity={0.6} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -10]}>
          <planeGeometry args={[10, 0.15]} /> 
          <meshBasicMaterial color="white" transparent opacity={0.6} />
        </mesh>

        {/* Center Individual Strip */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <planeGeometry args={[4, 22]} />
          <meshStandardMaterial color="#decc9a" roughness={0.9} polygonOffset polygonOffsetFactor={-1} />
        </mesh>
      </group>
      <mesh position={[0, 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[50, 0.4, 8, 64]} />
        <meshStandardMaterial color="#ffffff" metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <circleGeometry args={[145, 64]} />
        <meshStandardMaterial color="#0a0a0a" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[1500, 1500]} />
        <meshStandardMaterial color="#050505" roughness={1} />
      </mesh>
    </group>
  );
};

export const ProceduralStadium = () => {
  return (
    <>
      <FieldAndPitch />
      <StructuralShell />
      <ProceduralStadiumBowl />
      <CorporateBalcony />
      <CirculationRamps />
      <CantileveredRoof />
    </>
  );
};
