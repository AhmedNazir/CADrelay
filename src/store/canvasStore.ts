import { create } from 'zustand';
import { getComponentTerminals } from '../engine/graph';
import {
  findTerminalAtPoint,
  getWireEndpoints,
  updateWireEndpoints,
} from '../utils/wireGeometry';

export type ComponentType =
  // Power Rails & Supplies
  | 'POWER_RAIL_L1'
  | 'POWER_RAIL_L2'
  | 'POWER_RAIL_L3'
  | 'POWER_AC_N'
  | 'POWER_RAIL_PE'
  | 'POWER_DC_POS'
  | 'POWER_DC_NEG'
  | 'POWER_DC_PE'
  | 'POWER_AC_1P_N'
  | 'POWER_AC_3P'
  | 'POWER_AC_3P_N'
  | 'POWER_AC_3P_N_PE'
  | 'DC_BATTERY'
  | 'INVERTER_1P'
  | 'INVERTER_3P'
  | 'GENERATOR_3P'
  // Circuit Protection (Protections section)
  | 'CIRCUIT_BREAKER'
  | 'FUSE'
  | 'PHASE_FAILURE'
  | 'FUSE_1P'
  | 'FUSE_2P'
  | 'FUSE_3P'
  | 'FUSE_4P'
  | 'OVERLOAD_1P'
  | 'OVERLOAD_2P'
  | 'OVERLOAD_3P'
  | 'FUSE_DISC_1P'
  | 'FUSE_DISC_1PN'
  | 'FUSE_DISC_2P'
  | 'FUSE_DISC_3P'
  | 'FUSE_DISC_3PN'
  | 'FUSE_DISC_4P'
  | 'ISOLATOR_1P'
  | 'ISOLATOR_2P'
  | 'ISOLATOR_3P'
  | 'ISOLATOR_4P'
  | 'MCB_1P'
  | 'MCB_2P'
  | 'MCB_3P'
  | 'MCB_4P'
  | 'MCCB_1P'
  | 'MCCB_2P'
  | 'MCCB_3P'
  | 'MCCB_4P'
  | 'MAG_CB_1P'
  | 'MAG_CB_2P'
  | 'MAG_CB_3P'
  | 'MAG_CB_4P'
  | 'RCD_2P'
  | 'RCD_4P'
  | 'RCBO_1PN'
  | 'RCBO_2P'
  | 'RCBO_3P'
  | 'RCBO_4P'
  // Switches & Inputs
  | 'PUSHBUTTON_NO'
  | 'PUSHBUTTON_NC'
  | 'EMERGENCY_STOP'
  | 'SWITCH_TOGGLE'
  | 'SWITCH_2P'
  | 'SWITCH_3P'
  | 'THERMAL_OVERLOAD'
  // Contacts & Power Contactors
  | 'NO_CONTACT'
  | 'NC_CONTACT'
  | 'TIMER_NO_CONTACT'
  | 'TIMER_NC_CONTACT'
  | 'CONTACTOR_1P'
  | 'CONTACTOR_2P'
  | 'CONTACTOR_3P'
  | 'CONTACTOR_4P'
  // Coils & Relays
  | 'COIL'
  | 'COIL_SET'
  | 'COIL_RESET'
  | 'TIMER_TON'
  | 'TIMER_TOF'
  // Outputs & Actuators
  | 'LAMP'
  | 'MOTOR_1P'
  | 'MOTOR_3P'
  | 'MOTOR_3P_V'
  | 'MOTOR_3P_6T'
  | 'HEATER_1P'
  | 'HEATER_3P'
  | 'BUZZER';

export type RotationAngle = 0 | 90 | 180 | 270;

export interface CanvasComponent {
  id: string;
  type: ComponentType;
  x: number;
  y: number;
  label: string; // Connection / link tag (e.g. KM1, KT1)
  name?: string; // Display name shown on the canvas (falls back to label if empty)
  rotation?: RotationAngle;
  flipX?: boolean;
  flipY?: boolean;
  timerDelay?: number; // ms for timers
  color?: string; // e.g. for lamps (#00e676, #f44336, #ffb300, #2196f3)
  state?: boolean; // switch or toggle state
}

export interface WirePinRef {
  componentId: string;
  terminalName: string;
}

export interface WireSegment {
  id: string;
  points: number[]; // [x1, y1, ..., x2, y2]
  color?: string;
  strokeWidth?: number;
  startPin?: WirePinRef;
  endPin?: WirePinRef;
}

interface HistoryEntry {
  components: CanvasComponent[];
  wires: WireSegment[];
}

interface CanvasState {
  components: CanvasComponent[];
  wires: WireSegment[];
  selectedIds: string[];
  pressedButtons: Set<string>; // active momentary pushbuttons
  toggledSwitches: Set<string>; // toggle switches, breaker positions
  history: HistoryEntry[];
  historyIndex: number;

  addComponent: (comp: CanvasComponent) => void;
  updateComponent: (id: string, updates: Partial<CanvasComponent>) => void;
  moveComponent: (id: string, newX: number, newY: number) => void;
  previewComponentMove: (
    id: string,
    newX: number,
    newY: number,
    origComp: CanvasComponent,
    origWires: WireSegment[]
  ) => void;
  commitComponentMove: (
    id: string,
    newX: number,
    newY: number,
    origComponents: CanvasComponent[],
    origWires: WireSegment[]
  ) => void;
  removeSelected: () => void;
  addWire: (wire: WireSegment) => void;
  updateWire: (id: string, updates: Partial<WireSegment>) => void;
  updateWires: (ids: string[], updates: Partial<WireSegment>) => void;
  setSelected: (ids: string[]) => void;
  toggleButton: (id: string) => void;
  setButtonState: (id: string, pressed: boolean) => void;
  toggleSwitch: (id: string) => void;
  rotateSelected: () => void;
  mirrorSelected: (axis: 'x' | 'y') => void;
  duplicateSelected: () => void;
  loadCircuit: (components: CanvasComponent[], wires: WireSegment[]) => void;
  clearAll: () => void;
  undo: () => void;
  redo: () => void;
  _pushHistory: () => void;
}

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));

function syncWiresForComponentTransform(
  prevComp: CanvasComponent,
  nextComp: CanvasComponent,
  wires: WireSegment[]
): WireSegment[] {
  const oldTerms = getComponentTerminals(prevComp);
  const newTerms = getComponentTerminals(nextComp);
  const newByName = new Map(newTerms.map((t) => [t.name, t]));

  const findOldTerminalAt = (px: number, py: number) =>
    oldTerms.find((t) => Math.abs(t.x - px) <= 2 && Math.abs(t.y - py) <= 2);

  return wires.map((w) => {
    const { x1, y1, x2, y2 } = getWireEndpoints(w.points);

    let nextStart: [number, number] | null = null;
    let nextStartPin = w.startPin;
    if (w.startPin?.componentId === prevComp.id) {
      const nt = newByName.get(w.startPin.terminalName);
      if (nt) nextStart = [nt.x, nt.y];
    } else if (!w.startPin) {
      const ot = findOldTerminalAt(x1, y1);
      if (ot) {
        const nt = newByName.get(ot.name);
        if (nt) {
          nextStart = [nt.x, nt.y];
          nextStartPin = { componentId: prevComp.id, terminalName: ot.name };
        }
      }
    }

    let nextEnd: [number, number] | null = null;
    let nextEndPin = w.endPin;
    if (w.endPin?.componentId === prevComp.id) {
      const nt = newByName.get(w.endPin.terminalName);
      if (nt) nextEnd = [nt.x, nt.y];
    } else if (!w.endPin) {
      const ot = findOldTerminalAt(x2, y2);
      if (ot) {
        const nt = newByName.get(ot.name);
        if (nt) {
          nextEnd = [nt.x, nt.y];
          nextEndPin = { componentId: prevComp.id, terminalName: ot.name };
        }
      }
    }

    if (!nextStart && !nextEnd) return w;

    return {
      ...w,
      points: updateWireEndpoints(w.points, nextStart, nextEnd),
      ...(nextStartPin ? { startPin: nextStartPin } : {}),
      ...(nextEndPin ? { endPin: nextEndPin } : {}),
    };
  });
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  components: [],
  wires: [],
  selectedIds: [],
  pressedButtons: new Set(),
  toggledSwitches: new Set(),
  history: [],
  historyIndex: -1,

  _pushHistory: () => {
    const { components, wires, history, historyIndex } = get();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ components: clone(components), wires: clone(wires) });
    set({ history: newHistory, historyIndex: newHistory.length - 1 });
  },

  addComponent: (comp) => {
    get()._pushHistory();
    set((s) => ({ components: [...s.components, comp] }));
  },

  updateComponent: (id, updates) =>
    set((s) => ({
      components: s.components.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    })),

  moveComponent: (id, newX, newY) => {
    const { components, wires } = get();
    const comp = components.find((c) => c.id === id);
    if (!comp) return;
    if (newX === comp.x && newY === comp.y) return;

    get()._pushHistory();
    const nextComp = { ...comp, x: newX, y: newY };
    const updatedWires = syncWiresForComponentTransform(comp, nextComp, wires);

    set({
      components: components.map((c) => (c.id === id ? nextComp : c)),
      wires: updatedWires,
    });
  },

  previewComponentMove: (id, newX, newY, origComp, origWires) => {
    const nextComp = { ...origComp, x: newX, y: newY };
    const updatedWires = syncWiresForComponentTransform(origComp, nextComp, origWires);
    set((s) => ({
      components: s.components.map((c) => (c.id === id ? nextComp : c)),
      wires: updatedWires,
    }));
  },

  commitComponentMove: (id, newX, newY, origComponents, origWires) => {
    const origComp = origComponents.find((c) => c.id === id);
    if (!origComp) return;

    if (newX === origComp.x && newY === origComp.y) {
      set({ components: origComponents, wires: origWires });
      return;
    }

    const { history, historyIndex } = get();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ components: clone(origComponents), wires: clone(origWires) });

    const nextComp = { ...origComp, x: newX, y: newY };
    const updatedWires = syncWiresForComponentTransform(origComp, nextComp, origWires);

    set({
      components: origComponents.map((c) => (c.id === id ? nextComp : c)),
      wires: updatedWires,
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },

  removeSelected: () => {
    const { selectedIds } = get();
    if (!selectedIds.length) return;
    get()._pushHistory();
    const removedSet = new Set(selectedIds);
    set((s) => ({
      components: s.components.filter((c) => !removedSet.has(c.id)),
      wires: s.wires
        .filter((w) => !removedSet.has(w.id))
        .map((w) => {
          const dropStart = w.startPin && removedSet.has(w.startPin.componentId);
          const dropEnd = w.endPin && removedSet.has(w.endPin.componentId);
          if (!dropStart && !dropEnd) return w;
          return {
            ...w,
            startPin: dropStart ? undefined : w.startPin,
            endPin: dropEnd ? undefined : w.endPin,
          };
        }),
      selectedIds: [],
    }));
  },

  addWire: (wire) => {
    const { components } = get();
    const { x1, y1, x2, y2 } = getWireEndpoints(wire.points);
    const startTerm =
      wire.startPin ??
      (() => {
        const hit = findTerminalAtPoint(components, x1, y1, getComponentTerminals);
        return hit ? { componentId: hit.componentId, terminalName: hit.terminalName } : undefined;
      })();
    const endTerm =
      wire.endPin ??
      (() => {
        const hit = findTerminalAtPoint(components, x2, y2, getComponentTerminals);
        return hit ? { componentId: hit.componentId, terminalName: hit.terminalName } : undefined;
      })();

    const enriched: WireSegment = {
      ...wire,
      ...(startTerm ? { startPin: startTerm } : {}),
      ...(endTerm ? { endPin: endTerm } : {}),
    };

    get()._pushHistory();
    set((s) => ({ wires: [...s.wires, enriched] }));
  },

  updateWire: (id, updates) => {
    get()._pushHistory();
    set((s) => ({
      wires: s.wires.map((w) => (w.id === id ? { ...w, ...updates } : w)),
    }));
  },

  updateWires: (ids, updates) => {
    if (!ids.length) return;
    const idSet = new Set(ids);
    get()._pushHistory();
    set((s) => ({
      wires: s.wires.map((w) => (idSet.has(w.id) ? { ...w, ...updates } : w)),
    }));
  },

  setSelected: (ids) => set({ selectedIds: ids }),

  toggleButton: (id) =>
    set((s) => {
      const next = new Set(s.pressedButtons);
      next.has(id) ? next.delete(id) : next.add(id);
      return { pressedButtons: next };
    }),

  setButtonState: (id, pressed) =>
    set((s) => {
      const next = new Set(s.pressedButtons);
      pressed ? next.add(id) : next.delete(id);
      return { pressedButtons: next };
    }),

  toggleSwitch: (id) =>
    set((s) => {
      const next = new Set(s.toggledSwitches);
      next.has(id) ? next.delete(id) : next.add(id);
      return { toggledSwitches: next };
    }),

  rotateSelected: () => {
    const { selectedIds, components, wires } = get();
    if (!selectedIds.length) return;
    get()._pushHistory();
    const nextRotation = (r: RotationAngle = 0): RotationAngle => {
      return ((r + 90) % 360) as RotationAngle;
    };
    let nextWires = wires;
    const nextComponents = components.map((c) => {
      if (!selectedIds.includes(c.id)) return c;
      const updated = { ...c, rotation: nextRotation(c.rotation) };
      nextWires = syncWiresForComponentTransform(c, updated, nextWires);
      return updated;
    });
    set({
      components: nextComponents,
      wires: nextWires,
    });
  },

  mirrorSelected: (axis) => {
    const { selectedIds, components, wires } = get();
    if (!selectedIds.length) return;
    get()._pushHistory();
    let nextWires = wires;
    const nextComponents = components.map((c) => {
      if (!selectedIds.includes(c.id)) return c;
      const updated =
        axis === 'x' ? { ...c, flipX: !c.flipX } : { ...c, flipY: !c.flipY };
      nextWires = syncWiresForComponentTransform(c, updated, nextWires);
      return updated;
    });
    set({
      components: nextComponents,
      wires: nextWires,
    });
  },

  duplicateSelected: () => {
    const { selectedIds, components, wires } = get();
    if (!selectedIds.length) return;
    get()._pushHistory();
    const offset = 20;
    const newComps: CanvasComponent[] = [];
    const newWires: WireSegment[] = [];
    const newSelected: string[] = [];
    const compIdMap = new Map<string, string>();

    for (const c of components) {
      if (selectedIds.includes(c.id)) {
        const id = `comp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
        compIdMap.set(c.id, id);
        newComps.push({ ...clone(c), id, x: c.x + offset, y: c.y + offset });
        newSelected.push(id);
      }
    }
    for (const w of wires) {
      if (selectedIds.includes(w.id)) {
        const id = `wire-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
        const pts = w.points.map((v) => v + offset);
        const startPin =
          w.startPin && compIdMap.has(w.startPin.componentId)
            ? { componentId: compIdMap.get(w.startPin.componentId)!, terminalName: w.startPin.terminalName }
            : undefined;
        const endPin =
          w.endPin && compIdMap.has(w.endPin.componentId)
            ? { componentId: compIdMap.get(w.endPin.componentId)!, terminalName: w.endPin.terminalName }
            : undefined;
        newWires.push({
          id,
          points: pts,
          ...(w.color ? { color: w.color } : {}),
          ...(w.strokeWidth !== undefined ? { strokeWidth: w.strokeWidth } : {}),
          ...(startPin ? { startPin } : {}),
          ...(endPin ? { endPin } : {}),
        });
        newSelected.push(id);
      }
    }

    set((s) => ({
      components: [...s.components, ...newComps],
      wires: [...s.wires, ...newWires],
      selectedIds: newSelected,
    }));
  },

  loadCircuit: (newComponents, newWires) => {
    get()._pushHistory();
    set({
      components: clone(newComponents),
      wires: clone(newWires),
      selectedIds: [],
      pressedButtons: new Set(),
      toggledSwitches: new Set(),
    });
  },

  clearAll: () => {
    get()._pushHistory();
    set({
      components: [],
      wires: [],
      selectedIds: [],
      pressedButtons: new Set(),
      toggledSwitches: new Set(),
    });
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex <= 0) return;
    set({ ...history[historyIndex - 1], historyIndex: historyIndex - 1, selectedIds: [] });
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex >= history.length - 1) return;
    set({ ...history[historyIndex + 1], historyIndex: historyIndex + 1, selectedIds: [] });
  },
}));
