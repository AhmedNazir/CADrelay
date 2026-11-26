import type { CanvasComponent, WireSegment } from '../store/canvasStore';
import { snapToGrid, GRID_SIZE } from './snapGrid';

export const WIRE_COLOR_PRESETS = [
  { name: 'Default (Theme)', value: '' },
  { name: 'Red (L1 / Phase)', value: '#d32f2f' },
  { name: 'Blue (L2 / Neutral)', value: '#1565c0' },
  { name: 'Purple (L3)', value: '#6a1b9a' },
  { name: 'Green (PE / Earth)', value: '#2e7d32' },
  { name: 'Orange (Control)', value: '#ef6c00' },
  { name: 'Amber (+DC)', value: '#f9a825' },
  { name: 'Black', value: '#111827' },
] as const;

export const WIRE_THICKNESS_PRESETS = [
  { label: '1', title: 'Thin (1 px)', value: 1 },
  { label: '2', title: 'Normal (2 px)', value: 2 },
  { label: '3', title: 'Medium (3 px)', value: 3 },
  { label: '4', title: 'Thick (4 px)', value: 4 },
  { label: '6', title: 'Busbar (6 px)', value: 6 },
] as const;

export const DEFAULT_WIRE_WIDTH = 2;

export function getWireEndpoints(points: number[]): { x1: number; y1: number; x2: number; y2: number } {
  if (points.length < 4) return { x1: 0, y1: 0, x2: 0, y2: 0 };
  return {
    x1: points[0],
    y1: points[1],
    x2: points[points.length - 2],
    y2: points[points.length - 1],
  };
}

export function getWireSubSegments(points: number[]): Array<[number, number, number, number]> {
  const segs: Array<[number, number, number, number]> = [];
  for (let i = 0; i + 3 < points.length; i += 2) {
    segs.push([points[i], points[i + 1], points[i + 2], points[i + 3]]);
  }
  return segs;
}

export function getWireLength(points: number[]): number {
  let len = 0;
  for (const [ax, ay, bx, by] of getWireSubSegments(points)) {
    len += Math.hypot(bx - ax, by - ay);
  }
  return len;
}

export function buildOrthogonalPoints(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  horizontalFirst = true
): number[] {
  if (x1 === x2 || y1 === y2) return [x1, y1, x2, y2];
  if (horizontalFirst) return [x1, y1, x2, y1, x2, y2];
  return [x1, y1, x1, y2, x2, y2];
}

export function simplifyPolyline(points: number[]): number[] {
  if (points.length <= 4) return [...points];

  // Step 1: drop consecutive identical vertices
  const dedup: Array<[number, number]> = [];
  for (let i = 0; i + 1 < points.length; i += 2) {
    const x = Math.round(points[i]);
    const y = Math.round(points[i + 1]);
    const prev = dedup[dedup.length - 1];
    if (!prev || Math.abs(prev[0] - x) > 0.5 || Math.abs(prev[1] - y) > 0.5) {
      dedup.push([x, y]);
    }
  }
  if (dedup.length < 2) {
    const [x, y] = dedup[0] ?? [0, 0];
    return [x, y, x, y];
  }

  // Step 2: drop collinear intermediate points that lie monotonically between neighbors
  const clean: Array<[number, number]> = [dedup[0]];
  for (let i = 1; i < dedup.length - 1; i++) {
    const a = clean[clean.length - 1];
    const b = dedup[i];
    const c = dedup[i + 1];
    const collinearX =
      a[0] === b[0] &&
      b[0] === c[0] &&
      ((a[1] <= b[1] && b[1] <= c[1]) || (a[1] >= b[1] && b[1] >= c[1]));
    const collinearY =
      a[1] === b[1] &&
      b[1] === c[1] &&
      ((a[0] <= b[0] && b[0] <= c[0]) || (a[0] >= b[0] && b[0] >= c[0]));
    if (!collinearX && !collinearY) {
      clean.push(b);
    }
  }
  clean.push(dedup[dedup.length - 1]);

  return clean.flatMap(([x, y]) => [x, y]);
}

/**
 * Updates one or both endpoints of a wire polyline while preserving orthogonal routing.
 */
export function updateWireEndpoints(
  points: number[],
  nextStart: [number, number] | null,
  nextEnd: [number, number] | null
): number[] {
  if (points.length < 4) return points;

  const { x1: sx, y1: sy, x2: ex, y2: ey } = getWireEndpoints(points);

  // If both ends move by the exact same delta, translate the entire polyline rigidly
  if (nextStart && nextEnd) {
    const dx1 = nextStart[0] - sx;
    const dy1 = nextStart[1] - sy;
    const dx2 = nextEnd[0] - ex;
    const dy2 = nextEnd[1] - ey;
    if (Math.abs(dx1 - dx2) < 0.5 && Math.abs(dy1 - dy2) < 0.5) {
      const shifted = [...points];
      for (let i = 0; i + 1 < shifted.length; i += 2) {
        shifted[i] += dx1;
        shifted[i + 1] += dy1;
      }
      return shifted;
    }
  }

  let pts = [...points];

  if (nextStart) {
    const [nx, ny] = nextStart;
    if (pts.length === 4) {
      const [, oy, p1x, p1y] = pts;
      if (nx === p1x || ny === p1y) {
        pts = [nx, ny, p1x, p1y];
      } else if (oy === p1y) {
        // Was horizontal: keep entry into p1 horizontal by dropping vertically at nx
        pts = [nx, ny, nx, p1y, p1x, p1y];
      } else {
        // Was vertical (or general): jog horizontally at ny then vertical to p1
        pts = [nx, ny, p1x, ny, p1x, p1y];
      }
    } else {
      const [ox, oy, p1x, p1y] = pts;
      if (oy === p1y && ox !== p1x) {
        // First segment was horizontal -> keep it horizontal at ny
        pts[0] = nx;
        pts[1] = ny;
        pts[3] = ny;
      } else if (ox === p1x && oy !== p1y) {
        // First segment was vertical -> keep it vertical at nx
        pts[0] = nx;
        pts[1] = ny;
        pts[2] = nx;
      } else {
        pts = [nx, ny, nx, p1y, ...pts.slice(2)];
      }
    }
  }

  if (nextEnd) {
    const [nx, ny] = nextEnd;
    const n = pts.length;
    if (n === 4) {
      const [pmx, pmy, , oy] = pts;
      if (nx === pmx || ny === pmy) {
        pts = [pmx, pmy, nx, ny];
      } else if (oy === pmy) {
        // Was horizontal: keep horizontal out of pm, then vertical to end
        pts = [pmx, pmy, nx, pmy, nx, ny];
      } else {
        // Was vertical: keep vertical out of pm, then horizontal to end
        pts = [pmx, pmy, pmx, ny, nx, ny];
      }
    } else {
      const pmx = pts[n - 4];
      const pmy = pts[n - 3];
      const ox = pts[n - 2];
      const oy = pts[n - 1];
      if (oy === pmy && ox !== pmx) {
        // Last segment was horizontal
        pts[n - 2] = nx;
        pts[n - 1] = ny;
        pts[n - 3] = ny;
      } else if (ox === pmx && oy !== pmy) {
        // Last segment was vertical
        pts[n - 2] = nx;
        pts[n - 1] = ny;
        pts[n - 4] = nx;
      } else {
        pts = [...pts.slice(0, n - 2), pmx, ny, nx, ny];
      }
    }
  }

  return simplifyPolyline(pts);
}

export function projectPointOnSegment(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number
): { x: number; y: number; dist: number; t: number } {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) {
    return { x: ax, y: ay, dist: Math.hypot(px - ax, py - ay), t: 0 };
  }
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
  const x = ax + t * dx;
  const y = ay + t * dy;
  return { x, y, dist: Math.hypot(px - x, py - y), t };
}

export function isPointOnSegmentInterior(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  eps = 1.5
): boolean {
  if (Math.hypot(px - ax, py - ay) <= eps) return false;
  if (Math.hypot(px - bx, py - by) <= eps) return false;
  const proj = projectPointOnSegment(px, py, ax, ay, bx, by);
  return proj.dist <= eps;
}

export interface WireSnapHit {
  x: number;
  y: number;
  wireId: string;
  isEndpoint: boolean;
}

export function findNearestWireSnap(
  px: number,
  py: number,
  wires: WireSegment[],
  maxDist = 12
): WireSnapHit | null {
  let bestVertex: WireSnapHit | null = null;
  let bestVertexDist = maxDist;

  // Prefer snapping to existing wire vertices / endpoints first
  for (const w of wires) {
    for (let i = 0; i + 1 < w.points.length; i += 2) {
      const vx = w.points[i];
      const vy = w.points[i + 1];
      const d = Math.hypot(px - vx, py - vy);
      if (d < bestVertexDist) {
        bestVertexDist = d;
        bestVertex = { x: vx, y: vy, wireId: w.id, isEndpoint: true };
      }
    }
  }
  if (bestVertex) return bestVertex;

  // Otherwise snap onto interior of any wire sub-segment
  let bestSeg: WireSnapHit | null = null;
  let bestSegDist = maxDist;

  for (const w of wires) {
    for (const [ax, ay, bx, by] of getWireSubSegments(w.points)) {
      const proj = projectPointOnSegment(px, py, ax, ay, bx, by);
      if (proj.dist < bestSegDist) {
        let sx = Math.round(proj.x);
        let sy = Math.round(proj.y);
        // Keep orthogonal segment coordinates grid-aligned when possible
        if (ay === by) {
          const gx = snapToGrid(proj.x, GRID_SIZE);
          if (gx >= Math.min(ax, bx) && gx <= Math.max(ax, bx)) sx = gx;
          sy = ay;
        } else if (ax === bx) {
          const gy = snapToGrid(proj.y, GRID_SIZE);
          if (gy >= Math.min(ay, by) && gy <= Math.max(ay, by)) sy = gy;
          sx = ax;
        }
        bestSegDist = proj.dist;
        bestSeg = { x: sx, y: sy, wireId: w.id, isEndpoint: false };
      }
    }
  }

  return bestSeg;
}

export interface JunctionDot {
  x: number;
  y: number;
  live: boolean;
  radius: number;
}

/**
 * Computes visual junction dots where wires join:
 * - T-junctions (wire vertex on interior of another wire segment)
 * - 3+ way branches
 * - 2+ distinct wires meeting at a component terminal
 * - 2 distinct collinear wires spliced end-to-end
 */
export function computeJunctionDots(
  wires: WireSegment[],
  terminalKeys: Set<string>,
  energizedWires: Set<string>
): JunctionDot[] {
  if (wires.length === 0) return [];

  const splitCandidates: Array<{ x: number; y: number }> = [];
  const candidateKeys = new Set<string>();
  const addCandidate = (x: number, y: number) => {
    const rx = Math.round(x);
    const ry = Math.round(y);
    const k = `${rx},${ry}`;
    if (!candidateKeys.has(k)) {
      candidateKeys.add(k);
      splitCandidates.push({ x: rx, y: ry });
    }
  };

  for (const w of wires) {
    for (let i = 0; i + 1 < w.points.length; i += 2) {
      addCandidate(w.points[i], w.points[i + 1]);
    }
  }
  for (const tk of terminalKeys) {
    const [xStr, yStr] = tk.split(',');
    addCandidate(Number(xStr), Number(yStr));
  }

  interface NodeStat {
    x: number;
    y: number;
    atomicDegree: number;
    wireIds: Set<string>;
    dirs: Array<[number, number]>;
    live: boolean;
    maxStrokeWidth: number;
  }

  const nodeStats = new Map<string, NodeStat>();
  const ensureNode = (x: number, y: number) => {
    const rx = Math.round(x);
    const ry = Math.round(y);
    const k = `${rx},${ry}`;
    let stat = nodeStats.get(k);
    if (!stat) {
      stat = {
        x: rx,
        y: ry,
        atomicDegree: 0,
        wireIds: new Set(),
        dirs: [],
        live: false,
        maxStrokeWidth: DEFAULT_WIRE_WIDTH,
      };
      nodeStats.set(k, stat);
    }
    return stat;
  };

  const recordEdge = (
    ax: number,
    ay: number,
    bx: number,
    by: number,
    wireId: string,
    live: boolean,
    strokeWidth: number
  ) => {
    const len = Math.hypot(bx - ax, by - ay);
    if (len < 0.5) return;
    const ux = (bx - ax) / len;
    const uy = (by - ay) / len;

    const na = ensureNode(ax, ay);
    na.atomicDegree += 1;
    na.wireIds.add(wireId);
    na.dirs.push([ux, uy]);
    if (live) na.live = true;
    if (strokeWidth > na.maxStrokeWidth) na.maxStrokeWidth = strokeWidth;

    const nb = ensureNode(bx, by);
    nb.atomicDegree += 1;
    nb.wireIds.add(wireId);
    nb.dirs.push([-ux, -uy]);
    if (live) nb.live = true;
    if (strokeWidth > nb.maxStrokeWidth) nb.maxStrokeWidth = strokeWidth;
  };

  for (const w of wires) {
    const live = energizedWires.has(w.id);
    const sw = w.strokeWidth ?? DEFAULT_WIRE_WIDTH;
    for (const [ax, ay, bx, by] of getWireSubSegments(w.points)) {
      if (Math.hypot(bx - ax, by - ay) < 0.5) continue;

      const mids: Array<{ x: number; y: number; d: number }> = [];
      for (const c of splitCandidates) {
        if (isPointOnSegmentInterior(c.x, c.y, ax, ay, bx, by)) {
          mids.push({ x: c.x, y: c.y, d: Math.hypot(c.x - ax, c.y - ay) });
        }
      }
      if (mids.length === 0) {
        recordEdge(ax, ay, bx, by, w.id, live, sw);
      } else {
        mids.sort((p, q) => p.d - q.d);
        let px = ax;
        let py = ay;
        for (const m of mids) {
          recordEdge(px, py, m.x, m.y, w.id, live, sw);
          px = m.x;
          py = m.y;
        }
        recordEdge(px, py, bx, by, w.id, live, sw);
      }
    }
  }

  const dots: JunctionDot[] = [];
  nodeStats.forEach((stat) => {
    const isCollinearSplice =
      stat.wireIds.size >= 2 &&
      stat.atomicDegree === 2 &&
      Math.abs(stat.dirs[0][0] + stat.dirs[1][0]) < 0.05 &&
      Math.abs(stat.dirs[0][1] + stat.dirs[1][1]) < 0.05;

    if (
      stat.atomicDegree >= 3 ||
      (stat.wireIds.size >= 2 && stat.atomicDegree >= 2) ||
      isCollinearSplice
    ) {
      dots.push({
        x: stat.x,
        y: stat.y,
        live: stat.live,
        radius: Math.max(3.5, stat.maxStrokeWidth * 0.75 + 2),
      });
    }
  });

  return dots;
}

export function findTerminalAtPoint(
  components: CanvasComponent[],
  x: number,
  y: number,
  getTerminalsFn: (comp: CanvasComponent) => Array<{ name: string; x: number; y: number }>,
  tolerance = 2
): { componentId: string; terminalName: string; x: number; y: number } | null {
  for (const c of components) {
    for (const t of getTerminalsFn(c)) {
      if (Math.abs(t.x - x) <= tolerance && Math.abs(t.y - y) <= tolerance) {
        return { componentId: c.id, terminalName: t.name, x: t.x, y: t.y };
      }
    }
  }
  return null;
}
