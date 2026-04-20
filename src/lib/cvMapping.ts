import * as THREE from 'three';
import { getStadiumHeightAt } from './stadiumUtils';

export interface CameraIntrinsics {
  fx: number;
  fy: number;
  cx: number;
  cy: number;
  width: number;
  height: number;
}

export interface CameraExtrinsics {
  position: [number, number, number];
  rotation: [number, number, number]; // Euler angles or quaternion
}

/**
 * CV Data Pipe: 
 * Translates a 2D bounding box coordinate (u, v) from a static 
 * stadium camera feed into a 3D coordinate space [x, y, z].
 */
export function projectCVToStadium(
  u: number, 
  v: number, 
  intrinsics: CameraIntrinsics, 
  extrinsics: CameraExtrinsics
): { x: number; y: number; z: number } | null {
  
  // 1. Normalize 2D coordinate to NDC (Normalized Device Coordinates)
  const ndcX = (u - intrinsics.cx) / intrinsics.fx;
  const ndcY = (v - intrinsics.cy) / intrinsics.fy;

  // 2. Vector in Camera Space (z is always -1 in Three.js right-handed system)
  const cameraDir = new THREE.Vector3(ndcX, ndcY, -1).normalize();

  // 3. Transform to World Space
  const euler = new THREE.Euler(...extrinsics.rotation, 'XYZ');
  cameraDir.applyEuler(euler);

  const origin = new THREE.Vector3(...extrinsics.position);

  // 4. Raycast down onto the Stadium Concourse topology
  // Since our stadium isn't a flat plane, we need to iterate along the ray
  // until the ray's Y coordinate dips below the stadium's procedural height.
  // We advance the ray in 0.5m increments.
  const ray = new THREE.Ray(origin, cameraDir);
  
  let currentDistance = 0;
  const maxDistance = 300; // max stadium draw distance
  const step = 0.5;

  while(currentDistance < maxDistance) {
      const point = ray.at(currentDistance, new THREE.Vector3());
      
      // Get physical floor height at this X/Z coordinate
      const floorY = getStadiumHeightAt(point.x, point.z);
      
      // If the ray hits or goes below the concrete tier, it's a valid seat/standing impact!
      if (point.y <= floorY) {
          // Adjust to precisely floor height
          point.y = floorY;
          return { x: parseFloat(point.x.toFixed(2)), y: parseFloat(point.y.toFixed(2)), z: parseFloat(point.z.toFixed(2)) };
      }
      
      currentDistance += step;
  }

  // Ray missed the stadium floor (e.g. aimed at the sky)
  return null;
}
