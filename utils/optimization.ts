import { LatLng } from '../types';
import { getDistance } from './geometry';

// Helper to interpolate point on segment
const interpolate = (p1: LatLng, p2: LatLng, t: number): LatLng => {
    return {
        lat: p1.lat + t * (p2.lat - p1.lat),
        lng: p1.lng + t * (p2.lng - p1.lng)
    };
};

// Find point on segment that minimizes: cableDist * penalty + gridDist
export const findOptimalPointOnSegment = (
    station: LatLng,
    p1: LatLng,
    p2: LatLng,
    d1: number, // Grid distance from p1 to Hub
    d2: number, // Grid distance from p2 to Hub
    penalty: number = 2.0 // Default penalty for new cable
): { point: LatLng; totalDist: number; cableDist: number } => {
    
    const costFunc = (t: number) => {
        const p = interpolate(p1, p2, t);
        const cable = getDistance(station, p);
        const d_p_p1 = getDistance(p, p1);
        const d_p_p2 = getDistance(p, p2);
        const grid = Math.min(d_p_p1 + d1, d_p_p2 + d2);
        // Objective: Minimize weighted cost
        return cable * penalty + grid;
    };

    // Golden Section Search
    const phi = (Math.sqrt(5) - 1) / 2;
    
    const L = getDistance(p1, p2);
    // Approximate split t where dist(p, p1)+d1 = dist(p, p2)+d2
    let splitT = (L + d2 - d1) / (2 * L);
    
    const ranges = [];
    if (splitT <= 0.01) ranges.push([0, 1]);
    else if (splitT >= 0.99) ranges.push([0, 1]);
    else {
        ranges.push([0, splitT]);
        ranges.push([splitT, 1]);
    }

    let bestT = 0;
    let minCost = Infinity;

    ranges.forEach(([start, end]) => {
        let l = start, r = end;
        // Check endpoints first
        const cL = costFunc(l);
        const cR = costFunc(r);
        if (cL < minCost) { minCost = cL; bestT = l; }
        if (cR < minCost) { minCost = cR; bestT = r; }

        let c = r - (r - l) * phi;
        let d = l + (r - l) * phi;
        
        for (let i = 0; i < 20; i++) {
            if (costFunc(c) < costFunc(d)) {
                r = d;
                d = c;
                c = r - (r - l) * phi;
            } else {
                l = c;
                c = d;
                d = l + (r - l) * phi;
            }
        }
        const t = (l + r) / 2;
        const val = costFunc(t);
        if (val < minCost) {
            minCost = val;
            bestT = t;
        }
    });

    const finalP = interpolate(p1, p2, bestT);
    const finalCable = getDistance(station, finalP);
    const finalGrid = Math.min(getDistance(finalP, p1) + d1, getDistance(finalP, p2) + d2);

    // Return the ACTUAL total distance (unweighted) for consistency in distance display
    return { point: finalP, totalDist: finalCable + finalGrid, cableDist: finalCable };
};

// Find point on segment that matches target total distance, minimizing cable
export const findTargetPointOnSegment = (
    station: LatLng,
    p1: LatLng,
    p2: LatLng,
    d1: number,
    d2: number,
    targetTotal: number
): { point: LatLng; distDiff: number; cableDist: number } | null => {

    const totalDistFunc = (t: number) => {
        const p = interpolate(p1, p2, t);
        const cable = getDistance(station, p);
        const grid = Math.min(getDistance(p, p1) + d1, getDistance(p, p2) + d2);
        return cable + grid;
    };

    const L = getDistance(p1, p2);
    let splitT = (L + d2 - d1) / (2 * L);
    
    const ranges = [];
    if (splitT <= 0.01) ranges.push([0, 1]);
    else if (splitT >= 0.99) ranges.push([0, 1]);
    else {
        ranges.push([0, splitT]);
        ranges.push([splitT, 1]);
    }

    let validPoints: {t: number, cable: number, diff: number}[] = [];

    ranges.forEach(([start, end]) => {
        // Find min on this segment
        let l = start, r = end;
        const phi = (Math.sqrt(5) - 1) / 2;
        
        // GSS for min
        let c = r - (r - l) * phi;
        let d = l + (r - l) * phi;
        for (let i = 0; i < 15; i++) {
            if (totalDistFunc(c) < totalDistFunc(d)) {
                r = d;
                d = c;
                c = r - (r - l) * phi;
            } else {
                l = c;
                c = d;
                d = l + (r - l) * phi;
            }
        }
        const minT = (l + r) / 2;
        const minVal = totalDistFunc(minT);

        // Binary search for Target
        // 1. Left of min (Decreasing)
        if (totalDistFunc(start) >= targetTotal - 0.1 && minVal <= targetTotal + 0.1) {
             let lo = start, hi = minT;
             for(let i=0; i<20; i++) {
                 let mid = (lo + hi)/2;
                 if (totalDistFunc(mid) > targetTotal) lo = mid;
                 else hi = mid;
             }
             const t = (lo + hi)/2;
             const dist = totalDistFunc(t);
             if (Math.abs(dist - targetTotal) < 0.5) {
                 const p = interpolate(p1, p2, t);
                 validPoints.push({ t, cable: getDistance(station, p), diff: Math.abs(dist - targetTotal) });
             }
        }
        
        // 2. Right of min (Increasing)
        if (totalDistFunc(end) >= targetTotal - 0.1 && minVal <= targetTotal + 0.1) {
             let lo = minT, hi = end;
             for(let i=0; i<20; i++) {
                 let mid = (lo + hi)/2;
                 if (totalDistFunc(mid) < targetTotal) lo = mid;
                 else hi = mid;
             }
             const t = (lo + hi)/2;
             const dist = totalDistFunc(t);
             if (Math.abs(dist - targetTotal) < 0.5) {
                 const p = interpolate(p1, p2, t);
                 validPoints.push({ t, cable: getDistance(station, p), diff: Math.abs(dist - targetTotal) });
             }
        }
    });

    if (validPoints.length === 0) return null;

    // Sort by cable distance (ascending)
    validPoints.sort((a, b) => a.cable - b.cable);
    
    return {
        point: interpolate(p1, p2, validPoints[0].t),
        distDiff: validPoints[0].diff,
        cableDist: validPoints[0].cable
    };
};
