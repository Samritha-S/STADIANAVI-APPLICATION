import * as THREE from "three";

export const getStadiumHeightAt = (x: number, z: number): number => {
  const radius = Math.sqrt(x**2 + z**2);
  const rBase = 55;
  
  if (radius < rBase) return 0.5; // Pitch level
  if (radius > 125) return 20;   // Exterior ring

  // Align with ProceduralStadium.tsx logic
  let r;
  if (radius <= 85) {
    r = radius - 55;
  } else {
    // Account for the jump at r > 30 (radius > 85)
    r = radius - 55 - 10;
    if (r < 0) r = 30; // Clamp mid-gap
  }

  let h = 2 + r * 0.5;
  if (r > 30) h += 5;
  return h;
};
