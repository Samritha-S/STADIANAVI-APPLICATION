import * as THREE from 'three';

export interface NavNode {
  id: string;
  x: number;
  y: number;
  z: number;
  neighbors: string[];
}

export type NavGraph = Record<string, NavNode>;

// Simple A* implementation
export function findPath(graph: NavGraph, startId: string, endId: string): string[] | null {
  const openSet = new Set([startId]);
  const cameFrom: Record<string, string> = {};
  
  const gScore: Record<string, number> = {};
  gScore[startId] = 0;
  
  const fScore: Record<string, number> = {};
  fScore[startId] = heuristic(graph[startId], graph[endId]);
  
  while (openSet.size > 0) {
    let currentId = Array.from(openSet).reduce((a, b) => 
      (fScore[a] ?? Infinity) < (fScore[b] ?? Infinity) ? a : b
    );
    
    if (currentId === endId) return reconstructPath(cameFrom, currentId);
    
    openSet.delete(currentId);
    const current = graph[currentId];
    if (!current) continue;
    
    for (const neighborId of current.neighbors) {
      const neighbor = graph[neighborId];
      if (!neighbor) continue;
      
      const tentativeGScore = gScore[currentId] + distance(current, neighbor);
      
      const endNode = graph[endId];
      if (!endNode) return null;

      if (tentativeGScore < (gScore[neighborId] ?? Infinity)) {
        cameFrom[neighborId] = currentId;
        gScore[neighborId] = tentativeGScore;
        const h = heuristic(neighbor, endNode);
        fScore[neighborId] = gScore[neighborId] + h;
        openSet.add(neighborId);
      }
    }
  }
  
  return null;
}

function heuristic(a: NavNode, b: NavNode): number {
  // Heavy penalty for changing heights (forces paths to take longer gradual lateral ramps rather than short steep jumps)
  return distance(a, b) + Math.abs(a.y - b.y) * 15;
}

function distance(a: NavNode, b: NavNode): number {
  if (!a || !b) return Infinity;
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2);
}

function reconstructPath(cameFrom: Record<string, string>, current: string): string[] {
  const totalPath = [current];
  while (current in cameFrom) {
    current = cameFrom[current];
    totalPath.unshift(current);
  }
  return totalPath;
}

// Static Grid Cache
let cachedGrid: NavGraph | null = null;

function getStaticGrid(): NavGraph {
  if (cachedGrid) {
    // Return deep clone to prevent pollution
    const clone: NavGraph = {};
    Object.keys(cachedGrid).forEach(id => {
      clone[id] = { ...cachedGrid![id], neighbors: [...cachedGrid![id].neighbors] };
    });
    return clone;
  }
  
  const grid: NavGraph = {};
  const radii = [55, 75, 95, 115];
  const scanHeights = [0.5, 6, 12, 18, 24];
  
  for (let s = 0; s < 8; s++) {
    const thetaStart = s * (Math.PI / 4) + 0.04;
    const thetaMid = s * (Math.PI / 4) + (Math.PI / 8);
    const thetaEnd = (s + 1) * (Math.PI / 4) - 0.04;
    
    [thetaStart, thetaMid, thetaEnd].forEach((theta, tIdx) => {
      const tName = tIdx === 0 ? 'start' : tIdx === 1 ? 'mid' : 'end';
      radii.forEach(r => {
        scanHeights.forEach(h => {
          const id = `node_${s}_${tName}_r${r}_h${h}`;
          grid[id] = { id, x: Math.cos(theta) * r, y: h, z: Math.sin(theta) * r, neighbors: [] };
        });
      });
    });
  }

  const ids = Object.keys(grid);
  ids.forEach(idA => {
    const nodeA = grid[idA];
    ids.forEach(idB => {
      if (idA === idB) return;
      const nodeB = grid[idB];
      const dist = distance(nodeA, nodeB);
      
      // Disabled invisible vertical jumps that caused the zigzag
      const isVertical = false; 
      
      // Allow diagonal walking paths that emulate stairs/ramps naturally
      const isLateral = dist < 35 && Math.abs(nodeA.y - nodeB.y) <= 6.5; 
      
      const isOuterRing = Math.abs(Math.sqrt(nodeA.x**2 + nodeA.z**2) - 115) < 2;
      const isCircular = isOuterRing && dist < 50 && Math.abs(nodeA.y - nodeB.y) < 2 && Math.abs(Math.sqrt(nodeA.x**2 + nodeA.z**2) - Math.sqrt(nodeB.x**2 + nodeB.z**2)) < 10;

      if (isVertical || isLateral || isCircular) {
        if (!nodeA.neighbors.includes(idB)) nodeA.neighbors.push(idB);
      }
    });
  });

  cachedGrid = grid;
  // Final deep clone for the first return
  const finalClone: NavGraph = {};
  Object.keys(grid).forEach(id => {
    finalClone[id] = { ...grid[id], neighbors: [...grid[id].neighbors] };
  });
  return finalClone;
}

export function buildStadiumGraph(stalls: {id: string, position: [number, number, number]}[], userPos: [number, number, number]): NavGraph {
  const graph = getStaticGrid();

  // 3. SEAT & STALL SNAPPING
  const snapToGraph = (pos: [number, number, number], id: string) => {
    graph[id] = { id, x: pos[0], y: pos[1], z: pos[2], neighbors: [] };
    
    // Find multiple potential nearest nodes.
    // CRITICAL: We prioritize nodes with the smallest VERTICAL difference to prevent "falling through floor" paths
    const distances = Object.keys(graph)
      .filter(key => key !== id && !key.startsWith('stall_') && key !== 'start')
      .map(key => {
          const d = distance(graph[id], graph[key]);
          const yDiff = Math.abs(graph[id].y - graph[key].y);
          // Apply a "Gravity Penalty" - nodes on other floors are much harder to reach directly
          return { key, score: d + yDiff * 15 }; 
      })
      .sort((a, b) => a.score - b.score);

    // Snap to the 3 best scoring nodes
    distances.slice(0, 3).forEach(({ key }) => {
      const d = distance(graph[id], graph[key]);
      if (d < 45) { 
        graph[id].neighbors.push(key);
        graph[key].neighbors.push(id);
      }
    });
  };

  snapToGraph(userPos, 'start');
  stalls.forEach(s => snapToGraph(s.position, `stall_${s.id}`));

  return graph;
}
