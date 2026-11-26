import type { CanvasComponent, WireSegment } from '../store/canvasStore';
import type { TimerStatus } from '../store/simStore';
import { buildGraph, propagateWires, type NodeKey } from './graph';

export interface SimResult {
  energizedNodes: Set<NodeKey>;
  energizedCoils: Set<string>;
  energizedWireIds: Set<string>;
  energizedComponentIds: Set<string>;
  activeTimers: Record<string, TimerStatus>;
  shortCircuit: boolean;
}

export function runSimulation(
  components: CanvasComponent[],
  wires: WireSegment[],
  pressedButtons: Set<string>,
  toggledSwitches: Set<string>,
  prevEnergizedCoils: Set<string>,
  prevTimers: Record<string, TimerStatus>,
  deltaMs: number
): SimResult {
  const graph = buildGraph(components, wires);

  // Seed neutral nodes
  const neutralReachable = propagateWires(graph.neutralNodes, graph.wireEdges);

  // Latched coils carry forward
  const latchedCoils = new Set<string>();
  for (const tag of prevEnergizedCoils) {
    const hasReset = components.some(
      (c) => c.type === 'COIL_RESET' && c.label === tag && prevEnergizedCoils.has(tag)
    );
    if (!hasReset) latchedCoils.add(tag);
  }

  const energizedCoils = new Set<string>(latchedCoils);
  const energizedComponentIds = new Set<string>();
  const activeTimers: Record<string, TimerStatus> = { ...prevTimers };

  // Seed live nodes
  const liveReachable = propagateWires(graph.liveNodes, graph.wireEdges);
  let shortCircuit = false;

  // Scan passes for relay logic convergence
  let changed = true;
  let pass = 0;
  while (changed && pass < 40) {
    changed = false;
    pass++;
    const hasNeutral = neutralReachable.size > 0;

    // 1. Evaluate Converters & Generators (Inverters, 3-Phase Generator)
    for (const conv of graph.converters) {
      const { id, comp, terminals } = conv;
      let active = false;

      if (comp.type === 'INVERTER_1P' || comp.type === 'INVERTER_3P') {
        const dcPos = terminals.find((t) => t.role === 'dc_in_pos');
        const dcNeg = terminals.find((t) => t.role === 'dc_in_neg');
        const posOk = dcPos ? liveReachable.has(dcPos.key) : false;
        const negOk = !hasNeutral || (dcNeg ? neutralReachable.has(dcNeg.key) : false);
        active = posOk && negOk;
      } else if (comp.type === 'GENERATOR_3P') {
        const c1 = terminals.find((t) => t.role === 'ctrl_in');
        const c2 = terminals.find((t) => t.role === 'ctrl_out');
        const c1Live = c1 ? liveReachable.has(c1.key) : false;
        const c2Return = !hasNeutral || (c2 ? neutralReachable.has(c2.key) : false);
        const autoModeOn = c1Live && c2Return;
        const manualModeOn = toggledSwitches.has(id);
        active = autoModeOn || manualModeOn;
      } else if (comp.type === 'PHASE_FAILURE') {
        // Energizes linked coil tag when all 3 phases L1, L2, L3 are live
        const allLive = terminals.every((t) => liveReachable.has(t.key));
        if (allLive) {
          energizedComponentIds.add(id);
          if (!energizedCoils.has(comp.label)) {
            energizedCoils.add(comp.label);
            changed = true;
          }
        }
        continue;
      } else if (comp.type === 'MOTOR_3P_V') {
        const allLive = terminals.every((t) => liveReachable.has(t.key));
        if (allLive) energizedComponentIds.add(id);
        continue;
      } else if (comp.type === 'MOTOR_3P_6T') {
        // Runs when U1, V1, W1 (first 3 terminals) are live and W2, U2, V2 are connected (bridged or live)
        const topLive = terminals.slice(0, 3).every((t) => liveReachable.has(t.key));
        const bottomConnected =
          terminals[3].key === terminals[4].key ||
          propagateWires(new Set([terminals[3].key]), graph.wireEdges).has(terminals[4].key) ||
          terminals.slice(3, 6).every((t) => liveReachable.has(t.key));
        if (topLive && bottomConnected) energizedComponentIds.add(id);
        continue;
      }

      if (active) {
        energizedComponentIds.add(id);
        for (const t of terminals) {
          if (t.role === 'ac_out_live' && !liveReachable.has(t.key)) {
            const spread = propagateWires(new Set([t.key]), graph.wireEdges);
            for (const n of spread) {
              if (!liveReachable.has(n)) {
                liveReachable.add(n);
                changed = true;
              }
            }
          } else if (t.role === 'ac_out_neutral' && !neutralReachable.has(t.key)) {
            const spread = propagateWires(new Set([t.key]), graph.wireEdges);
            for (const n of spread) {
              if (!neutralReachable.has(n)) {
                neutralReachable.add(n);
                changed = true;
              }
            }
          }
        }
      }
    }

    // 2. Evaluate Standard Component Edges
    for (const edge of graph.componentEdges) {
      const { id, from, to, comp } = edge;
      const hasLiveFrom = liveReachable.has(from);
      const hasLiveTo = liveReachable.has(to);

      if (!hasLiveFrom && !hasLiveTo) continue;

      let passes = false;

      switch (comp.type) {
        case 'CIRCUIT_BREAKER':
        case 'OVERLOAD_1P':
        case 'OVERLOAD_2P':
        case 'OVERLOAD_3P':
        case 'FUSE':
        case 'FUSE_1P':
        case 'FUSE_2P':
        case 'FUSE_3P':
        case 'FUSE_4P':
          passes = !toggledSwitches.has(comp.id);
          break;

        case 'FUSE_DISC_1P':
        case 'FUSE_DISC_1PN':
        case 'FUSE_DISC_2P':
        case 'FUSE_DISC_3P':
        case 'FUSE_DISC_3PN':
        case 'FUSE_DISC_4P':
        case 'ISOLATOR_1P':
        case 'ISOLATOR_2P':
        case 'ISOLATOR_3P':
        case 'ISOLATOR_4P':
        case 'MCB_1P':
        case 'MCB_2P':
        case 'MCB_3P':
        case 'MCB_4P':
        case 'MCCB_1P':
        case 'MCCB_2P':
        case 'MCCB_3P':
        case 'MCCB_4P':
        case 'MAG_CB_1P':
        case 'MAG_CB_2P':
        case 'MAG_CB_3P':
        case 'MAG_CB_4P':
        case 'RCD_2P':
        case 'RCD_4P':
        case 'RCBO_1PN':
        case 'RCBO_2P':
        case 'RCBO_3P':
        case 'RCBO_4P':
          // Normally OPEN (NO-like): click during simulation to close
          passes = toggledSwitches.has(comp.id);
          break;

        case 'PUSHBUTTON_NO':
          passes = pressedButtons.has(comp.id);
          break;

        case 'PUSHBUTTON_NC':
          passes = !pressedButtons.has(comp.id);
          break;

        case 'EMERGENCY_STOP':
          passes = !toggledSwitches.has(comp.id);
          break;

        case 'SWITCH_TOGGLE':
        case 'SWITCH_2P':
        case 'SWITCH_3P':
          passes = toggledSwitches.has(comp.id);
          break;

        case 'THERMAL_OVERLOAD':
          passes = !toggledSwitches.has(comp.id);
          break;

        case 'NO_CONTACT':
        case 'CONTACTOR_1P':
        case 'CONTACTOR_2P':
        case 'CONTACTOR_3P':
        case 'CONTACTOR_4P':
          passes = energizedCoils.has(comp.label);
          break;

        case 'NC_CONTACT':
          passes = !energizedCoils.has(comp.label);
          break;

        case 'TIMER_NO_CONTACT': {
          const t = activeTimers[comp.label];
          passes = t ? t.done : false;
          break;
        }

        case 'TIMER_NC_CONTACT': {
          const t = activeTimers[comp.label];
          passes = t ? !t.done : true;
          break;
        }

        case 'COIL':
        case 'COIL_SET':
        case 'COIL_RESET':
        case 'TIMER_TON':
        case 'TIMER_TOF':
        case 'LAMP':
        case 'MOTOR_1P':
        case 'MOTOR_3P':
        case 'HEATER_1P':
        case 'HEATER_3P':
        case 'BUZZER': {
          const inNode = hasLiveFrom ? from : to;
          const outNode = inNode === from ? to : from;
          const returnOk = !hasNeutral || neutralReachable.has(outNode);

          if (returnOk) {
            energizedComponentIds.add(id);

            if (comp.type === 'COIL' || comp.type === 'COIL_SET') {
              if (!energizedCoils.has(comp.label)) {
                energizedCoils.add(comp.label);
                changed = true;
              }
            } else if (comp.type === 'COIL_RESET') {
              if (energizedCoils.has(comp.label)) {
                energizedCoils.delete(comp.label);
                changed = true;
              }
            } else if (comp.type === 'TIMER_TON') {
              const total = comp.timerDelay ?? 2000;
              const current = activeTimers[comp.label] ?? { elapsed: 0, total, done: false };
              const elapsed = Math.min(total, current.elapsed + deltaMs);
              const done = elapsed >= total;
              if (current.done !== done) changed = true;
              activeTimers[comp.label] = { elapsed, total, done };
            } else if (comp.type === 'TIMER_TOF') {
              const total = comp.timerDelay ?? 2000;
              activeTimers[comp.label] = { elapsed: total, total, done: true };
            }
          }
          passes = false;
          break;
        }

        default:
          passes = true;
      }

      if (passes) {
        energizedComponentIds.add(id);

        if (hasLiveFrom && !liveReachable.has(to)) {
          const spread = propagateWires(new Set([to]), graph.wireEdges);
          for (const n of spread) {
            if (!liveReachable.has(n)) {
              liveReachable.add(n);
              changed = true;
            }
          }
        }
        if (hasLiveTo && !liveReachable.has(from)) {
          const spread = propagateWires(new Set([from]), graph.wireEdges);
          for (const n of spread) {
            if (!liveReachable.has(n)) {
              liveReachable.add(n);
              changed = true;
            }
          }
        }

        if (hasNeutral) {
          if (
            (liveReachable.has(from) && neutralReachable.has(to)) ||
            (liveReachable.has(to) && neutralReachable.has(from))
          ) {
            shortCircuit = true;
          }
        }
      }
    }

    // 3. Propagate wire nodes
    const spreadLive = propagateWires(liveReachable, graph.wireEdges);
    for (const n of spreadLive) {
      if (!liveReachable.has(n)) {
        liveReachable.add(n);
        changed = true;
      }
    }
  }

  // Handle TOF timer power-loss decay & TON reset
  for (const comp of components) {
    if (comp.type === 'TIMER_TOF' && !energizedComponentIds.has(comp.id)) {
      const current = activeTimers[comp.label];
      if (current && current.done) {
        const elapsed = Math.max(0, current.elapsed - deltaMs);
        const done = elapsed > 0;
        activeTimers[comp.label] = { ...current, elapsed, done };
      }
    }
    if (comp.type === 'TIMER_TON' && !energizedComponentIds.has(comp.id)) {
      if (activeTimers[comp.label]) {
        delete activeTimers[comp.label];
      }
    }
  }

  // Energized wire detection
  const energizedWireIds = new Set<string>();
  for (const [wireId, [a, b]] of graph.wireNodeMap) {
    if (liveReachable.has(a) || liveReachable.has(b)) {
      energizedWireIds.add(wireId);
    }
  }

  return {
    energizedNodes: liveReachable,
    energizedCoils,
    energizedWireIds,
    energizedComponentIds,
    activeTimers,
    shortCircuit,
  };
}
