import React, { useState, useEffect } from "react";
import {
  Input,
  Label,
  Button,
  Text,
  Badge,
  Divider,
  SpinButton,
} from "@fluentui/react-components";
import {
  Delete24Regular,
  Info24Regular,
  ArrowRotateClockwise24Regular,
  FlipHorizontal24Regular,
  FlipVertical24Regular,
  Flash24Regular,
} from "@fluentui/react-icons";
import { useCanvasStore, type RotationAngle } from "../../store/canvasStore";
import { getProtectionPoleXs } from "../../engine/graph";
import { getTagSuggestions } from "../../utils/componentTags";
import { useUIStore } from "../../store/uiStore";
import { useSimStore } from "../../store/simStore";
import {
  DEFAULT_WIRE_WIDTH,
  getWireLength,
  WIRE_COLOR_PRESETS,
  WIRE_THICKNESS_PRESETS,
} from "../../utils/wireGeometry";
import styles from "./PropertiesPanel.module.css";

const TYPE_NAMES: Record<string, string> = {
  // Power
  POWER_RAIL_L1: "AC Phase 1 (L1)",
  POWER_RAIL_L2: "AC Phase 2 / Return (L2)",
  POWER_RAIL_L3: "AC Phase 3 (L3)",
  POWER_AC_N: "AC Neutral (N)",
  POWER_RAIL_PE: "AC Protective Earth (PE)",
  POWER_DC_POS: "DC Positive (+)",
  POWER_DC_NEG: "DC Negative (-)",
  POWER_DC_PE: "DC Earthing (GND)",
  POWER_AC_1P_N: "AC 1-Phase + Neutral (L1, N)",
  POWER_AC_3P: "AC 3-Phase (L1, L2, L3)",
  POWER_AC_3P_N: "AC 3-Phase + Neutral (L1, L2, L3, N)",
  POWER_AC_3P_N_PE: "AC 3-Phase + Neutral + Earthing",
  DC_BATTERY: "DC Battery Source (+ / -)",
  INVERTER_1P: "Inverter DC to AC 1-Phase",
  INVERTER_3P: "Inverter DC to AC 3-Phase",
  GENERATOR_3P: "3-Phase Generator (C1-C2 Auto Mode)",
  // Protection
  CIRCUIT_BREAKER: "Circuit Breaker (MCB)",
  FUSE: "Electrical Fuse",
  PHASE_FAILURE: "Phase Failure / Sequence Relay",
  FUSE_1P: "Fuse 1-Pole",
  FUSE_2P: "Fuse 2-Pole",
  FUSE_3P: "Fuse 3-Pole",
  FUSE_4P: "Fuse 4-Pole (3P+N)",
  OVERLOAD_1P: "Thermal Overload Relay 1P",
  OVERLOAD_2P: "Thermal Overload Relay 2P",
  OVERLOAD_3P: "Thermal Overload Relay 3P",
  FUSE_DISC_1P: "Fuse Disconnector 1P",
  FUSE_DISC_1PN: "Fuse Disconnector 1P+N",
  FUSE_DISC_2P: "Fuse Disconnector 2P",
  FUSE_DISC_3P: "Fuse Disconnector 3P",
  FUSE_DISC_3PN: "Fuse Disconnector 3P+N",
  FUSE_DISC_4P: "Fuse Disconnector 4P",
  ISOLATOR_1P: "Isolator / Disconnector 1P",
  ISOLATOR_2P: "Isolator / Disconnector 2P",
  ISOLATOR_3P: "Isolator / Disconnector 3P",
  ISOLATOR_4P: "Isolator / Disconnector 4P",
  MCB_1P: "MCB 1-Pole",
  MCB_2P: "MCB 2-Pole",
  MCB_3P: "MCB 3-Pole",
  MCB_4P: "MCB 4-Pole",
  MCCB_1P: "MCCB (Thermal-Magnetic) 1P",
  MCCB_2P: "MCCB (Thermal-Magnetic) 2P",
  MCCB_3P: "MCCB (Thermal-Magnetic) 3P",
  MCCB_4P: "MCCB (Thermal-Magnetic) 4P",
  MAG_CB_1P: "Magnetic Circuit Breaker 1P",
  MAG_CB_2P: "Magnetic Circuit Breaker 2P",
  MAG_CB_3P: "Magnetic Circuit Breaker 3P",
  MAG_CB_4P: "Magnetic Circuit Breaker 4P",
  RCD_2P: "RCD / RCCB 2-Pole",
  RCD_4P: "RCD / RCCB 4-Pole",
  RCBO_1PN: "RCBO 1P+N",
  RCBO_2P: "RCBO 2-Pole",
  RCBO_3P: "RCBO 3-Pole",
  RCBO_4P: "RCBO 4-Pole",
  // Switches
  PUSHBUTTON_NO: "Normally Open Pushbutton",
  PUSHBUTTON_NC: "Normally Closed Pushbutton",
  EMERGENCY_STOP: "Emergency Stop (Latching NC)",
  SWITCH_TOGGLE: "Maintained Selector Switch 1P",
  SWITCH_2P: "Maintained Switch 2-Pole",
  SWITCH_3P: "Maintained Switch 3-Pole",
  THERMAL_OVERLOAD: "Thermal Overload Contact (95-96)",
  // Contacts
  NO_CONTACT: "Normally Open Relay Contact",
  NC_CONTACT: "Normally Closed Relay Contact",
  TIMER_NO_CONTACT: "Timed-Close NO Contact",
  TIMER_NC_CONTACT: "Timed-Open NC Contact",
  CONTACTOR_1P: "Power Contactor 1-Pole",
  CONTACTOR_2P: "Power Contactor 2-Pole",
  CONTACTOR_3P: "Power Contactor 3-Pole",
  CONTACTOR_4P: "Power Contactor 4-Pole",
  // Coils & Timers
  COIL: "Contactor / Relay Coil",
  COIL_SET: "Set (Latch) Coil",
  COIL_RESET: "Reset (Unlatch) Coil",
  TIMER_TON: "ON-Delay Timer (TON)",
  TIMER_TOF: "OFF-Delay Timer (TOF)",
  // Loads
  LAMP: "Pilot Indicator Lamp",
  MOTOR_1P: "1-Phase AC Motor",
  MOTOR_3P: "3-Phase AC Motor (2-Terminal)",
  MOTOR_3P_V: "3-Phase AC Motor (U1, V1, W1)",
  MOTOR_3P_6T: "3-Phase Star-Delta Motor (6-Terminal)",
  HEATER_1P: "1-Phase Resistive Heater",
  HEATER_3P: "3-Phase Resistive Heater",
  BUZZER: "Acoustic Siren / Buzzer",
};

const LAMP_COLORS = [
  { name: "Green", hex: "#00e676" },
  { name: "Red", hex: "#f44336" },
  { name: "Yellow", hex: "#ffb300" },
  { name: "Blue", hex: "#2196f3" },
  { name: "White", hex: "#ffffff" },
];

interface WireStyleEditorProps {
  color: string;
  width: number;
  onColorChange: (color: string) => void;
  onWidthChange: (width: number) => void;
}

const WireStyleEditor: React.FC<WireStyleEditorProps> = ({
  color,
  width,
  onColorChange,
  onWidthChange,
}) => (
  <>
    <div className={styles.fieldGroup}>
      <Label size="small" weight="semibold">
        Wire Color
      </Label>
      <div className={styles.wireColorOptions}>
        {WIRE_COLOR_PRESETS.map((preset) => (
          <button
            key={preset.name}
            type="button"
            className={`${styles.wireColorSwatch} ${preset.value ? "" : styles.wireColorDefault} ${color === preset.value ? styles.wireColorActive : ""}`}
            style={preset.value ? { backgroundColor: preset.value } : undefined}
            title={preset.name}
            aria-label={preset.name}
            aria-pressed={color === preset.value}
            onClick={() => onColorChange(preset.value)}
          >
            {!preset.value ? "Auto" : ""}
          </button>
        ))}
        <input
          className={styles.customWireColor}
          type="color"
          aria-label="Custom wire color"
          title="Custom color"
          value={color || "#24292f"}
          onChange={(event) => onColorChange(event.target.value)}
        />
      </div>
    </div>
    <div className={styles.fieldGroup}>
      <Label size="small" weight="semibold">
        Wire Thickness
      </Label>
      <div className={styles.wireWidthOptions}>
        {WIRE_THICKNESS_PRESETS.map((preset) => (
          <button
            key={preset.value}
            type="button"
            className={`${styles.wireWidthChip} ${width === preset.value ? styles.wireWidthActive : ""}`}
            title={preset.title}
            aria-pressed={width === preset.value}
            onClick={() => onWidthChange(preset.value)}
          >
            <span style={{ height: Math.max(2, preset.value) }} />
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  </>
);

export const PropertiesPanel: React.FC = () => {
  const {
    components,
    wires,
    selectedIds,
    pressedButtons,
    toggledSwitches,
    updateComponent,
    updateWire,
    removeSelected,
    rotateSelected,
    mirrorSelected,
    toggleButton,
    toggleSwitch,
  } = useCanvasStore();

  const {
    theme,
    defaultWireColor,
    defaultWireWidth,
    setDefaultWireColor,
    setDefaultWireWidth,
  } = useUIStore();
  const {
    simState,
    energizedCoils,
    energizedComponents,
    activeTimers,
    isShortCircuit,
    trippedComponentIds,
  } = useSimStore();

  const selId = selectedIds[0];
  const comp = components.find((c) => c.id === selId);
  const wire = wires.find((w) => w.id === selId);

  const [label, setLabel] = useState("");
  const [itemName, setItemName] = useState("");
  const [timerDelay, setTimerDelay] = useState(2000);

  useEffect(() => {
    if (comp) {
      setLabel(comp.label ?? "");
      setItemName(comp.name ?? "");
      setTimerDelay(comp.timerDelay ?? 2000);
    }
  }, [selId, comp?.label, comp?.name, comp?.timerDelay]);

  const isContact =
    comp?.type === "NO_CONTACT" ||
    comp?.type === "NC_CONTACT" ||
    comp?.type === "TIMER_NO_CONTACT" ||
    comp?.type === "TIMER_NC_CONTACT" ||
    Boolean(comp?.type.startsWith("CONTACTOR_"));

  const isTimer = comp?.type === "TIMER_TON" || comp?.type === "TIMER_TOF";
  const isLamp = comp?.type === "LAMP";
  const isPushbutton =
    comp?.type === "PUSHBUTTON_NO" || comp?.type === "PUSHBUTTON_NC";
  const isSwitch =
    comp?.type === "EMERGENCY_STOP" ||
    comp?.type === "SWITCH_TOGGLE" ||
    comp?.type === "CIRCUIT_BREAKER" ||
    comp?.type === "THERMAL_OVERLOAD" ||
    comp?.type === "GENERATOR_3P" ||
    Boolean(comp && getProtectionPoleXs(comp.type));

  const isAuxiliary = isContact || comp?.type === "THERMAL_OVERLOAD";
  const availableTags = comp ? getTagSuggestions(comp.type, components) : [];

  if (!comp && !wire) {
    return (
      <div className={`${styles.panel} ${theme === "dark" ? styles.dark : ""}`}>
        <div className={styles.header}>
          <Text size={200} weight="semibold">
            Inspector
          </Text>
        </div>
        <div className={styles.empty}>
          <Info24Regular style={{ opacity: 0.3, fontSize: 36 }} />
          <Text size={200} style={{ opacity: 0.6, textAlign: "center" }}>
            Select any component or wire to inspect and edit its parameters.
          </Text>

          <div className={styles.wireDefaults}>
            <Text size={200} weight="semibold">
              Default Wire Style
            </Text>
            <Text size={100} style={{ opacity: 0.65 }}>
              Used for new wires. In Wire mode, click to add bends, then
              right-click or press Enter to finish. Drag a wire to move it.
            </Text>
            <WireStyleEditor
              color={defaultWireColor}
              width={defaultWireWidth}
              onColorChange={setDefaultWireColor}
              onWidthChange={setDefaultWireWidth}
            />
          </div>

          {simState !== "stopped" && (
            <div className={styles.liveBox}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Flash24Regular style={{ color: "#00e676" }} />
                <Text size={200} weight="semibold" style={{ color: "#00e676" }}>
                  Live Circuit State
                </Text>
              </div>
              <div className={styles.coilList}>
                {energizedCoils.size === 0 ? (
                  <Text size={100} style={{ opacity: 0.5 }}>
                    No coils energized
                  </Text>
                ) : (
                  Array.from(energizedCoils).map((tag) => (
                    <Badge
                      key={tag}
                      appearance="filled"
                      color="success"
                      size="small"
                    >
                      {tag} (ON)
                    </Badge>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (wire) {
    const [x1, y1, x2, y2] = wire.points;
    const len = Math.round(getWireLength(wire.points));
    return (
      <div className={`${styles.panel} ${theme === "dark" ? styles.dark : ""}`}>
        <div className={styles.header}>
          <Text size={200} weight="semibold">
            Wire Segment
          </Text>
          <Badge appearance="outline" color="informative" size="small">
            WIRE
          </Badge>
        </div>
        <div className={styles.body}>
          <div className={styles.row}>
            <Text size={100} className={styles.label}>
              Start
            </Text>
            <Text size={100}>
              ({x1}, {y1})
            </Text>
          </div>
          <div className={styles.row}>
            <Text size={100} className={styles.label}>
              End
            </Text>
            <Text size={100}>
              ({x2}, {y2})
            </Text>
          </div>
          <div className={styles.row}>
            <Text size={100} className={styles.label}>
              Length
            </Text>
            <Text size={100}>{len} px</Text>
          </div>
          <Divider />
          <WireStyleEditor
            color={wire.color ?? ""}
            width={wire.strokeWidth ?? DEFAULT_WIRE_WIDTH}
            onColorChange={(color) =>
              updateWire(wire.id, { color: color || undefined })
            }
            onWidthChange={(strokeWidth) =>
              updateWire(wire.id, { strokeWidth })
            }
          />
          <Divider />
          <Button
            icon={<Delete24Regular />}
            appearance="subtle"
            style={{ color: "#d32f2f" }}
            onClick={removeSelected}
          >
            Delete Wire
          </Button>
        </div>
      </div>
    );
  }

  const isEnergized = comp ? energizedComponents.has(comp.id) : false;
  const isTripped = comp ? trippedComponentIds.has(comp.id) : false;

  return (
    <div className={`${styles.panel} ${theme === "dark" ? styles.dark : ""}`}>
      <div className={styles.header}>
        <Text size={200} weight="semibold">
          Component
        </Text>
        {isEnergized && simState !== "stopped" ? (
          <Badge appearance="filled" color="success" size="small">
            ENERGIZED
          </Badge>
        ) : (
          <Badge appearance="outline" color="brand" size="small">
            {comp!.rotation ?? 0}°
          </Badge>
        )}
      </div>

      <div className={styles.body}>
        {simState !== "stopped" && (
          <div className={styles.liveBox}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 6,
              }}
            >
              <Text size={100} weight="semibold">
                Simulation Status
              </Text>
              <Badge
                appearance="filled"
                color={
                  isTripped ? "danger" : isEnergized ? "success" : "informative"
                }
                size="small"
              >
                {isTripped
                  ? "TRIPPED"
                  : isEnergized
                    ? "ON / ENERGIZED"
                    : "OFF / DE-ENERGIZED"}
              </Badge>
            </div>
            {isShortCircuit && (
              <Text size={100} style={{ color: "#d32f2f" }}>
                Short-circuit fault detected
              </Text>
            )}
          </div>
        )}

        {/* Type Info */}
        <div className={styles.typeRow}>
          <Text size={300} weight="semibold">
            {comp!.name?.trim() || comp!.label || comp!.type}
          </Text>
          <Text size={100} style={{ opacity: 0.65 }}>
            {TYPE_NAMES[comp!.type] ?? comp!.type}
          </Text>
        </div>

        <Divider />

        {/* Item Name (Display Name on Canvas) */}
        <div className={styles.fieldGroup}>
          <Label size="small" weight="semibold">
            Item Name (Display)
          </Label>
          <Input
            size="small"
            placeholder={comp!.label || "Symbol display name..."}
            value={itemName}
            onChange={(_, d) => setItemName(d.value)}
            onBlur={() => updateComponent(comp!.id, { name: itemName })}
            onKeyDown={(e) => {
              if (e.key === "Enter")
                updateComponent(comp!.id, { name: itemName });
            }}
          />
        </div>

        {/* Tag Name (Connection / Simulation Link) */}
        <div className={styles.fieldGroup}>
          <Label size="small" weight="semibold">
            {comp!.type === "TIMER_NO_CONTACT" ||
            comp!.type === "TIMER_NC_CONTACT"
              ? "Tag Name (Link to Timer)"
              : comp!.type === "THERMAL_OVERLOAD"
                ? "Tag Name (Link to Overload Relay)"
                : isContact
                  ? "Tag Name (Link to Coil/Contactor)"
                  : "Tag Name (Connection)"}
          </Label>
          <Input
            size="small"
            value={label}
            onChange={(_, d) => setLabel(d.value)}
            onBlur={() => updateComponent(comp!.id, { label })}
            onKeyDown={(e) => {
              if (e.key === "Enter") updateComponent(comp!.id, { label });
            }}
          />

          {isAuxiliary && availableTags.length > 0 && (
            <div className={styles.hint}>
              <Text size={100} style={{ opacity: 0.7 }}>
                Suggested tags:
              </Text>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {availableTags.map((tag) => (
                  <button
                    key={tag}
                    className={styles.tagBtn}
                    onClick={() => {
                      setLabel(tag);
                      updateComponent(comp!.id, { label: tag });
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Rotation Controls */}
        <div className={styles.fieldGroup}>
          <Label size="small" weight="semibold">
            Orientation
          </Label>
          <div className={styles.rotRow}>
            {([0, 90, 180, 270] as RotationAngle[]).map((deg) => (
              <button
                key={deg}
                className={`${styles.rotChip} ${(comp!.rotation ?? 0) === deg ? styles.rotActive : ""}`}
                onClick={() => updateComponent(comp!.id, { rotation: deg })}
              >
                {deg}°
              </button>
            ))}
            <Button
              size="small"
              icon={<ArrowRotateClockwise24Regular />}
              onClick={rotateSelected}
              title="Rotate 90° (R)"
            />
          </div>
          <div className={styles.rotRow} style={{ marginTop: 4 }}>
            <button
              className={`${styles.rotChip} ${comp!.flipX ? styles.rotActive : ""}`}
              onClick={() => mirrorSelected("x")}
              title="Mirror Horizontally (H)"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
              }}
            >
              <FlipHorizontal24Regular style={{ fontSize: 14 }} /> Flip H
            </button>
            <button
              className={`${styles.rotChip} ${comp!.flipY ? styles.rotActive : ""}`}
              onClick={() => mirrorSelected("y")}
              title="Mirror Vertically (V)"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
              }}
            >
              <FlipVertical24Regular style={{ fontSize: 14 }} /> Flip V
            </button>
          </div>
        </div>

        {/* Timer Delay Input */}
        {isTimer && (
          <div className={styles.fieldGroup}>
            <Label size="small" weight="semibold">
              Timer Delay (ms)
            </Label>
            <SpinButton
              size="small"
              min={100}
              max={60000}
              step={500}
              value={timerDelay}
              onChange={(_, d) => {
                const val =
                  typeof d.value === "number"
                    ? d.value
                    : Number(d.displayValue ?? timerDelay);
                setTimerDelay(val);
                updateComponent(comp!.id, { timerDelay: val });
              }}
            />
            {simState !== "stopped" && activeTimers[comp!.label] && (
              <div className={styles.hint}>
                <Text size={100} weight="semibold" style={{ color: "#0078d4" }}>
                  Progress:{" "}
                  {(activeTimers[comp!.label].elapsed / 1000).toFixed(1)}s /{" "}
                  {(activeTimers[comp!.label].total / 1000).toFixed(1)}s
                  {activeTimers[comp!.label].done ? " (TIMED OUT)" : ""}
                </Text>
              </div>
            )}
          </div>
        )}

        {/* Lamp Color Selector */}
        {isLamp && (
          <div className={styles.fieldGroup}>
            <Label size="small" weight="semibold">
              Lamp Color
            </Label>
            <div className={styles.colorRow}>
              {LAMP_COLORS.map((c) => (
                <button
                  key={c.name}
                  className={`${styles.colorChip} ${(comp!.color ?? "#00e676") === c.hex ? styles.colorActive : ""}`}
                  style={{ backgroundColor: c.hex }}
                  onClick={() => updateComponent(comp!.id, { color: c.hex })}
                  title={c.name}
                />
              ))}
            </div>
          </div>
        )}

        {/* Interactive simulation controls */}
        {simState !== "stopped" && (isPushbutton || isSwitch) && (
          <div className={styles.simInteractive}>
            <Text size={100} weight="semibold">
              Simulate Actuator
            </Text>
            {isPushbutton && (
              <Button
                size="small"
                appearance={
                  pressedButtons.has(comp!.id) ? "primary" : "secondary"
                }
                onClick={() => toggleButton(comp!.id)}
              >
                {pressedButtons.has(comp!.id)
                  ? "Release Button"
                  : "Press Button"}
              </Button>
            )}
            {isSwitch && (
              <Button
                size="small"
                appearance={
                  toggledSwitches.has(comp!.id) ? "primary" : "secondary"
                }
                onClick={() => toggleSwitch(comp!.id)}
              >
                {toggledSwitches.has(comp!.id)
                  ? "Toggle / Reset (ON)"
                  : "Toggle / Trip (OFF)"}
              </Button>
            )}
          </div>
        )}

        <Divider />

        {/* Coordinates */}
        <div className={styles.row}>
          <Text size={100} className={styles.label}>
            Position
          </Text>
          <Text size={100}>
            ({comp!.x}, {comp!.y})
          </Text>
        </div>

        <Divider />

        <Button
          icon={<Delete24Regular />}
          appearance="subtle"
          style={{ color: "#d32f2f" }}
          onClick={removeSelected}
          disabled={simState !== "stopped"}
        >
          Delete Component
        </Button>
      </div>
    </div>
  );
};
