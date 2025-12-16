import { LatLng, GridNode, GridLink } from '../types';

const R = 6371; // Earth radius in km

export const getDistance = (p1: LatLng, p2: LatLng): number => {
  const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
  const dLon = ((p2.lng - p1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1.lat * Math.PI) / 180) *
      Math.cos((p2.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Projects point P onto line segment AB. Returns the point on segment.
// Uses a localized Equirectangular projection (adjusting longitude by cos(lat))
// to ensure perpendicularity in meters, not just degrees.
export const projectPointOnSegment = (
  p: LatLng,
  a: LatLng,
  b: LatLng
): LatLng => {
  // Calculate aspect ratio correction factor based on average latitude
  const latAvg = (a.lat + b.lat) / 2;
  const latRad = (latAvg * Math.PI) / 180;
  const k = Math.cos(latRad);

  // Project coordinates into a metric-like space (x scaled by cos(lat))
  const x = p.lng * k;
  const y = p.lat;
  const x1 = a.lng * k;
  const y1 = a.lat;
  const x2 = b.lng * k;
  const y2 = b.lat;

  const A = x - x1;
  const B = y - y1;
  const C = x2 - x1;
  const D = y2 - y1;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;

  if (lenSq !== 0) {
    param = dot / lenSq;
  }

  let xx, yy;

  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  // Un-scale x to get back to longitude
  return { lat: yy, lng: xx / k };
};

// Simple Dijkstra implementation
export const findShortestPath = (
  nodes: GridNode[],
  links: GridLink[],
  startNodeId: string,
  endNodeId: string
): { distance: number; path: string[] } | null => {
  const distances: Record<string, number> = {};
  const previous: Record<string, string | null> = {};
  const queue: string[] = [];

  nodes.forEach((node) => {
    distances[node.id] = Infinity;
    previous[node.id] = null;
    queue.push(node.id);
  });

  distances[startNodeId] = 0;

  while (queue.length > 0) {
    // Sort queue by distance (simplest implementation)
    queue.sort((a, b) => distances[a] - distances[b]);
    const u = queue.shift();

    if (!u) break;
    if (u === endNodeId) {
        // Build path
        const path: string[] = [];
        let curr: string | null = endNodeId;
        while (curr) {
            path.unshift(curr);
            curr = previous[curr];
        }
        return { distance: distances[endNodeId], path };
    }

    if (distances[u] === Infinity) break;

    // Find neighbors
    const neighbors = links
      .filter((l) => l.sourceId === u || l.targetId === u)
      .map((l) => (l.sourceId === u ? l.targetId : l.sourceId));

    neighbors.forEach((v) => {
      if (queue.includes(v)) {
        const uNode = nodes.find((n) => n.id === u)!;
        const vNode = nodes.find((n) => n.id === v)!;
        const alt = distances[u] + getDistance(uNode.position, vNode.position);
        if (alt < distances[v]) {
          distances[v] = alt;
          previous[v] = u;
        }
      }
    });
  }

  return null;
};
