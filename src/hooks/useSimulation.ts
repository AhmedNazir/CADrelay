import { useEffect, useRef } from 'react';
import { useSimStore } from '../store/simStore';
import { useCanvasStore } from '../store/canvasStore';
import { runSimulation } from '../engine/simulator';

export function useSimulation() {
  const { simState, speed } = useSimStore();
  const prevCoilsRef = useRef<Set<string>>(new Set());
  const prevTimersRef = useRef<Record<string, any>>({});
  const lastTimeRef = useRef<number>(performance.now());

  useEffect(() => {
    if (simState === 'stopped') {
      prevCoilsRef.current = new Set();
      prevTimersRef.current = {};
      useSimStore.getState().clearSimState();
      return;
    }
    if (simState === 'paused') {
      lastTimeRef.current = performance.now();
      return;
    }

    lastTimeRef.current = performance.now();

    const tick = () => {
      const now = performance.now();
      const deltaMs = Math.min(250, Math.max(10, now - lastTimeRef.current));
      lastTimeRef.current = now;

      const { components, wires, pressedButtons, toggledSwitches } = useCanvasStore.getState();

      const result = runSimulation(
        components,
        wires,
        pressedButtons,
        toggledSwitches,
        prevCoilsRef.current,
        prevTimersRef.current,
        deltaMs
      );

      prevCoilsRef.current = result.energizedCoils;
      prevTimersRef.current = result.activeTimers;

      const store = useSimStore.getState();
      store.setEnergizedWires(result.energizedWireIds);
      store.setEnergizedCoils(result.energizedCoils);
      store.setEnergizedComponents(result.energizedComponentIds);
      store.setActiveTimers(result.activeTimers);
      store.setShortCircuit(result.shortCircuit);
    };

    tick();
    const interval = setInterval(tick, Math.max(20, speed));
    return () => clearInterval(interval);
  }, [simState, speed]);
}
