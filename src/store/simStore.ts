import { create } from 'zustand';

export type SimState = 'stopped' | 'running' | 'paused';

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

  play: () => void;
  pause: () => void;
  stop: () => void;
  step: () => void;
  setSpeed: (ms: number) => void;
  setShortCircuit: (sc: boolean) => void;
  setEnergizedWires: (ids: Set<string>) => void;
  setEnergizedCoils: (ids: Set<string>) => void;
  setEnergizedComponents: (ids: Set<string>) => void;
  setActiveTimers: (timers: Record<string, TimerStatus>) => void;
  clearSimState: () => void;
}

export const useSimStore = create<SimStore>((set) => ({
  simState: 'stopped',
  speed: 100,
  isShortCircuit: false,
  energizedWires: new Set(),
  energizedCoils: new Set(),
  energizedComponents: new Set(),
  activeTimers: {},

  play: () => set({ simState: 'running' }),
  pause: () => set((s) => ({ simState: s.simState === 'running' ? 'paused' : 'running' })),
  stop: () =>
    set({
      simState: 'stopped',
      isShortCircuit: false,
      energizedWires: new Set(),
      energizedCoils: new Set(),
      energizedComponents: new Set(),
      activeTimers: {},
    }),
  step: () => set({ simState: 'paused' }),
  setSpeed: (ms) => set({ speed: Math.max(30, Math.min(2000, ms)) }),
  setShortCircuit: (sc) => set({ isShortCircuit: sc }),
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
    }),
}));
