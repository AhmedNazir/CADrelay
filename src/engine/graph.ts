import type { CanvasComponent, WireSegment, RotationAngle } from '../store/canvasStore';
import { getWireEndpoints, getWireSubSegments, isPointOnSegmentInterior, projectPointOnSegment } from '../utils/wireGeometry';

export const TERMINAL_OFFSET = 40;
export type NodeKey = string; // "x,y"

export const nk = (x: number, y: number): NodeKey => `${Math.round(x)},${Math.round(y)}`;

export interface TerminalDef {
  name: string;
  x: number;
  y: number;
  key: NodeKey;
  role?: 'live' | 'neutral' | 'dc_in_pos' | 'dc_in_neg' | 'ac_out_live' | 'ac_out_neutral' | 'ctrl_in' | 'ctrl_out' | 'io';
}

export function rotateOffset(dx: number, dy: number, rot: RotationAngle = 0): [number, number] {
  switch (rot) {
    case 90:
      return [-dy, dx];
    case 180:
      return [-dx, -dy];
    case 270:
      return [dy, -dx];
    default:
      return [dx, dy];
  }
}

export function getProtectionPoleXs(type: string): number[] | null {
  switch (type) {
    case 'FUSE_1P':
    case 'OVERLOAD_1P':
    case 'FUSE_DISC_1P':
    case 'ISOLATOR_1P':
    case 'MCB_1P':
    case 'MCCB_1P':
    case 'MAG_CB_1P':
    case 'CONTACTOR_1P':
    case 'HEATER_1P':
      return [0];

    case 'FUSE_2P':
    case 'OVERLOAD_2P':
    case 'FUSE_DISC_1PN':
    case 'FUSE_DISC_2P':
    case 'ISOLATOR_2P':
    case 'MCB_2P':
    case 'MCCB_2P':
    case 'MAG_CB_2P':
    case 'RCD_2P':
    case 'RCBO_1PN':
    case 'RCBO_2P':
    case 'CONTACTOR_2P':
    case 'SWITCH_2P':
      return [-20, 20];

    case 'FUSE_3P':
    case 'OVERLOAD_3P':
    case 'FUSE_DISC_3P':
    case 'ISOLATOR_3P':
    case 'MCB_3P':
    case 'MCCB_3P':
    case 'MAG_CB_3P':
    case 'RCBO_3P':
    case 'CONTACTOR_3P':
    case 'SWITCH_3P':
    case 'HEATER_3P':
      return [-20, 0, 20];

    case 'FUSE_4P':
    case 'FUSE_DISC_3PN':
    case 'FUSE_DISC_4P':
    case 'ISOLATOR_4P':
    case 'MCB_4P':
    case 'MCCB_4P':
    case 'MAG_CB_4P':
    case 'RCD_4P':
    case 'RCBO_4P':
    case 'CONTACTOR_4P':
      return [-20, 0, 20, 40];

    default:
      return null;
  }
}

export function getComponentTerminals(comp: CanvasComponent): TerminalDef[] {
  const rot = comp.rotation ?? 0;
  const fx = comp.flipX ? -1 : 1;
  const fy = comp.flipY ? -1 : 1;
  const make = (name: string, dx: number, dy: number, role: TerminalDef['role'] = 'io'): TerminalDef => {
    const [rx, ry] = rotateOffset(dx * fx, dy * fy, rot);
    const x = comp.x + rx;
    const y = comp.y + ry;
    return { name, x, y, key: nk(x, y), role };
  };

  const poleXs = getProtectionPoleXs(comp.type);
  if (poleXs) {
    const terms: TerminalDef[] = [];
    poleXs.forEach((px, idx) => {
      terms.push(make(`T${idx + 1}`, px, -40, 'io'));
      terms.push(make(`B${idx + 1}`, px, 40, 'io'));
    });
    return terms;
  }

  if (comp.type === 'PHASE_FAILURE') {
    return [
      make('L1', -20, -40, 'io'),
      make('L2', 0, -40, 'io'),
      make('L3', 20, -40, 'io'),
    ];
  }

  if (comp.type === 'MOTOR_3P_V') {
    return [
      make('U1', -20, -40, 'io'),
      make('V1', 0, -40, 'io'),
      make('W1', 20, -40, 'io'),
    ];
  }

  if (comp.type === 'MOTOR_3P_6T') {
    return [
      make('U1', -20, -40, 'io'),
      make('V1', 0, -40, 'io'),
      make('W1', 20, -40, 'io'),
      make('W2', -20, 40, 'io'),
      make('U2', 0, 40, 'io'),
      make('V2', 20, 40, 'io'),
    ];
  }

  switch (comp.type) {
    case 'POWER_RAIL_L1':
    case 'POWER_RAIL_L3':
    case 'POWER_DC_POS':
      return [make('L', -40, 0, 'live'), make('R', 40, 0, 'live')];

    case 'POWER_RAIL_L2':
      return [make('L', -40, 0, 'neutral'), make('R', 40, 0, 'neutral')];

    case 'POWER_AC_N':
    case 'POWER_RAIL_PE':
    case 'POWER_DC_NEG':
    case 'POWER_DC_PE':
      return [make('L', -40, 0, 'neutral'), make('R', 40, 0, 'neutral')];

    case 'POWER_AC_1P_N':
      return [make('L1', 40, -20, 'live'), make('N', 40, 20, 'neutral')];

    case 'POWER_AC_3P':
      return [
        make('L1', 40, -20, 'live'),
        make('L2', 40, 0, 'live'),
        make('L3', 40, 20, 'live'),
      ];

    case 'POWER_AC_3P_N':
      return [
        make('L1', 40, -40, 'live'),
        make('L2', 40, -20, 'live'),
        make('L3', 40, 0, 'live'),
        make('N', 40, 20, 'neutral'),
      ];

    case 'POWER_AC_3P_N_PE':
      return [
        make('L1', 40, -40, 'live'),
        make('L2', 40, -20, 'live'),
        make('L3', 40, 0, 'live'),
        make('N', 40, 20, 'neutral'),
        make('PE', 40, 40, 'neutral'),
      ];

    case 'DC_BATTERY':
      return [make('+', 40, -20, 'live'), make('-', 40, 20, 'neutral')];

    case 'INVERTER_1P':
      return [
        make('+', -40, -20, 'dc_in_pos'),
        make('-', -40, 20, 'dc_in_neg'),
        make('L1', 40, -20, 'ac_out_live'),
        make('N', 40, 20, 'ac_out_neutral'),
      ];

    case 'INVERTER_3P':
      return [
        make('+', -40, -20, 'dc_in_pos'),
        make('-', -40, 20, 'dc_in_neg'),
        make('L1', 40, -20, 'ac_out_live'),
        make('L2', 40, 0, 'ac_out_live'),
        make('L3', 40, 20, 'ac_out_live'),
      ];

    case 'GENERATOR_3P':
      return [
        make('C1', -40, -20, 'ctrl_in'),
        make('C2', -40, 20, 'ctrl_out'),
        make('L1', 40, -40, 'ac_out_live'),
        make('L2', 40, -20, 'ac_out_live'),
        make('L3', 40, 0, 'ac_out_live'),
        make('N', 40, 20, 'ac_out_neutral'),
      ];

    default:
      return [make('L', -40, 0, 'io'), make('R', 40, 0, 'io')];
  }
}

export function getTerminals(comp: CanvasComponent): { left: NodeKey; right: NodeKey } {
  const terms = getComponentTerminals(comp);
  return {
    left: terms[0].key,
    right: terms[terms.length - 1].key,
  };
}

export interface CircuitGraph {
  wireEdges: Map<NodeKey, Set<NodeKey>>;
  componentEdges: Array<{
    id: string;
    from: NodeKey;
    to: NodeKey;
    comp: CanvasComponent;
    isLoad: boolean;
  }>;
  converters: Array<{
    id: string;
    comp: CanvasComponent;
    terminals: TerminalDef[];
  }>;
  liveNodes: Set<NodeKey>;
  neutralNodes: Set<NodeKey>;
  wireNodeMap: Map<string, [NodeKey, NodeKey]>;
}

export const LOAD_TYPES = new Set([
  'COIL',
  'COIL_SET',
  'COIL_RESET',
  'TIMER_TON',
  'TIMER_TOF',
  'LAMP',
  'MOTOR_1P',
  'MOTOR_3P',
  'BUZZER',
]);

const CONVERTER_TYPES = new Set([
  'INVERTER_1P',
  'INVERTER_3P',
  'GENERATOR_3P',
  'PHASE_FAILURE',
  'MOTOR_3P_V',
  'MOTOR_3P_6T',
]);

const PURE_POWER_TYPES = new Set([
  'POWER_RAIL_L1',
  'POWER_RAIL_L2',
  'POWER_RAIL_L3',
  'POWER_AC_N',
  'POWER_RAIL_PE',
  'POWER_DC_POS',
  'POWER_DC_NEG',
  'POWER_DC_PE',
  'POWER_AC_1P_N',
  'POWER_AC_3P',
  'POWER_AC_3P_N',
  'POWER_AC_3P_N_PE',
  'DC_BATTERY',
]);

export function buildGraph(components: CanvasComponent[], wires: WireSegment[]): CircuitGraph {
  const wireEdges = new Map<NodeKey, Set<NodeKey>>();
  const componentEdges: CircuitGraph['componentEdges'] = [];
  const converters: CircuitGraph['converters'] = [];
  const liveNodes = new Set<NodeKey>();
  const neutralNodes = new Set<NodeKey>();
  const wireNodeMap = new Map<string, [NodeKey, NodeKey]>();

  const addEdge = (a: NodeKey, b: NodeKey) => {
    if (a === b) return;
    if (!wireEdges.has(a)) wireEdges.set(a, new Set());
    if (!wireEdges.has(b)) wireEdges.set(b, new Set());
    wireEdges.get(a)!.add(b);
    wireEdges.get(b)!.add(a);
  };

  const junctionCandidates = new Map<string, [number, number]>();
  const addJunctionCandidate = (x: number, y: number) => {
    junctionCandidates.set(nk(x, y), [x, y]);
  };
  for (const wire of wires) {
    for (let i = 0; i + 1 < wire.points.length; i += 2) {
      addJunctionCandidate(wire.points[i], wire.points[i + 1]);
    }
  }
  for (const comp of components) {
    for (const terminal of getComponentTerminals(comp)) {
      addJunctionCandidate(terminal.x, terminal.y);
    }
  }

  for (const wire of wires) {
    const { x1, y1, x2, y2 } = getWireEndpoints(wire.points);
    const a = nk(x1, y1);
    const b = nk(x2, y2);
    wireNodeMap.set(wire.id, [a, b]);

    for (const [ax, ay, bx, by] of getWireSubSegments(wire.points)) {
      const splitPoints = [{ x: ax, y: ay, distance: 0 }];
      for (const [x, y] of junctionCandidates.values()) {
        if (isPointOnSegmentInterior(x, y, ax, ay, bx, by)) {
          splitPoints.push({
            x,
            y,
            distance: projectPointOnSegment(x, y, ax, ay, bx, by).t,
          });
        }
      }
      splitPoints.push({ x: bx, y: by, distance: 1 });
      splitPoints.sort((left, right) => left.distance - right.distance);
      for (let i = 0; i + 1 < splitPoints.length; i += 1) {
        addEdge(
          nk(splitPoints[i].x, splitPoints[i].y),
          nk(splitPoints[i + 1].x, splitPoints[i + 1].y),
        );
      }
    }
  }

  for (const comp of components) {
    const terms = getComponentTerminals(comp);

    if (PURE_POWER_TYPES.has(comp.type)) {
      for (const t of terms) {
        if (t.role === 'live') liveNodes.add(t.key);
        else if (t.role === 'neutral') neutralNodes.add(t.key);
      }
    } else if (CONVERTER_TYPES.has(comp.type)) {
      converters.push({ id: comp.id, comp, terminals: terms });
    } else if (getProtectionPoleXs(comp.type)) {
      // Multi-pole protection device: each pole (T_k, B_k) is an independent edge
      const isLoad = false;
      for (let i = 0; i < terms.length; i += 2) {
        componentEdges.push({
          id: comp.id,
          from: terms[i].key,
          to: terms[i + 1].key,
          comp,
          isLoad,
        });
      }
    } else {
      const isLoad = LOAD_TYPES.has(comp.type);
      componentEdges.push({
        id: comp.id,
        from: terms[0].key,
        to: terms[1].key,
        comp,
        isLoad,
      });
    }
  }

  return { wireEdges, componentEdges, converters, liveNodes, neutralNodes, wireNodeMap };
}

/** Propagate reachability through wire edges */
export function propagateWires(start: Set<NodeKey>, wireEdges: Map<NodeKey, Set<NodeKey>>): Set<NodeKey> {
  const visited = new Set<NodeKey>(start);
  const queue = [...start];
  while (queue.length > 0) {
    const node = queue.pop()!;
    for (const neighbor of wireEdges.get(node) ?? []) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }
  return visited;
}
