import { create } from "zustand";
import { useUIStore } from "./uiStore";

export type SimState = "stopped" | "running" | "paused";

export interface TimerStatus {
  elapsed: number;
  total: number;
  done: boolean;
}

interface SimStore {
  simState: SimState;
  speed: number;
  isShortCircuit: boolean;
  energizedWires: Set<string>;
  energizedCoils: Set<string>;
  energizedComponents: Set<string>;
  activeTimers: Record<string, TimerStatus>;
  faultWireIds: Set<string>;
  trippedComponentIds: Set<string>;

  play: () => void;
  pause: () => void;
  stop: () => void;
  step: () => void;
  setSpeed: (ms: number) => void;
  setShortCircuit: (sc: boolean) => void;
  setFaultWireIds: (ids: Set<string>) => void;
  setTrippedComponentIds: (ids: Set<string>) => void;
  setEnergizedWires: (ids: Set<string>) => void;
  setEnergizedCoils: (ids: Set<string>) => void;
  setEnergizedComponents: (ids: Set<string>) => void;
  setActiveTimers: (timers: Record<string, TimerStatus>) => void;
  clearSimState: () => void;
}

export const useSimStore = create<SimStore>((set) => ({
  simState: "stopped",
  speed: 100,
  isShortCircuit: false,
  energizedWires: new Set(),
  energizedCoils: new Set(),
  energizedComponents: new Set(),
  activeTimers: {},
  faultWireIds: new Set(),
  trippedComponentIds: new Set(),

  play: () => {
    useUIStore.getState().setActiveTool("select");
    set({ simState: "running" });
  },
  pause: () =>
    set((s) => {
      const nextState = s.simState === "running" ? "paused" : "running";
      useUIStore.getState().setActiveTool("select");
      return { simState: nextState };
    }),
  stop: () =>
    set({
      simState: "stopped",
      isShortCircuit: false,
      energizedWires: new Set(),
      energizedCoils: new Set(),
      energizedComponents: new Set(),
      activeTimers: {},
      faultWireIds: new Set(),
      trippedComponentIds: new Set(),
    }),
  step: () => set({ simState: "paused" }),
  setSpeed: (ms) => set({ speed: Math.max(30, Math.min(2000, ms)) }),
  setShortCircuit: (sc) => set({ isShortCircuit: sc }),
  setFaultWireIds: (ids) => set({ faultWireIds: ids }),
  setTrippedComponentIds: (ids) => set({ trippedComponentIds: ids }),
  setEnergizedWires: (ids) => set({ energizedWires: ids }),
  setEnergizedCoils: (ids) => set({ energizedCoils: ids }),
  setEnergizedComponents: (ids) => set({ energizedComponents: ids }),
  setActiveTimers: (timers) => set({ activeTimers: timers }),
  clearSimState: () =>
    set({
      isShortCircuit: false,
      energizedWires: new Set(),
      energizedCoils: new Set(),
      energizedComponents: new Set(),
      activeTimers: {},
      faultWireIds: new Set(),
      trippedComponentIds: new Set(),
    }),
}));
