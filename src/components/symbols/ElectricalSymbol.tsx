import React from "react";
import { Group, Rect, Line, Circle, Text, Arc } from "react-konva";
import type { CanvasComponent } from "../../store/canvasStore";
import type { SimState, TimerStatus } from "../../store/simStore";
import { snapPoint } from "../../utils/snapGrid";

interface Props {
  component: CanvasComponent;
  isSelected: boolean;
  isActive: boolean;
  isPressed?: boolean;
  isToggled?: boolean;
  timerStatus?: TimerStatus;
  theme: "light" | "dark";
  simState: SimState;
  simTick?: number; // for rotating motor animation
  isWireTool?: boolean;
  onClick: () => void;
  onDragEnd: (x: number, y: number) => void;
  onToggleInteractive?: () => void;
}

export const SYMBOL_W = 80;
export const SYMBOL_H = 40;

const WIRE_COLOR = { light: "#1c1c1c", dark: "#d8d8d8" };
const ACTIVE_COLOR = "#00e676";
const SEL_COLOR = "#0078d4";
const L1_COLOR = "#d32f2f";
const L2_COLOR = "#1565c0";
const L3_COLOR = "#6a1b9a";
const PE_COLOR = "#388e3c";

import { getProtectionPoleXs, getComponentTerminals } from "../../engine/graph";

function getSymbolBounds(type: string): {
  left: number;
  right: number;
  top: number;
  bottom: number;
} {
  const poleXs = getProtectionPoleXs(type);
  if (poleXs) {
    const minX = Math.min(...poleXs);
    const maxX = Math.max(...poleXs);
    return {
      left: 40 + minX - 18,
      right: 40 + maxX + 14,
      top: -20,
      bottom: 60,
    };
  }
  switch (type) {
    case "PHASE_FAILURE":
      return { left: 6, right: 74, top: -20, bottom: 38 };
    case "MOTOR_3P_V":
      return { left: 10, right: 70, top: -20, bottom: 52 };
    case "MOTOR_3P_6T":
      return { left: 10, right: 70, top: -20, bottom: 60 };
    case "POWER_AC_1P_N":
    case "POWER_AC_3P":
    case "DC_BATTERY":
    case "INVERTER_1P":
    case "INVERTER_3P":
      return { left: 0, right: SYMBOL_W, top: -14, bottom: 54 };
    case "POWER_AC_3P_N":
      return { left: 0, right: SYMBOL_W, top: -32, bottom: 54 };
    case "POWER_AC_3P_N_PE":
      return { left: 0, right: SYMBOL_W, top: -32, bottom: 74 };
    case "GENERATOR_3P":
      return { left: 0, right: SYMBOL_W, top: -30, bottom: 54 };
    default:
      return { left: 0, right: SYMBOL_W, top: 0, bottom: SYMBOL_H };
  }
}

export const ElectricalSymbol: React.FC<Props> = ({
  component: comp,
  isSelected,
  isActive,
  isPressed,
  isToggled,
  timerStatus,
  theme,
  simState,
  simTick = 0,
  isWireTool = false,
  onClick,
  onDragEnd,
  onToggleInteractive,
}) => {
  const isDark = theme === "dark";
  const sc = isActive
    ? ACTIVE_COLOR
    : isDark
      ? WIRE_COLOR.dark
      : WIRE_COLOR.light;
  const rot = comp.rotation ?? 0;
  const isSimRunning = simState === "running" || simState === "paused";

  const poleXs = getProtectionPoleXs(comp.type);
  const isNonSwitchPole =
    comp.type.startsWith("CONTACTOR_") || comp.type.startsWith("HEATER_");

  const isInteractive =
    comp.type === "PUSHBUTTON_NO" ||
    comp.type === "PUSHBUTTON_NC" ||
    comp.type === "EMERGENCY_STOP" ||
    comp.type === "SWITCH_TOGGLE" ||
    comp.type === "CIRCUIT_BREAKER" ||
    comp.type === "THERMAL_OVERLOAD" ||
    comp.type === "GENERATOR_3P" ||
    (Boolean(poleXs) && !isNonSwitchPole);

  const handleClick = (e: any) => {
    if (isWireTool && !isSimRunning) {
      onClick();
      return;
    }
    e.cancelBubble = true;
    if (isInteractive && isSimRunning && onToggleInteractive) {
      onToggleInteractive();
    } else {
      onClick();
    }
  };

  const renderSymbolContent = () => {
    switch (comp.type) {
      /* ── Contacts ─────────────────────────────────────── */
      case "NO_CONTACT":
        return (
          <>
            <Line
              points={[0, 20, 26, 20]}
              stroke={sc}
              strokeWidth={2}
              lineCap="round"
            />
            <Line points={[26, 8, 26, 32]} stroke={sc} strokeWidth={2.5} />
            <Line points={[54, 8, 54, 32]} stroke={sc} strokeWidth={2.5} />
            <Line
              points={[54, 20, 80, 20]}
              stroke={sc}
              strokeWidth={2}
              lineCap="round"
            />
          </>
        );

      case "NC_CONTACT":
        return (
          <>
            <Line
              points={[0, 20, 26, 20]}
              stroke={sc}
              strokeWidth={2}
              lineCap="round"
            />
            <Line points={[26, 8, 26, 32]} stroke={sc} strokeWidth={2.5} />
            <Line points={[54, 8, 54, 32]} stroke={sc} strokeWidth={2.5} />
            <Line points={[26, 6, 54, 6]} stroke={sc} strokeWidth={2.5} />
            <Line
              points={[54, 20, 80, 20]}
              stroke={sc}
              strokeWidth={2}
              lineCap="round"
            />
          </>
        );

      case "TIMER_NO_CONTACT":
        return (
          <>
            <Line
              points={[0, 20, 26, 20]}
              stroke={sc}
              strokeWidth={2}
              lineCap="round"
            />
            <Line points={[26, 8, 26, 32]} stroke={sc} strokeWidth={2.5} />
            <Line points={[54, 8, 54, 32]} stroke={sc} strokeWidth={2.5} />
            {/* Parachute / umbrella arc for timed contact */}
            <Arc
              x={40}
              y={12}
              innerRadius={10}
              outerRadius={12}
              angle={180}
              rotation={180}
              fill={sc}
            />
            <Line
              points={[54, 20, 80, 20]}
              stroke={sc}
              strokeWidth={2}
              lineCap="round"
            />
          </>
        );

      case "TIMER_NC_CONTACT":
        return (
          <>
            <Line
              points={[0, 20, 26, 20]}
              stroke={sc}
              strokeWidth={2}
              lineCap="round"
            />
            <Line points={[26, 8, 26, 32]} stroke={sc} strokeWidth={2.5} />
            <Line points={[54, 8, 54, 32]} stroke={sc} strokeWidth={2.5} />
            <Line points={[26, 6, 54, 6]} stroke={sc} strokeWidth={2.5} />
            <Arc
              x={40}
              y={12}
              innerRadius={10}
              outerRadius={12}
              angle={180}
              rotation={180}
              fill={sc}
            />
            <Line
              points={[54, 20, 80, 20]}
              stroke={sc}
              strokeWidth={2}
              lineCap="round"
            />
          </>
        );

      /* ── Coils ────────────────────────────────────────── */
      case "COIL":
        return (
          <>
            <Line
              points={[0, 20, 22, 20]}
              stroke={sc}
              strokeWidth={2}
              lineCap="round"
            />
            <Rect
              x={22}
              y={10}
              width={36}
              height={20}
              stroke={sc}
              strokeWidth={2}
              fill={isActive ? "#00e67625" : isDark ? "#232333" : "#fafafa"}
              cornerRadius={2}
            />
            <Text
              x={22}
              y={14}
              width={36}
              text="KM"
              align="center"
              fontSize={11}
              fontStyle="bold"
              fill={sc}
            />
            <Line
              points={[58, 20, 80, 20]}
              stroke={sc}
              strokeWidth={2}
              lineCap="round"
            />
          </>
        );

      case "COIL_SET":
        return (
          <>
            <Line
              points={[0, 20, 22, 20]}
              stroke={sc}
              strokeWidth={2}
              lineCap="round"
            />
            <Rect
              x={22}
              y={10}
              width={36}
              height={20}
              stroke={sc}
              strokeWidth={2}
              fill={isActive ? "#00e67625" : isDark ? "#232333" : "#fafafa"}
              cornerRadius={2}
            />
            <Text
              x={22}
              y={14}
              width={36}
              text="[S]"
              align="center"
              fontSize={11}
              fontStyle="bold"
              fill={sc}
            />
            <Line
              points={[58, 20, 80, 20]}
              stroke={sc}
              strokeWidth={2}
              lineCap="round"
            />
          </>
        );

      case "COIL_RESET":
        return (
          <>
            <Line
              points={[0, 20, 22, 20]}
              stroke={sc}
              strokeWidth={2}
              lineCap="round"
            />
            <Rect
              x={22}
              y={10}
              width={36}
              height={20}
              stroke={sc}
              strokeWidth={2}
              fill={isActive ? "#00e67625" : isDark ? "#232333" : "#fafafa"}
              cornerRadius={2}
            />
            <Text
              x={22}
              y={14}
              width={36}
              text="[R]"
              align="center"
              fontSize={11}
              fontStyle="bold"
              fill={sc}
            />
            <Line
              points={[58, 20, 80, 20]}
              stroke={sc}
              strokeWidth={2}
              lineCap="round"
            />
          </>
        );

      case "TIMER_TON": {
        const elapsed = timerStatus?.elapsed ?? 0;
        const total = timerStatus?.total ?? comp.timerDelay ?? 2000;
        const pct = Math.min(1, elapsed / Math.max(1, total));
        return (
          <>
            <Line
              points={[0, 20, 14, 20]}
              stroke={sc}
              strokeWidth={2}
              lineCap="round"
            />
            <Rect
              x={14}
              y={6}
              width={52}
              height={28}
              stroke={sc}
              strokeWidth={2}
              fill={isActive ? "#00e67620" : isDark ? "#28283c" : "#f0f4ff"}
              cornerRadius={3}
            />
            {/* Progress bar inside timer */}
            {isActive && (
              <Rect
                x={16}
                y={28}
                width={48 * pct}
                height={4}
                fill={timerStatus?.done ? "#00e676" : "#2196f3"}
                cornerRadius={1}
              />
            )}
            <Text
              x={14}
              y={9}
              width={52}
              text="TON"
              align="center"
              fontSize={10}
              fontStyle="bold"
              fill={sc}
            />
            <Text
              x={14}
              y={20}
              width={52}
              text={
                isActive
                  ? `${(elapsed / 1000).toFixed(1)}s`
                  : `${((comp.timerDelay ?? 2000) / 1000).toFixed(1)}s`
              }
              align="center"
              fontSize={9}
              fill={sc}
            />
            <Line
              points={[66, 20, 80, 20]}
              stroke={sc}
              strokeWidth={2}
              lineCap="round"
            />
          </>
        );
      }

      case "TIMER_TOF": {
        const remaining = timerStatus
          ? (timerStatus.elapsed / 1000).toFixed(1)
          : ((comp.timerDelay ?? 2000) / 1000).toFixed(1);
        return (
          <>
            <Line
              points={[0, 20, 14, 20]}
              stroke={sc}
              strokeWidth={2}
              lineCap="round"
            />
            <Rect
              x={14}
              y={6}
              width={52}
              height={28}
              stroke={sc}
              strokeWidth={2}
              fill={isActive ? "#00e67620" : isDark ? "#28283c" : "#f0f4ff"}
              cornerRadius={3}
            />
            <Text
              x={14}
              y={9}
              width={52}
              text="TOF"
              align="center"
              fontSize={10}
              fontStyle="bold"
              fill={sc}
            />
            <Text
              x={14}
              y={20}
              width={52}
              text={`${remaining}s`}
              align="center"
              fontSize={9}
              fill={sc}
            />
            <Line
              points={[66, 20, 80, 20]}
              stroke={sc}
              strokeWidth={2}
              lineCap="round"
            />
          </>
        );
      }

      /* ── Switches & Inputs ────────────────────────────── */
      case "PUSHBUTTON_NO": {
        const pressed = isPressed ?? false;
        const py = pressed ? 16 : 10;
        return (
          <>
            <Line
              points={[0, 20, 26, 20]}
              stroke={sc}
              strokeWidth={2}
              lineCap="round"
            />
            <Line points={[26, 12, 26, 28]} stroke={sc} strokeWidth={2.5} />
            <Line points={[54, 12, 54, 28]} stroke={sc} strokeWidth={2.5} />
            {/* Actuator arm */}
            <Line
              points={[32, py, 48, py]}
              stroke={sc}
              strokeWidth={3}
              lineCap="round"
            />
            <Line points={[40, py, 40, py + 8]} stroke={sc} strokeWidth={2} />
            <Line
              points={[54, 20, 80, 20]}
              stroke={sc}
              strokeWidth={2}
              lineCap="round"
            />
          </>
        );
      }

      case "PUSHBUTTON_NC": {
        const pressed = isPressed ?? false;
        const py = pressed ? 6 : 10;
        return (
          <>
            <Line
              points={[0, 20, 26, 20]}
              stroke={sc}
              strokeWidth={2}
              lineCap="round"
            />
            <Line points={[26, 12, 26, 28]} stroke={sc} strokeWidth={2.5} />
            <Line points={[54, 12, 54, 28]} stroke={sc} strokeWidth={2.5} />
            <Line points={[26, 10, 54, 10]} stroke={sc} strokeWidth={2.5} />
            <Line
              points={[32, py, 48, py]}
              stroke={sc}
              strokeWidth={3}
              lineCap="round"
            />
            <Line points={[40, py, 40, py + 4]} stroke={sc} strokeWidth={2} />
            <Line
              points={[54, 20, 80, 20]}
              stroke={sc}
              strokeWidth={2}
              lineCap="round"
            />
          </>
        );
      }

      case "EMERGENCY_STOP": {
        const open = isToggled ?? false; // latched open when clicked
        const yOffset = open ? -6 : 0;
        return (
          <>
            <Line
              points={[0, 20, 26, 20]}
              stroke={sc}
              strokeWidth={2}
              lineCap="round"
            />
            <Line points={[26, 12, 26, 28]} stroke={sc} strokeWidth={2.5} />
            <Line points={[54, 12, 54, 28]} stroke={sc} strokeWidth={2.5} />
            <Line
              points={[26, 10 + yOffset, 54, 10 + yOffset]}
              stroke={sc}
              strokeWidth={2.5}
            />
            {/* Red Mushroom head */}
            <Arc
              x={40}
              y={6 + yOffset}
              innerRadius={0}
              outerRadius={12}
              angle={180}
              rotation={180}
              fill="#d32f2f"
              stroke="#b71c1c"
              strokeWidth={1}
            />
            <Line
              points={[54, 20, 80, 20]}
              stroke={sc}
              strokeWidth={2}
              lineCap="round"
            />
          </>
        );
      }

      case "SWITCH_TOGGLE": {
        const closed = isToggled ?? false;
        return (
          <>
            <Line
              points={[0, 20, 26, 20]}
              stroke={sc}
              strokeWidth={2}
              lineCap="round"
            />
            <Circle
              x={26}
              y={20}
              radius={3}
              stroke={sc}
              strokeWidth={2}
              fill={sc}
            />
            <Circle
              x={54}
              y={20}
              radius={3}
              stroke={sc}
              strokeWidth={2}
              fill={sc}
            />
            <Line
              points={[26, 20, closed ? 54 : 48, closed ? 20 : 8]}
              stroke={sc}
              strokeWidth={2.5}
              lineCap="round"
            />
            <Line
              points={[54, 20, 80, 20]}
              stroke={sc}
              strokeWidth={2}
              lineCap="round"
            />
          </>
        );
      }

      case "CIRCUIT_BREAKER": {
        const tripped = isToggled ?? false; // open if tripped/switched off
        return (
          <>
            <Line
              points={[0, 20, 24, 20]}
              stroke={sc}
              strokeWidth={2}
              lineCap="round"
            />
            <Circle
              x={24}
              y={20}
              radius={3}
              stroke={sc}
              strokeWidth={2}
              fill={sc}
            />
            <Circle
              x={56}
              y={20}
              radius={3}
              stroke={sc}
              strokeWidth={2}
              fill={sc}
            />
            <Line
              points={[24, 20, tripped ? 44 : 56, tripped ? 8 : 20]}
              stroke={sc}
              strokeWidth={2.5}
              lineCap="round"
            />
            {/* Cross tick representing circuit breaker mechanism */}
            <Line points={[40, 16, 44, 12]} stroke={sc} strokeWidth={2} />
            <Line
              points={[56, 20, 80, 20]}
              stroke={sc}
              strokeWidth={2}
              lineCap="round"
            />
          </>
        );
      }

      case "FUSE":
        return (
          <>
            <Line
              points={[0, 20, 22, 20]}
              stroke={sc}
              strokeWidth={2}
              lineCap="round"
            />
            <Rect
              x={22}
              y={13}
              width={36}
              height={14}
              stroke={sc}
              strokeWidth={2}
              fill="transparent"
            />
            <Line points={[22, 20, 58, 20]} stroke={sc} strokeWidth={1.5} />
            <Line
              points={[58, 20, 80, 20]}
              stroke={sc}
              strokeWidth={2}
              lineCap="round"
            />
          </>
        );

      case "THERMAL_OVERLOAD":
        return (
          <>
            <Line
              points={[0, 20, 26, 20]}
              stroke={sc}
              strokeWidth={2}
              lineCap="round"
            />
            <Line points={[26, 12, 26, 28]} stroke={sc} strokeWidth={2.5} />
            <Line points={[54, 12, 54, 28]} stroke={sc} strokeWidth={2.5} />
            <Line points={[26, 10, 54, 10]} stroke={sc} strokeWidth={2.5} />
            {/* Thermal bimetal U-shape symbol */}
            <Line
              points={[34, 10, 34, 6, 46, 6, 46, 10]}
              stroke={sc}
              strokeWidth={2}
            />
            <Line
              points={[54, 20, 80, 20]}
              stroke={sc}
              strokeWidth={2}
              lineCap="round"
            />
          </>
        );

      /* ── Outputs & Actuators ──────────────────────────── */
      case "LAMP": {
        const lampColor = comp.color ?? "#00e676";
        return (
          <>
            <Line
              points={[0, 20, 26, 20]}
              stroke={sc}
              strokeWidth={2}
              lineCap="round"
            />
            <Circle
              x={40}
              y={20}
              radius={14}
              stroke={sc}
              strokeWidth={2}
              fill={isActive ? lampColor : isDark ? "#222233" : "#fafafa"}
              shadowColor={isActive ? lampColor : undefined}
              shadowBlur={isActive ? 14 : 0}
            />
            {/* Cross inside lamp */}
            <Line
              points={[30, 10, 50, 30]}
              stroke={isActive ? "#ffffff" : sc}
              strokeWidth={2}
            />
            <Line
              points={[30, 30, 50, 10]}
              stroke={isActive ? "#ffffff" : sc}
              strokeWidth={2}
            />
            <Line
              points={[54, 20, 80, 20]}
              stroke={sc}
              strokeWidth={2}
              lineCap="round"
            />
          </>
        );
      }

      case "LAMP_AC": {
        const lampColor = comp.color ?? "#00e676";
        return (
          <>
            <Line
              points={[0, 20, 26, 20]}
              stroke={sc}
              strokeWidth={2}
              lineCap="round"
            />
            <Circle
              x={40}
              y={20}
              radius={14}
              stroke={sc}
              strokeWidth={2}
              fill={isActive ? lampColor : isDark ? "#222233" : "#fafafa"}
              shadowColor={isActive ? lampColor : undefined}
              shadowBlur={isActive ? 14 : 0}
            />
            {/* Sine wave inside for AC */}
            <Line
              points={[30, 20, 35, 12, 40, 20, 45, 28, 50, 20]}
              stroke={isActive ? "#ffffff" : sc}
              strokeWidth={2}
            />
            <Line
              points={[54, 20, 80, 20]}
              stroke={sc}
              strokeWidth={2}
              lineCap="round"
            />
          </>
        );
      }

      case "LAMP_DC": {
        const lampColor = comp.color ?? "#00e676";
        return (
          <>
            <Line
              points={[0, 20, 26, 20]}
              stroke={sc}
              strokeWidth={2}
              lineCap="round"
            />
            <Circle
              x={40}
              y={20}
              radius={14}
              stroke={sc}
              strokeWidth={2}
              fill={isActive ? lampColor : isDark ? "#222233" : "#fafafa"}
              shadowColor={isActive ? lampColor : undefined}
              shadowBlur={isActive ? 14 : 0}
            />
            {/* DC symbol: + and - inside */}
            <Text
              x={32}
              y={10}
              width={16}
              text="+"
              align="center"
              fontSize={14}
              fontStyle="bold"
              fill={isActive ? "#ffffff" : sc}
            />
            <Text
              x={32}
              y={22}
              width={16}
              text="−"
              align="center"
              fontSize={14}
              fontStyle="bold"
              fill={isActive ? "#ffffff" : sc}
            />
            <Line
              points={[54, 20, 80, 20]}
              stroke={sc}
              strokeWidth={2}
              lineCap="round"
            />
          </>
        );
      }

      case "MOTOR_1P": {
        const angle = isActive ? (simTick * 25) % 360 : 0;
        return (
          <>
            <Line
              points={[0, 20, 24, 20]}
              stroke={sc}
              strokeWidth={2}
              lineCap="round"
            />
            <Circle
              x={40}
              y={20}
              radius={16}
              stroke={sc}
              strokeWidth={2.5}
              fill={isActive ? "#2196f325" : isDark ? "#20283c" : "#f0f5ff"}
            />
            <Text
              x={25}
              y={13}
              width={30}
              text="M"
              align="center"
              fontSize={12}
              fontStyle="bold"
              fill={sc}
            />
            <Text
              x={25}
              y={24}
              width={30}
              text="1~"
              align="center"
              fontSize={8}
              fill={sc}
            />
            {/* Spinning rotor indicator ticks */}
            {isActive && (
              <Group x={40} y={20} rotation={angle}>
                <Circle x={11} y={0} radius={2} fill={ACTIVE_COLOR} />
                <Circle x={-11} y={0} radius={2} fill={ACTIVE_COLOR} />
              </Group>
            )}
            <Line
              points={[56, 20, 80, 20]}
              stroke={sc}
              strokeWidth={2}
              lineCap="round"
            />
          </>
        );
      }

      case "MOTOR_3P": {
        const angle = isActive ? (simTick * 35) % 360 : 0;
        return (
          <>
            <Line
              points={[0, 20, 24, 20]}
              stroke={sc}
              strokeWidth={2}
              lineCap="round"
            />
            <Circle
              x={40}
              y={20}
              radius={16}
              stroke={sc}
              strokeWidth={2.5}
              fill={isActive ? "#2196f330" : isDark ? "#20283c" : "#f0f5ff"}
            />
            <Text
              x={25}
              y={13}
              width={30}
              text="M"
              align="center"
              fontSize={12}
              fontStyle="bold"
              fill={sc}
            />
            <Text
              x={25}
              y={24}
              width={30}
              text="3~"
              align="center"
              fontSize={8}
              fontStyle="bold"
              fill={sc}
            />
            {/* 3-bladed rotating indicator */}
            {isActive && (
              <Group x={40} y={20} rotation={angle}>
                <Line
                  points={[0, 0, 0, -11]}
                  stroke={ACTIVE_COLOR}
                  strokeWidth={2}
                />
                <Line
                  points={[0, 0, 9.5, 5.5]}
                  stroke={ACTIVE_COLOR}
                  strokeWidth={2}
                />
                <Line
                  points={[0, 0, -9.5, 5.5]}
                  stroke={ACTIVE_COLOR}
                  strokeWidth={2}
                />
              </Group>
            )}
            <Line
              points={[56, 20, 80, 20]}
              stroke={sc}
              strokeWidth={2}
              lineCap="round"
            />
          </>
        );
      }

      case "BUZZER":
        return (
          <>
            <Line
              points={[0, 20, 26, 20]}
              stroke={sc}
              strokeWidth={2}
              lineCap="round"
            />
            <Arc
              x={40}
              y={20}
              innerRadius={0}
              outerRadius={14}
              angle={180}
              rotation={270}
              stroke={sc}
              strokeWidth={2}
              fill={isActive ? "#ff980040" : "transparent"}
            />
            <Line points={[40, 6, 40, 34]} stroke={sc} strokeWidth={2} />
            {/* Sound waves when active */}
            {isActive && (
              <>
                <Arc
                  x={40}
                  y={20}
                  innerRadius={18}
                  outerRadius={19}
                  angle={80}
                  rotation={320}
                  fill="#ff9800"
                />
                <Arc
                  x={40}
                  y={20}
                  innerRadius={22}
                  outerRadius={23}
                  angle={80}
                  rotation={320}
                  fill="#ff9800"
                />
              </>
            )}
            <Line
              points={[54, 20, 80, 20]}
              stroke={sc}
              strokeWidth={2}
              lineCap="round"
            />
          </>
        );

      /* ── Power Rails ──────────────────────────────────── */
      case "POWER_RAIL_L1":
        return (
          <>
            <Line
              points={[40, 0, 40, 40]}
              stroke={L1_COLOR}
              strokeWidth={5}
              lineCap="round"
            />
            <Line
              points={[40, 20, 80, 20]}
              stroke={isActive ? ACTIVE_COLOR : L1_COLOR}
              strokeWidth={2.5}
            />
            <Text
              x={8}
              y={13}
              text="L1"
              fontSize={13}
              fontStyle="bold"
              fill={L1_COLOR}
            />
          </>
        );

      case "POWER_RAIL_L2":
        return (
          <>
            <Line
              points={[40, 0, 40, 40]}
              stroke={L2_COLOR}
              strokeWidth={5}
              lineCap="round"
            />
            <Line
              points={[0, 20, 40, 20]}
              stroke={isActive ? ACTIVE_COLOR : L2_COLOR}
              strokeWidth={2.5}
            />
            <Text
              x={46}
              y={13}
              text="L2"
              fontSize={13}
              fontStyle="bold"
              fill={L2_COLOR}
            />
          </>
        );

      case "POWER_RAIL_L3":
        return (
          <>
            <Line
              points={[40, 0, 40, 40]}
              stroke={L3_COLOR}
              strokeWidth={5}
              lineCap="round"
            />
            <Line
              points={[40, 20, 80, 20]}
              stroke={isActive ? ACTIVE_COLOR : L3_COLOR}
              strokeWidth={2.5}
            />
            <Text
              x={8}
              y={13}
              text="L3"
              fontSize={13}
              fontStyle="bold"
              fill={L3_COLOR}
            />
          </>
        );

      case "POWER_RAIL_PE":
        return (
          <>
            <Line
              points={[40, 0, 40, 40]}
              stroke={PE_COLOR}
              strokeWidth={5}
              lineCap="round"
            />
            <Line
              points={[0, 20, 40, 20]}
              stroke={isActive ? ACTIVE_COLOR : PE_COLOR}
              strokeWidth={2.5}
            />
            {/* Standard IEC Earth bars */}
            <Line points={[40, 20, 54, 20]} stroke={PE_COLOR} strokeWidth={2} />
            <Line
              points={[54, 11, 54, 29]}
              stroke={PE_COLOR}
              strokeWidth={2.5}
            />
            <Line points={[59, 14, 59, 26]} stroke={PE_COLOR} strokeWidth={2} />
            <Line points={[64, 17, 64, 23]} stroke={PE_COLOR} strokeWidth={2} />
            <Text
              x={12}
              y={5}
              text="PE"
              fontSize={10}
              fontStyle="bold"
              fill={PE_COLOR}
            />
          </>
        );

      case "POWER_AC_N":
        return (
          <>
            <Line
              points={[40, 0, 40, 40]}
              stroke={L2_COLOR}
              strokeWidth={5}
              lineCap="round"
            />
            <Line
              points={[0, 20, 40, 20]}
              stroke={isActive ? ACTIVE_COLOR : L2_COLOR}
              strokeWidth={2.5}
            />
            <Text
              x={48}
              y={13}
              text="N"
              fontSize={13}
              fontStyle="bold"
              fill={L2_COLOR}
            />
          </>
        );

      case "POWER_DC_POS":
        return (
          <>
            <Line
              points={[40, 0, 40, 40]}
              stroke="#e91e63"
              strokeWidth={5}
              lineCap="round"
            />
            <Line
              points={[40, 20, 80, 20]}
              stroke={isActive ? ACTIVE_COLOR : "#e91e63"}
              strokeWidth={2.5}
            />
            <Text
              x={4}
              y={13}
              text="+DC"
              fontSize={11}
              fontStyle="bold"
              fill="#e91e63"
            />
          </>
        );

      case "POWER_DC_NEG":
        return (
          <>
            <Line
              points={[40, 0, 40, 40]}
              stroke="#37474f"
              strokeWidth={5}
              lineCap="round"
            />
            <Line
              points={[0, 20, 40, 20]}
              stroke={isActive ? ACTIVE_COLOR : "#37474f"}
              strokeWidth={2.5}
            />
            <Text
              x={48}
              y={13}
              text="-DC"
              fontSize={11}
              fontStyle="bold"
              fill={isDark ? "#90a4ae" : "#37474f"}
            />
          </>
        );

      case "POWER_DC_PE":
        return (
          <>
            <Line
              points={[0, 20, 46, 20]}
              stroke={isActive ? ACTIVE_COLOR : "#546e7a"}
              strokeWidth={2.5}
            />
            {/* Standard Chassis / DC Earth symbol */}
            <Line
              points={[46, 10, 46, 30]}
              stroke="#546e7a"
              strokeWidth={2.5}
            />
            <Line points={[52, 14, 52, 26]} stroke="#546e7a" strokeWidth={2} />
            <Line points={[58, 17, 58, 23]} stroke="#546e7a" strokeWidth={2} />
            <Text
              x={10}
              y={4}
              text="GND"
              fontSize={9}
              fontStyle="bold"
              fill="#546e7a"
            />
          </>
        );

      case "POWER_AC_1P_N":
        return (
          <>
            <Rect
              x={4}
              y={-12}
              width={56}
              height={64}
              stroke={L1_COLOR}
              strokeWidth={2}
              fill={isDark ? "#231f28" : "#fff5f5"}
              cornerRadius={4}
            />
            <Text
              x={6}
              y={9}
              width={32}
              text="AC"
              align="center"
              fontSize={11}
              fontStyle="bold"
              fill={L1_COLOR}
            />
            <Text
              x={6}
              y={23}
              width={32}
              text="1~+N"
              align="center"
              fontSize={9}
              fontStyle="bold"
              fill={sc}
            />
            {/* L1 terminal at (80, 0) */}
            <Line points={[60, 0, 80, 0]} stroke={L1_COLOR} strokeWidth={2.5} />
            <Text
              x={38}
              y={-5}
              width={18}
              align="right"
              text="L1"
              fontSize={9}
              fontStyle="bold"
              fill={L1_COLOR}
            />
            {/* N terminal at (80, 40) */}
            <Line
              points={[60, 40, 80, 40]}
              stroke={L2_COLOR}
              strokeWidth={2.5}
            />
            <Text
              x={38}
              y={35}
              width={18}
              align="right"
              text="N"
              fontSize={9}
              fontStyle="bold"
              fill={L2_COLOR}
            />
          </>
        );

      case "POWER_AC_3P":
        return (
          <>
            <Rect
              x={4}
              y={-12}
              width={56}
              height={64}
              stroke={L3_COLOR}
              strokeWidth={2}
              fill={isDark ? "#221f2c" : "#faf5ff"}
              cornerRadius={4}
            />
            <Text
              x={6}
              y={9}
              width={32}
              text="AC"
              align="center"
              fontSize={11}
              fontStyle="bold"
              fill={L3_COLOR}
            />
            <Text
              x={6}
              y={23}
              width={32}
              text="3~"
              align="center"
              fontSize={11}
              fontStyle="bold"
              fill={sc}
            />
            <Line points={[60, 0, 80, 0]} stroke={L1_COLOR} strokeWidth={2.5} />
            <Text
              x={38}
              y={-5}
              width={18}
              align="right"
              text="L1"
              fontSize={9}
              fontStyle="bold"
              fill={L1_COLOR}
            />
            <Line
              points={[60, 20, 80, 20]}
              stroke="#ef6c00"
              strokeWidth={2.5}
            />
            <Text
              x={38}
              y={15}
              width={18}
              align="right"
              text="L2"
              fontSize={9}
              fontStyle="bold"
              fill="#ef6c00"
            />
            <Line
              points={[60, 40, 80, 40]}
              stroke={L3_COLOR}
              strokeWidth={2.5}
            />
            <Text
              x={38}
              y={35}
              width={18}
              align="right"
              text="L3"
              fontSize={9}
              fontStyle="bold"
              fill={L3_COLOR}
            />
          </>
        );

      case "POWER_AC_3P_N":
        return (
          <>
            <Rect
              x={4}
              y={-30}
              width={56}
              height={82}
              stroke={L3_COLOR}
              strokeWidth={2}
              fill={isDark ? "#221f2c" : "#faf5ff"}
              cornerRadius={4}
            />
            <Text
              x={6}
              y={-2}
              width={32}
              text="AC 3~"
              align="center"
              fontSize={10}
              fontStyle="bold"
              fill={L3_COLOR}
            />
            <Text
              x={6}
              y={12}
              width={32}
              text="+ N"
              align="center"
              fontSize={10}
              fontStyle="bold"
              fill={L2_COLOR}
            />
            <Line
              points={[60, -20, 80, -20]}
              stroke={L1_COLOR}
              strokeWidth={2.5}
            />
            <Text
              x={38}
              y={-25}
              width={18}
              align="right"
              text="L1"
              fontSize={9}
              fontStyle="bold"
              fill={L1_COLOR}
            />
            <Line points={[60, 0, 80, 0]} stroke="#ef6c00" strokeWidth={2.5} />
            <Text
              x={38}
              y={-5}
              width={18}
              align="right"
              text="L2"
              fontSize={9}
              fontStyle="bold"
              fill="#ef6c00"
            />
            <Line
              points={[60, 20, 80, 20]}
              stroke={L3_COLOR}
              strokeWidth={2.5}
            />
            <Text
              x={38}
              y={15}
              width={18}
              align="right"
              text="L3"
              fontSize={9}
              fontStyle="bold"
              fill={L3_COLOR}
            />
            <Line
              points={[60, 40, 80, 40]}
              stroke={L2_COLOR}
              strokeWidth={2.5}
            />
            <Text
              x={38}
              y={35}
              width={18}
              align="right"
              text="N"
              fontSize={9}
              fontStyle="bold"
              fill={L2_COLOR}
            />
          </>
        );

      case "POWER_AC_3P_N_PE":
        return (
          <>
            <Rect
              x={4}
              y={-30}
              width={56}
              height={102}
              stroke={L3_COLOR}
              strokeWidth={2}
              fill={isDark ? "#221f2c" : "#faf5ff"}
              cornerRadius={4}
            />
            <Text
              x={6}
              y={6}
              width={32}
              text="AC 3~"
              align="center"
              fontSize={10}
              fontStyle="bold"
              fill={L3_COLOR}
            />
            <Text
              x={6}
              y={20}
              width={32}
              text="N+PE"
              align="center"
              fontSize={9}
              fontStyle="bold"
              fill={PE_COLOR}
            />
            <Line
              points={[60, -20, 80, -20]}
              stroke={L1_COLOR}
              strokeWidth={2.5}
            />
            <Text
              x={38}
              y={-25}
              width={18}
              align="right"
              text="L1"
              fontSize={9}
              fontStyle="bold"
              fill={L1_COLOR}
            />
            <Line points={[60, 0, 80, 0]} stroke="#ef6c00" strokeWidth={2.5} />
            <Text
              x={38}
              y={-5}
              width={18}
              align="right"
              text="L2"
              fontSize={9}
              fontStyle="bold"
              fill="#ef6c00"
            />
            <Line
              points={[60, 20, 80, 20]}
              stroke={L3_COLOR}
              strokeWidth={2.5}
            />
            <Text
              x={38}
              y={15}
              width={18}
              align="right"
              text="L3"
              fontSize={9}
              fontStyle="bold"
              fill={L3_COLOR}
            />
            <Line
              points={[60, 40, 80, 40]}
              stroke={L2_COLOR}
              strokeWidth={2.5}
            />
            <Text
              x={38}
              y={35}
              width={18}
              align="right"
              text="N"
              fontSize={9}
              fontStyle="bold"
              fill={L2_COLOR}
            />
            <Line
              points={[60, 60, 80, 60]}
              stroke={PE_COLOR}
              strokeWidth={2.5}
            />
            <Text
              x={38}
              y={55}
              width={18}
              align="right"
              text="PE"
              fontSize={9}
              fontStyle="bold"
              fill={PE_COLOR}
            />
          </>
        );

      case "DC_BATTERY":
        return (
          <>
            <Rect
              x={8}
              y={-12}
              width={50}
              height={64}
              stroke="#e91e63"
              strokeWidth={1.5}
              dash={[3, 2]}
              fill={isDark ? "#261d24" : "#fff0f6"}
              cornerRadius={4}
            />
            {/* Standard IEC Battery cells */}
            <Line points={[21, 13, 45, 13]} stroke="#e91e63" strokeWidth={2} />
            <Line points={[27, 19, 39, 19]} stroke="#37474f" strokeWidth={4} />
            <Line points={[21, 25, 45, 25]} stroke="#e91e63" strokeWidth={2} />
            <Line points={[27, 31, 39, 31]} stroke="#37474f" strokeWidth={4} />
            {/* + Lead at (80, 0) */}
            <Line
              points={[33, 13, 33, 0, 80, 0]}
              stroke="#e91e63"
              strokeWidth={2.5}
            />
            <Text
              x={64}
              y={-13}
              text="+"
              fontSize={11}
              fontStyle="bold"
              fill="#e91e63"
            />
            {/* - Lead at (80, 40) */}
            <Line
              points={[33, 31, 33, 40, 80, 40]}
              stroke="#37474f"
              strokeWidth={2.5}
            />
            <Text
              x={65}
              y={26}
              text="-"
              fontSize={12}
              fontStyle="bold"
              fill={isDark ? "#90a4ae" : "#37474f"}
            />
          </>
        );

      case "INVERTER_1P":
        return (
          <>
            {/* DC Input leads on left */}
            <Line points={[0, 0, 16, 0]} stroke="#e91e63" strokeWidth={2.5} />
            <Text
              x={3}
              y={-13}
              text="+"
              fontSize={11}
              fontStyle="bold"
              fill="#e91e63"
            />
            <Line points={[0, 40, 16, 40]} stroke="#37474f" strokeWidth={2.5} />
            <Text
              x={4}
              y={26}
              text="-"
              fontSize={12}
              fontStyle="bold"
              fill={isDark ? "#90a4ae" : "#37474f"}
            />
            {/* Converter Box */}
            <Rect
              x={16}
              y={-12}
              width={48}
              height={64}
              stroke={sc}
              strokeWidth={2}
              fill={isActive ? "#00e6761c" : isDark ? "#202634" : "#f0f7ff"}
              cornerRadius={4}
            />
            <Line points={[18, 50, 62, -10]} stroke={sc} strokeWidth={1.5} />
            <Text
              x={22}
              y={-3}
              text="="
              fontSize={13}
              fontStyle="bold"
              fill="#e91e63"
            />
            <Text
              x={42}
              y={31}
              text="1~"
              fontSize={11}
              fontStyle="bold"
              fill={sc}
            />
            {/* AC Output leads on right */}
            <Line
              points={[64, 0, 80, 0]}
              stroke={isActive ? ACTIVE_COLOR : L1_COLOR}
              strokeWidth={2.5}
            />
            <Text
              x={66}
              y={-13}
              text="L1"
              fontSize={9}
              fontStyle="bold"
              fill={L1_COLOR}
            />
            <Line
              points={[64, 40, 80, 40]}
              stroke={L2_COLOR}
              strokeWidth={2.5}
            />
            <Text
              x={68}
              y={27}
              text="N"
              fontSize={9}
              fontStyle="bold"
              fill={L2_COLOR}
            />
          </>
        );

      case "INVERTER_3P":
        return (
          <>
            {/* DC Input leads on left */}
            <Line points={[0, 0, 16, 0]} stroke="#e91e63" strokeWidth={2.5} />
            <Text
              x={3}
              y={-13}
              text="+"
              fontSize={11}
              fontStyle="bold"
              fill="#e91e63"
            />
            <Line points={[0, 40, 16, 40]} stroke="#37474f" strokeWidth={2.5} />
            <Text
              x={4}
              y={26}
              text="-"
              fontSize={12}
              fontStyle="bold"
              fill={isDark ? "#90a4ae" : "#37474f"}
            />
            {/* Converter Box */}
            <Rect
              x={16}
              y={-12}
              width={48}
              height={64}
              stroke={sc}
              strokeWidth={2}
              fill={isActive ? "#00e6761c" : isDark ? "#202634" : "#f0f7ff"}
              cornerRadius={4}
            />
            <Line points={[18, 50, 62, -10]} stroke={sc} strokeWidth={1.5} />
            <Text
              x={22}
              y={-3}
              text="="
              fontSize={13}
              fontStyle="bold"
              fill="#e91e63"
            />
            <Text
              x={41}
              y={31}
              text="3~"
              fontSize={11}
              fontStyle="bold"
              fill={sc}
            />
            {/* 3-Phase AC Output leads on right */}
            <Line
              points={[64, 0, 80, 0]}
              stroke={isActive ? ACTIVE_COLOR : L1_COLOR}
              strokeWidth={2.5}
            />
            <Text
              x={66}
              y={-12}
              text="L1"
              fontSize={8}
              fontStyle="bold"
              fill={L1_COLOR}
            />
            <Line
              points={[64, 20, 80, 20]}
              stroke={isActive ? ACTIVE_COLOR : "#ef6c00"}
              strokeWidth={2.5}
            />
            <Text
              x={66}
              y={8}
              text="L2"
              fontSize={8}
              fontStyle="bold"
              fill="#ef6c00"
            />
            <Line
              points={[64, 40, 80, 40]}
              stroke={isActive ? ACTIVE_COLOR : L3_COLOR}
              strokeWidth={2.5}
            />
            <Text
              x={66}
              y={28}
              text="L3"
              fontSize={8}
              fontStyle="bold"
              fill={L3_COLOR}
            />
          </>
        );

      case "GENERATOR_3P": {
        const angle = isActive ? (simTick * 30) % 360 : 0;
        return (
          <>
            {/* Auto-start control terminals C1, C2 on left */}
            <Line points={[0, 0, 22, 0]} stroke={sc} strokeWidth={2} />
            <Text
              x={1}
              y={-12}
              text="C1"
              fontSize={9}
              fontStyle="bold"
              fill={sc}
            />
            <Line points={[0, 40, 22, 40]} stroke={sc} strokeWidth={2} />
            <Text
              x={1}
              y={28}
              text="C2"
              fontSize={9}
              fontStyle="bold"
              fill={sc}
            />

            {/* 3-Phase + N Outputs on right (connected cleanly to generator bus) */}
            <Line
              points={[52, -20, 80, -20]}
              stroke={isActive ? ACTIVE_COLOR : L1_COLOR}
              strokeWidth={2.5}
            />
            <Line
              points={[52, -20, 52, 0]}
              stroke={isActive ? ACTIVE_COLOR : L1_COLOR}
              strokeWidth={2}
            />
            <Text
              x={65}
              y={-32}
              text="L1"
              fontSize={8}
              fontStyle="bold"
              fill={L1_COLOR}
            />

            <Line
              points={[56, 0, 80, 0]}
              stroke={isActive ? ACTIVE_COLOR : "#ef6c00"}
              strokeWidth={2.5}
            />
            <Text
              x={65}
              y={-12}
              text="L2"
              fontSize={8}
              fontStyle="bold"
              fill="#ef6c00"
            />

            <Line
              points={[56, 20, 80, 20]}
              stroke={isActive ? ACTIVE_COLOR : L3_COLOR}
              strokeWidth={2.5}
            />
            <Text
              x={65}
              y={8}
              text="L3"
              fontSize={8}
              fontStyle="bold"
              fill={L3_COLOR}
            />

            <Line
              points={[52, 40, 80, 40]}
              stroke={L2_COLOR}
              strokeWidth={2.5}
            />
            <Text
              x={67}
              y={28}
              text="N"
              fontSize={8}
              fontStyle="bold"
              fill={L2_COLOR}
            />

            {/* Generator Circle */}
            <Circle
              x={38}
              y={16}
              radius={20}
              stroke={sc}
              strokeWidth={2.5}
              fill={isActive ? "#1b3a2b" : isDark ? "#232838" : "#fffdf0"}
            />
            <Text
              x={20}
              y={6}
              width={36}
              text="G"
              align="center"
              fontSize={12}
              fontStyle="bold"
              fill={sc}
            />
            <Text
              x={20}
              y={20}
              width={36}
              text="3~"
              align="center"
              fontSize={9}
              fontStyle="bold"
              fill={sc}
            />

            {isActive && (
              <Group x={38} y={16} rotation={angle}>
                <Circle x={15} y={0} radius={2} fill={ACTIVE_COLOR} />
                <Circle x={-15} y={0} radius={2} fill={ACTIVE_COLOR} />
              </Group>
            )}
          </>
        );
      }

      case "PHASE_FAILURE":
        return (
          <>
            <Line points={[20, -20, 20, 0]} stroke={sc} strokeWidth={2} />
            <Line points={[40, -20, 40, 0]} stroke={sc} strokeWidth={2} />
            <Line points={[60, -20, 60, 0]} stroke={sc} strokeWidth={2} />
            <Rect
              x={12}
              y={0}
              width={56}
              height={32}
              stroke={sc}
              strokeWidth={2}
              fill={isActive ? "#00e67620" : isDark ? "#232838" : "#f8fafc"}
              cornerRadius={2}
            />
            {/* Phase triangle */}
            <Line
              points={[40, 6, 30, 24, 50, 24, 40, 6]}
              stroke={sc}
              strokeWidth={2}
              closed
            />
          </>
        );

      case "FUSE_1P":
      case "FUSE_2P":
      case "FUSE_3P":
      case "FUSE_4P": {
        const xs = (getProtectionPoleXs(comp.type) ?? [0]).map((px) => 40 + px);
        const blown = isToggled ?? false;
        const c = blown ? "#d32f2f" : sc;
        return (
          <>
            {xs.map((x, i) => (
              <Group key={i}>
                <Line points={[x, -20, x, 6]} stroke={c} strokeWidth={2} />
                <Rect
                  x={x - 6}
                  y={6}
                  width={12}
                  height={28}
                  stroke={c}
                  strokeWidth={2}
                  fill={isDark ? "#1c2128" : "#ffffff"}
                />
                {blown && (
                  <Line
                    points={[x - 5, 15, x + 5, 25]}
                    stroke="#d32f2f"
                    strokeWidth={1.8}
                  />
                )}
                <Line points={[x, 34, x, 60]} stroke={c} strokeWidth={2} />
              </Group>
            ))}
          </>
        );
      }

      case "OVERLOAD_1P":
      case "OVERLOAD_2P":
      case "OVERLOAD_3P": {
        const xs = (getProtectionPoleXs(comp.type) ?? [0]).map((px) => 40 + px);
        const tripped = isToggled ?? false;
        const c = tripped ? "#d32f2f" : sc;
        return (
          <>
            {xs.map((x, i) => (
              <Group key={i}>
                <Line points={[x, -20, x, 60]} stroke={c} strokeWidth={2} />
                <Line
                  points={[
                    x - 6,
                    10,
                    x + 7,
                    10,
                    x + 7,
                    17,
                    x - 3,
                    17,
                    x - 3,
                    24,
                    x + 7,
                    24,
                    x + 7,
                    30,
                    x - 6,
                    30,
                  ]}
                  stroke={c}
                  strokeWidth={1.8}
                />
              </Group>
            ))}
            {xs.length > 1 && (
              <Line
                points={[xs[0] - 6, 20, xs[xs.length - 1] + 7, 20]}
                stroke={c}
                strokeWidth={1.5}
                dash={[3, 3]}
              />
            )}
          </>
        );
      }

      case "FUSE_DISC_1P":
      case "FUSE_DISC_1PN":
      case "FUSE_DISC_2P":
      case "FUSE_DISC_3P":
      case "FUSE_DISC_3PN":
      case "FUSE_DISC_4P": {
        const xs = (getProtectionPoleXs(comp.type) ?? [0]).map((px) => 40 + px);
        const closed = isToggled ?? false;
        const hasNeutralLast =
          comp.type === "FUSE_DISC_1PN" || comp.type === "FUSE_DISC_3PN";
        return (
          <>
            {xs.map((x, i) => {
              const isN = hasNeutralLast && i === xs.length - 1;
              const topX = closed ? x : x - 11;
              return (
                <Group key={i}>
                  <Line points={[x, -20, x, 4]} stroke={sc} strokeWidth={2} />
                  <Line
                    points={[x - 5, 4, x + 5, 4]}
                    stroke={sc}
                    strokeWidth={2}
                  />
                  <Line points={[topX, 4, x, 38]} stroke={sc} strokeWidth={2} />
                  {!isN && (
                    <Rect
                      x={(topX + x) / 2 - 4}
                      y={12}
                      width={8}
                      height={18}
                      stroke={sc}
                      strokeWidth={1.8}
                      fill={isDark ? "#1c2128" : "#ffffff"}
                      rotation={closed ? 0 : -18}
                    />
                  )}
                  <Line points={[x, 38, x, 60]} stroke={sc} strokeWidth={2} />
                </Group>
              );
            })}
            {xs.length > 1 && (
              <Line
                points={[xs[0] - 4, 21, xs[xs.length - 1] - 2, 21]}
                stroke={sc}
                strokeWidth={1.5}
                dash={[3, 3]}
              />
            )}
          </>
        );
      }

      case "ISOLATOR_1P":
      case "ISOLATOR_2P":
      case "ISOLATOR_3P":
      case "ISOLATOR_4P": {
        const xs = (getProtectionPoleXs(comp.type) ?? [0]).map((px) => 40 + px);
        const closed = isToggled ?? false;
        return (
          <>
            {xs.map((x, i) => (
              <Group key={i}>
                <Line points={[x, -20, x, 4]} stroke={sc} strokeWidth={2} />
                <Line
                  points={[x - 5, 4, x + 5, 4]}
                  stroke={sc}
                  strokeWidth={2}
                />
                <Line
                  points={[closed ? x : x - 11, 4, x, 38]}
                  stroke={sc}
                  strokeWidth={2.2}
                />
                <Line points={[x, 38, x, 60]} stroke={sc} strokeWidth={2} />
              </Group>
            ))}
            <Line
              points={[
                xs[0] - 12,
                16,
                xs[0] - 8,
                16,
                xs[0] - 8,
                26,
                xs[0] - 4,
                26,
              ]}
              stroke={sc}
              strokeWidth={1.6}
            />
            <Line
              points={[xs[0] - 6, 21, xs[xs.length - 1] - 2, 21]}
              stroke={sc}
              strokeWidth={1.5}
              dash={[3, 3]}
            />
          </>
        );
      }

      case "MCB_1P":
      case "MCB_2P":
      case "MCB_3P":
      case "MCB_4P": {
        const xs = (getProtectionPoleXs(comp.type) ?? [0]).map((px) => 40 + px);
        const closed = isToggled ?? false;
        return (
          <>
            {xs.map((x, i) => (
              <Group key={i}>
                <Line points={[x, -20, x, 4]} stroke={sc} strokeWidth={2} />
                {/* Trip X cross */}
                <Line
                  points={[x - 4, 0, x + 4, 8]}
                  stroke={sc}
                  strokeWidth={1.8}
                />
                <Line
                  points={[x + 4, 0, x - 4, 8]}
                  stroke={sc}
                  strokeWidth={1.8}
                />
                <Line
                  points={[closed ? x : x - 11, 4, x, 38]}
                  stroke={sc}
                  strokeWidth={2.2}
                />
                <Line points={[x, 38, x, 60]} stroke={sc} strokeWidth={2} />
              </Group>
            ))}
            {xs.length > 1 && (
              <Line
                points={[xs[0] - 4, 21, xs[xs.length - 1] - 2, 21]}
                stroke={sc}
                strokeWidth={1.5}
                dash={[3, 3]}
              />
            )}
          </>
        );
      }

      case "MCCB_1P":
      case "MCCB_2P":
      case "MCCB_3P":
      case "MCCB_4P": {
        const xs = (getProtectionPoleXs(comp.type) ?? [0]).map((px) => 40 + px);
        const closed = isToggled ?? false;
        return (
          <>
            {xs.map((x, i) => (
              <Group key={i}>
                <Line points={[x, -20, x, 4]} stroke={sc} strokeWidth={2} />
                <Line
                  points={[x - 4, 0, x + 4, 8]}
                  stroke={sc}
                  strokeWidth={1.8}
                />
                <Line
                  points={[x + 4, 0, x - 4, 8]}
                  stroke={sc}
                  strokeWidth={1.8}
                />
                <Line
                  points={[closed ? x : x - 11, 4, x, 38]}
                  stroke={sc}
                  strokeWidth={2.2}
                />
                {/* Thermal + Magnetic */}
                <Line
                  points={[x - 7, 13, x - 10, 13, x - 10, 18, x - 5, 18]}
                  stroke={sc}
                  strokeWidth={1.4}
                />
                <Line
                  points={[x - 8, 23, x - 3, 26, x - 8, 29]}
                  stroke={sc}
                  strokeWidth={1.5}
                />
                <Line points={[x, 38, x, 60]} stroke={sc} strokeWidth={2} />
              </Group>
            ))}
            {xs.length > 1 && (
              <Line
                points={[xs[0] - 4, 21, xs[xs.length - 1] - 2, 21]}
                stroke={sc}
                strokeWidth={1.5}
                dash={[3, 3]}
              />
            )}
          </>
        );
      }

      case "MAG_CB_1P":
      case "MAG_CB_2P":
      case "MAG_CB_3P":
      case "MAG_CB_4P": {
        const xs = (getProtectionPoleXs(comp.type) ?? [0]).map((px) => 40 + px);
        const closed = isToggled ?? false;
        return (
          <>
            {xs.map((x, i) => (
              <Group key={i}>
                <Line points={[x, -20, x, 4]} stroke={sc} strokeWidth={2} />
                <Line
                  points={[x - 4, 0, x + 4, 8]}
                  stroke={sc}
                  strokeWidth={1.8}
                />
                <Line
                  points={[x + 4, 0, x - 4, 8]}
                  stroke={sc}
                  strokeWidth={1.8}
                />
                <Line
                  points={[closed ? x : x - 11, 4, x, 38]}
                  stroke={sc}
                  strokeWidth={2.2}
                />
                {/* Magnetic > only */}
                <Line
                  points={[x - 8, 19, x - 3, 22, x - 8, 25]}
                  stroke={sc}
                  strokeWidth={1.6}
                />
                <Line points={[x, 38, x, 60]} stroke={sc} strokeWidth={2} />
              </Group>
            ))}
            {xs.length > 1 && (
              <Line
                points={[xs[0] - 4, 21, xs[xs.length - 1] - 2, 21]}
                stroke={sc}
                strokeWidth={1.5}
                dash={[3, 3]}
              />
            )}
          </>
        );
      }

      case "CONTACTOR_1P":
      case "CONTACTOR_2P":
      case "CONTACTOR_3P":
      case "CONTACTOR_4P": {
        const xs = (getProtectionPoleXs(comp.type) ?? [0]).map((px) => 40 + px);
        const closed = isActive;
        return (
          <>
            {xs.map((x, i) => (
              <Group key={i}>
                <Line points={[x, -20, x, 6]} stroke={sc} strokeWidth={2} />
                <Line
                  points={[closed ? x : x - 11, 6, x, 36]}
                  stroke={sc}
                  strokeWidth={2.2}
                />
                <Line points={[x, 36, x, 60]} stroke={sc} strokeWidth={2} />
              </Group>
            ))}
            {xs.length > 1 && (
              <Line
                points={[xs[0] - 4, 21, xs[xs.length - 1] - 2, 21]}
                stroke={sc}
                strokeWidth={1.5}
                dash={[3, 3]}
              />
            )}
          </>
        );
      }

      case "SWITCH_2P":
      case "SWITCH_3P": {
        const xs = (getProtectionPoleXs(comp.type) ?? [-20, 20]).map(
          (px) => 40 + px,
        );
        const closed = isToggled ?? false;
        return (
          <>
            {xs.map((x, i) => (
              <Group key={i}>
                <Line points={[x, -20, x, 6]} stroke={sc} strokeWidth={2} />
                <Circle x={x} y={6} radius={2.5} fill={sc} />
                <Line
                  points={[closed ? x : x - 11, 6, x, 36]}
                  stroke={sc}
                  strokeWidth={2.2}
                />
                <Line points={[x, 36, x, 60]} stroke={sc} strokeWidth={2} />
              </Group>
            ))}
            <Line
              points={[xs[0] - 4, 21, xs[xs.length - 1] - 2, 21]}
              stroke={sc}
              strokeWidth={1.5}
              dash={[3, 3]}
            />
          </>
        );
      }

      case "MOTOR_3P_V":
      case "MOTOR_3P_6T": {
        const angle = isActive ? (simTick * 35) % 360 : 0;
        const is6T = comp.type === "MOTOR_3P_6T";
        return (
          <>
            {/* Top terminals U1, V1, W1 */}
            <Line points={[20, -20, 20, 4]} stroke={sc} strokeWidth={2} />
            <Line points={[40, -20, 40, -2]} stroke={sc} strokeWidth={2} />
            <Line points={[60, -20, 60, 4]} stroke={sc} strokeWidth={2} />
            <Text
              x={10}
              y={-18}
              text="U1"
              fontSize={7}
              fontStyle="bold"
              fill={sc}
            />
            <Text
              x={30}
              y={-18}
              text="V1"
              fontSize={7}
              fontStyle="bold"
              fill={sc}
            />
            <Text
              x={50}
              y={-18}
              text="W1"
              fontSize={7}
              fontStyle="bold"
              fill={sc}
            />

            {/* Motor Housing */}
            <Circle
              x={40}
              y={20}
              radius={22}
              stroke={sc}
              strokeWidth={2.5}
              fill={isActive ? "#2196f330" : isDark ? "#20283c" : "#f0f5ff"}
            />
            <Text
              x={22}
              y={10}
              width={36}
              text="M"
              align="center"
              fontSize={13}
              fontStyle="bold"
              fill={sc}
            />
            <Text
              x={22}
              y={24}
              width={36}
              text="3~"
              align="center"
              fontSize={9}
              fontStyle="bold"
              fill={sc}
            />

            {isActive && (
              <Group x={40} y={20} rotation={angle}>
                <Line
                  points={[0, 0, 0, -14]}
                  stroke={ACTIVE_COLOR}
                  strokeWidth={2}
                />
                <Line
                  points={[0, 0, 12, 7]}
                  stroke={ACTIVE_COLOR}
                  strokeWidth={2}
                />
                <Line
                  points={[0, 0, -12, 7]}
                  stroke={ACTIVE_COLOR}
                  strokeWidth={2}
                />
              </Group>
            )}

            {/* Bottom terminals W2, U2, V2 for 6-terminal Star-Delta motor */}
            {is6T && (
              <>
                <Line points={[20, 36, 20, 60]} stroke={sc} strokeWidth={2} />
                <Line points={[40, 42, 40, 60]} stroke={sc} strokeWidth={2} />
                <Line points={[60, 36, 60, 60]} stroke={sc} strokeWidth={2} />
                <Text
                  x={8}
                  y={48}
                  text="W2"
                  fontSize={7}
                  fontStyle="bold"
                  fill={sc}
                />
                <Text
                  x={29}
                  y={48}
                  text="U2"
                  fontSize={7}
                  fontStyle="bold"
                  fill={sc}
                />
                <Text
                  x={49}
                  y={48}
                  text="V2"
                  fontSize={7}
                  fontStyle="bold"
                  fill={sc}
                />
              </>
            )}
          </>
        );
      }

      case "HEATER_1P":
      case "HEATER_3P": {
        const xs = (getProtectionPoleXs(comp.type) ?? [0]).map((px) => 40 + px);
        return (
          <>
            {xs.map((x, i) => (
              <Group key={i}>
                <Line points={[x, -20, x, 4]} stroke={sc} strokeWidth={2} />
                <Rect
                  x={x - 6}
                  y={4}
                  width={12}
                  height={32}
                  stroke={sc}
                  strokeWidth={2}
                  fill={isActive ? "#ff572235" : isDark ? "#1c2128" : "#ffffff"}
                />
                {/* Heating element segments */}
                <Line
                  points={[x - 6, 14, x + 6, 14]}
                  stroke={sc}
                  strokeWidth={1.3}
                />
                <Line
                  points={[x - 6, 26, x + 6, 26]}
                  stroke={sc}
                  strokeWidth={1.3}
                />
                <Line points={[x, 36, x, 60]} stroke={sc} strokeWidth={2} />
              </Group>
            ))}
          </>
        );
      }

      case "RCD_2P":
      case "RCD_4P": {
        const xs = (getProtectionPoleXs(comp.type) ?? [-20, 20]).map(
          (px) => 40 + px,
        );
        const closed = isToggled ?? false;
        const leftX = xs[0] - 14;
        return (
          <>
            {/* Differential trip box */}
            <Rect
              x={leftX - 8}
              y={6}
              width={10}
              height={10}
              stroke={sc}
              strokeWidth={1.5}
              fill="transparent"
            />
            <Line
              points={[leftX - 3, 6, leftX - 3, 16]}
              stroke={sc}
              strokeWidth={1.2}
            />
            <Line
              points={[leftX - 8, 11, leftX + 2, 11]}
              stroke={sc}
              strokeWidth={1.2}
            />
            <Line
              points={[leftX + 2, 11, xs[xs.length - 1] - 4, 11]}
              stroke={sc}
              strokeWidth={1.3}
              dash={[3, 2]}
            />
            <Line
              points={[leftX - 3, 16, leftX - 3, 40, xs[0] - 5, 40]}
              stroke={sc}
              strokeWidth={1.3}
              dash={[3, 2]}
            />
            {/* Toroidal sensor */}
            <Rect
              x={xs[0] - 5}
              y={34}
              width={xs[xs.length - 1] - xs[0] + 10}
              height={12}
              cornerRadius={6}
              stroke={sc}
              strokeWidth={1.8}
              fill="transparent"
            />
            {xs.map((x, i) => (
              <Group key={i}>
                <Line points={[x, -20, x, 4]} stroke={sc} strokeWidth={2} />
                <Line
                  points={[closed ? x : x - 10, 4, x, 30]}
                  stroke={sc}
                  strokeWidth={2.2}
                />
                <Line points={[x, 30, x, 60]} stroke={sc} strokeWidth={2} />
              </Group>
            ))}
          </>
        );
      }

      case "RCBO_1PN":
      case "RCBO_2P":
      case "RCBO_3P":
      case "RCBO_4P": {
        const xs = (getProtectionPoleXs(comp.type) ?? [-20, 20]).map(
          (px) => 40 + px,
        );
        const closed = isToggled ?? false;
        const leftX = xs[0] - 14;
        return (
          <>
            {/* Differential trip box */}
            <Rect
              x={leftX - 8}
              y={5}
              width={10}
              height={10}
              stroke={sc}
              strokeWidth={1.5}
              fill="transparent"
            />
            <Line
              points={[leftX - 3, 5, leftX - 3, 15]}
              stroke={sc}
              strokeWidth={1.2}
            />
            <Line
              points={[leftX - 8, 10, leftX + 2, 10]}
              stroke={sc}
              strokeWidth={1.2}
            />
            <Line
              points={[leftX + 2, 10, xs[xs.length - 1] - 4, 10]}
              stroke={sc}
              strokeWidth={1.3}
              dash={[3, 2]}
            />
            <Line
              points={[leftX - 3, 15, leftX - 3, 38, xs[0] - 6, 38]}
              stroke={sc}
              strokeWidth={1.3}
              dash={[3, 2]}
            />

            {/* [I>] overload/magnetic box */}
            <Rect
              x={xs[0] - 6}
              y={31}
              width={xs[xs.length - 1] - xs[0] + 12}
              height={14}
              stroke={sc}
              strokeWidth={1.6}
              fill={isDark ? "#1c2128" : "#ffffff"}
            />
            <Text
              x={xs[0] - 6}
              y={33}
              width={xs[xs.length - 1] - xs[0] + 12}
              text="I>"
              align="center"
              fontSize={9}
              fontStyle="bold"
              fill={sc}
            />

            {xs.map((x, i) => (
              <Group key={i}>
                <Line points={[x, -20, x, 4]} stroke={sc} strokeWidth={2} />
                <Line
                  points={[closed ? x : x - 10, 4, x, 31]}
                  stroke={sc}
                  strokeWidth={2.2}
                />
                <Line points={[x, 45, x, 60]} stroke={sc} strokeWidth={2} />
              </Group>
            ))}
          </>
        );
      }

      default:
        return (
          <Rect
            x={10}
            y={10}
            width={60}
            height={20}
            stroke={sc}
            strokeWidth={2}
            fill="transparent"
          />
        );
    }
  };

  const bounds = getSymbolBounds(comp.type);
  const fx = comp.flipX ? -1 : 1;
  const fy = comp.flipY ? -1 : 1;

  return (
    <Group
      x={comp.x}
      y={comp.y}
      rotation={rot}
      scaleX={fx}
      scaleY={fy}
      offset={{ x: SYMBOL_W / 2, y: SYMBOL_H / 2 }}
      draggable={simState === "stopped"}
      onClick={handleClick}
      onDragMove={(e) => {
        const [x, y] = snapPoint(e.target.x(), e.target.y());
        e.target.position({ x, y });
      }}
      onDragEnd={(e) => {
        const [x, y] = snapPoint(e.target.x(), e.target.y());
        e.target.position({ x, y });
        onDragEnd(x, y);
      }}
      onMouseEnter={(e) => {
        const container = e.target.getStage()?.container();
        if (container)
          container.style.cursor =
            isInteractive && isSimRunning ? "pointer" : "grab";
      }}
      onMouseLeave={(e) => {
        const container = e.target.getStage()?.container();
        if (container) container.style.cursor = "default";
      }}
    >
      {/* Selection outline */}
      {isSelected && (
        <Rect
          x={bounds.left - 5}
          y={bounds.top - 5}
          width={bounds.right - bounds.left + 10}
          height={bounds.bottom - bounds.top + 10}
          stroke={SEL_COLOR}
          strokeWidth={1.5}
          dash={[5, 3]}
          fill={SEL_COLOR + "14"}
          cornerRadius={4}
          listening={false}
        />
      )}

      {/* Interactive hover highlight in simulation */}
      {isInteractive && isSimRunning && (
        <Rect
          x={bounds.left}
          y={bounds.top}
          width={bounds.right - bounds.left}
          height={bounds.bottom - bounds.top}
          stroke="#0078d480"
          strokeWidth={1}
          cornerRadius={2}
          listening={false}
        />
      )}

      {renderSymbolContent()}

      {/* Subtle terminal connection dots in edit mode */}
      {simState === "stopped" &&
        getComponentTerminals({ ...comp, x: 0, y: 0, rotation: 0 }).map(
          (t, idx) => (
            <Circle
              key={`pin-${idx}`}
              x={40 + t.x}
              y={20 + t.y}
              radius={2.2}
              fill={isDark ? "#58a6ff80" : "#0969da80"}
              listening={false}
            />
          ),
        )}

      {/* Component tag label (counter-rotated & counter-flipped so text remains horizontal & upright) */}
      <Group
        x={(bounds.left + bounds.right) / 2}
        y={comp.flipY ? bounds.top - 16 : bounds.bottom + 5}
        rotation={-rot}
        scaleX={fx}
        scaleY={fy}
      >
        <Text
          x={-SYMBOL_W / 2}
          y={0}
          width={SYMBOL_W}
          text={comp.name?.trim() ? comp.name : comp.label}
          fontSize={10}
          fontStyle="bold"
          fill={isDark ? "#b0bec5" : "#37474f"}
          align="center"
          fontFamily="'Segoe UI', system-ui, sans-serif"
          listening={false}
        />
      </Group>
    </Group>
  );
};
