import { useEffect, useRef } from "react";
import { useSimStore } from "../store/simStore";
import { useCanvasStore } from "../store/canvasStore";
import { runSimulation } from "../engine/simulator";

export function useSimulation() {
  const { simState, speed } = useSimStore();
  const prevCoilsRef = useRef<Set<string>>(new Set());
  const prevTimersRef = useRef<Record<string, any>>({});
  const lastTimeRef = useRef<number>(performance.now());
  const prevFaultRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  const playTripSound = () => {
    try {
      const AudioCtor = window.AudioContext;
      const context = audioContextRef.current ?? new AudioCtor();
      audioContextRef.current = context;

      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "square";
      oscillator.frequency.setValueAtTime(180, context.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(
        55,
        context.currentTime + 0.45,
      );
      gain.gain.setValueAtTime(0.0001, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.18, context.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.5);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.52);
    } catch {
      // Browsers may block audio until the first user gesture; simulation trip remains active.
    }
  };

  useEffect(() => {
    if (simState === "stopped") {
      prevCoilsRef.current = new Set();
      prevTimersRef.current = {};
      useSimStore.getState().clearSimState();
      return;
    }
    if (simState === "paused") {
      lastTimeRef.current = performance.now();
      return;
    }

    lastTimeRef.current = performance.now();

    const tick = () => {
      const now = performance.now();
      const deltaMs = Math.min(250, Math.max(10, now - lastTimeRef.current));
      lastTimeRef.current = now;

      const { components, wires, pressedButtons, toggledSwitches } =
        useCanvasStore.getState();

      const result = runSimulation(
        components,
        wires,
        pressedButtons,
        toggledSwitches,
        prevCoilsRef.current,
        prevTimersRef.current,
        deltaMs,
      );

      prevCoilsRef.current = result.energizedCoils;
      prevTimersRef.current = result.activeTimers;

      const store = useSimStore.getState();
      store.setEnergizedWires(result.energizedWireIds);
      store.setFaultWireIds(result.faultWireIds);
      store.setTrippedComponentIds(result.trippedComponentIds);
      store.setEnergizedCoils(result.energizedCoils);
      store.setEnergizedComponents(result.energizedComponentIds);
      store.setActiveTimers(result.activeTimers);
      store.setShortCircuit(result.shortCircuit);

      if (result.shortCircuit) {
        const { components } = useCanvasStore.getState();
        const openWhenToggled = new Set([
          "CIRCUIT_BREAKER",
          "THERMAL_OVERLOAD",
          "FUSE",
          "FUSE_1P",
          "FUSE_2P",
          "FUSE_3P",
          "FUSE_4P",
          "OVERLOAD_1P",
          "OVERLOAD_2P",
          "OVERLOAD_3P",
        ]);
        for (const componentId of result.trippedComponentIds) {
          const comp = components.find((item) => item.id === componentId);
          useCanvasStore
            .getState()
            .setSwitchState(
              componentId,
              comp ? !openWhenToggled.has(comp.type) : false,
            );
          if (comp && openWhenToggled.has(comp.type)) {
            useCanvasStore.setState((state) => {
              const next = new Set(state.toggledSwitches);
              next.add(comp.id);
              return { toggledSwitches: next };
            });
          }
        }
        if (!prevFaultRef.current) {
          playTripSound();
        }
        prevFaultRef.current = true;
      } else {
        prevFaultRef.current = false;
      }
    };

    tick();
    const interval = setInterval(tick, Math.max(20, speed));
    return () => clearInterval(interval);
  }, [simState, speed]);
}
