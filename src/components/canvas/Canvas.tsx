import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Stage, Layer, Line, Rect, Circle, Group } from 'react-konva';
import { useCanvasStore } from '../../store/canvasStore';
import { useUIStore } from '../../store/uiStore';
import { useSimStore } from '../../store/simStore';
import { snapPoint, GRID_SIZE } from '../../utils/snapGrid';
import { getComponentTerminals } from '../../engine/graph';
import { ElectricalSymbol } from '../symbols/ElectricalSymbol';
import type { ComponentType } from '../../store/canvasStore';
import styles from './Canvas.module.css';

const ACTIVE_COLOR = '#00e676';
const SEL_COLOR = '#0078d4';

// Expose stage ref globally for PNG export from Ribbon
export let globalStageRef: any = null;

export const SchematicCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<any>(null);
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
  const [offset, setOffset] = useState({ x: 80, y: 80 });
  const [drawingWire, setDrawingWire] = useState<[number, number] | null>(null);
  const [mouse, setMouse] = useState<[number, number]>([0, 0]);
  const [hoverTerminal, setHoverTerminal] = useState<[number, number] | null>(null);
  const [simTick, setSimTick] = useState(0);

  const {
    components,
    wires,
    selectedIds,
    pressedButtons,
    toggledSwitches,
    addComponent,
    addWire,
    setSelected,
    updateComponent,
    toggleButton,
    toggleSwitch,
    rotateSelected,
    mirrorSelected,
    duplicateSelected,
  } = useCanvasStore();

  const {
    activeTool,
    placingComponent,
    placingRotation,
    placingFlipX,
    placingFlipY,
    zoom,
    showGrid,
    theme,
    setActiveTool,
    setPlacingComponent,
    rotatePlacing,
    togglePlacingFlipX,
    togglePlacingFlipY,
  } = useUIStore();

  const { simState, energizedWires, energizedComponents, activeTimers } = useSimStore();
  const isEditing = simState === 'stopped';

  // Keep global ref updated
  useEffect(() => {
    globalStageRef = stageRef.current;
  });

  // Animation ticker for spinning motors and buzzing indicators
  useEffect(() => {
    if (simState !== 'running') return;
    let frameId: number;
    const loop = () => {
      setSimTick((t) => (t + 1) % 3600);
      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [simState]);

  // Resize observer
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(([e]) =>
      setStageSize({ width: e.contentRect.width, height: e.contentRect.height })
    );
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (e.key === 's' || e.key === 'S') setActiveTool('select');
      if (e.key === 'w' || e.key === 'W') setActiveTool('wire');
      if (e.key === 'r' || e.key === 'R') {
        if (activeTool === 'place') {
          rotatePlacing();
        } else if (selectedIds.length > 0 && isEditing) {
          rotateSelected();
        }
      }
      if (e.key === 'h' || e.key === 'H') {
        if (activeTool === 'place') {
          togglePlacingFlipX();
        } else if (selectedIds.length > 0 && isEditing) {
          mirrorSelected('x');
        }
      }
      if (e.key === 'v' || e.key === 'V') {
        if (activeTool === 'place') {
          togglePlacingFlipY();
        } else if (selectedIds.length > 0 && isEditing) {
          mirrorSelected('y');
        }
      }
      if (e.ctrlKey && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        if (isEditing) duplicateSelected();
      }
      if (e.ctrlKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        const allIds = [...components.map((c) => c.id), ...wires.map((w) => w.id)];
        setSelected(allIds);
      }
      if (e.key === 'Escape') {
        setDrawingWire(null);
        setPlacingComponent(null);
        setActiveTool('select');
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && isEditing) {
        useCanvasStore.getState().removeSelected();
      }
      if (e.ctrlKey && e.key === 'z') useCanvasStore.getState().undo();
      if (e.ctrlKey && (e.key === 'y' || e.key === 'Z')) useCanvasStore.getState().redo();
      if (e.key === '+' || e.key === '=') useUIStore.getState().setZoom(zoom + 0.1);
      if (e.key === '-') useUIStore.getState().setZoom(zoom - 0.1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [
    setActiveTool,
    setPlacingComponent,
    rotatePlacing,
    rotateSelected,
    togglePlacingFlipX,
    togglePlacingFlipY,
    mirrorSelected,
    duplicateSelected,
    setSelected,
    selectedIds,
    activeTool,
    zoom,
    isEditing,
    components,
    wires,
  ]);

  // Coordinate transforms
  const toWorld = (stageX: number, stageY: number): [number, number] =>
    snapPoint((stageX - offset.x) / zoom, (stageY - offset.y) / zoom);

  const getPointer = (e: any): [number, number] => {
    const pt = e.target.getStage().getPointerPosition();
    return toWorld(pt.x, pt.y);
  };

  // Mouse move handler
  const onMouseMove = (e: any) => {
    const [wx, wy] = getPointer(e);
    setMouse([wx, wy]);

    // Check if near any component terminal for visual snap hint
    if (activeTool === 'wire') {
      let nearest: [number, number] | null = null;
      for (const c of components) {
        const terms = getComponentTerminals(c);
        for (const t of terms) {
          if (Math.hypot(wx - t.x, wy - t.y) < 14) {
            nearest = [t.x, t.y];
          }
        }
      }
      setHoverTerminal(nearest);
    }
  };

  // Stage click handler
  const onStageClick = (e: any) => {
    if (e.target !== e.target.getStage() && e.target.getParent() === e.target.getStage()) return;
    if (!isEditing && simState !== 'paused') return;

    const [wx, wy] = hoverTerminal ?? getPointer(e);

    // Place new component
    if (activeTool === 'place' && placingComponent) {
      let defaultLabel = placingComponent;
      if (placingComponent.startsWith('POWER_RAIL_')) {
        defaultLabel = placingComponent.replace('POWER_RAIL_', '');
      } else if (placingComponent === 'POWER_AC_N') {
        defaultLabel = 'N';
      } else if (placingComponent === 'POWER_DC_POS') {
        defaultLabel = '+DC';
      } else if (placingComponent === 'POWER_DC_NEG') {
        defaultLabel = '-DC';
      } else if (placingComponent === 'POWER_DC_PE') {
        defaultLabel = 'DC GND';
      } else if (placingComponent === 'POWER_AC_1P_N') {
        defaultLabel = '1~+N';
      } else if (placingComponent === 'POWER_AC_3P') {
        defaultLabel = '3~ AC';
      } else if (placingComponent === 'POWER_AC_3P_N') {
        defaultLabel = '3~+N';
      } else if (placingComponent === 'POWER_AC_3P_N_PE') {
        defaultLabel = '3~+N+PE';
      } else if (placingComponent === 'DC_BATTERY') {
        defaultLabel = 'BAT1';
      } else if (placingComponent === 'INVERTER_1P') {
        defaultLabel = 'INV1~';
      } else if (placingComponent === 'INVERTER_3P') {
        defaultLabel = 'INV3~';
      } else if (placingComponent === 'GENERATOR_3P') {
        const count = components.filter((c) => c.type === 'GENERATOR_3P').length + 1;
        defaultLabel = `G${count}`;
      } else if (placingComponent === 'PHASE_FAILURE') {
        const count = components.filter((c) => c.type === 'PHASE_FAILURE').length + 1;
        defaultLabel = `PF${count}`;
      } else if (placingComponent.startsWith('FUSE_DISC_')) {
        const count = components.filter((c) => c.type.startsWith('FUSE_DISC_')).length + 1;
        defaultLabel = `FD${count}`;
      } else if (placingComponent.startsWith('FUSE')) {
        const count = components.filter((c) => c.type.startsWith('FUSE')).length + 1;
        defaultLabel = `FU${count}`;
      } else if (placingComponent.startsWith('OVERLOAD_')) {
        const count = components.filter((c) => c.type.startsWith('OVERLOAD_')).length + 1;
        defaultLabel = `FR${count}`;
      } else if (placingComponent.startsWith('ISOLATOR_')) {
        const count = components.filter((c) => c.type.startsWith('ISOLATOR_')).length + 1;
        defaultLabel = `QS${count}`;
      } else if (
        placingComponent.startsWith('MCB_') ||
        placingComponent.startsWith('MCCB_') ||
        placingComponent.startsWith('MAG_CB_') ||
        placingComponent.startsWith('RCD_') ||
        placingComponent.startsWith('RCBO_')
      ) {
        const count = components.filter((c) =>
          /^(MCB|MCCB|MAG_CB|RCD|RCBO)_/.test(c.type)
        ).length + 1;
        defaultLabel = `QF${count}`;
      } else if (placingComponent.startsWith('CONTACTOR_')) {
        defaultLabel = 'KM1';
      } else if (placingComponent.startsWith('SWITCH_')) {
        const count = components.filter((c) => c.type.startsWith('SWITCH_')).length + 1;
        defaultLabel = `SA${count}`;
      } else if (placingComponent.startsWith('HEATER_')) {
        const count = components.filter((c) => c.type.startsWith('HEATER_')).length + 1;
        defaultLabel = `EH${count}`;
      } else if (placingComponent === 'COIL') {
        const count = components.filter((c) => c.type === 'COIL').length + 1;
        defaultLabel = `KM${count}`;
      } else if (placingComponent.startsWith('PUSHBUTTON_')) {
        const count = components.filter((c) => c.type.startsWith('PUSHBUTTON_')).length + 1;
        defaultLabel = `SB${count}`;
      } else if (placingComponent.startsWith('TIMER_')) {
        const count = components.filter((c) => c.type.startsWith('TIMER_')).length + 1;
        defaultLabel = `KT${count}`;
      } else if (placingComponent.startsWith('MOTOR_')) {
        const count = components.filter((c) => c.type.startsWith('MOTOR_')).length + 1;
        defaultLabel = `M${count}`;
      } else if (placingComponent === 'LAMP') {
        const count = components.filter((c) => c.type === 'LAMP').length + 1;
        defaultLabel = `HL${count}`;
      }

      addComponent({
        id: `comp-${Date.now()}`,
        type: placingComponent as ComponentType,
        x: wx,
        y: wy,
        label: defaultLabel,
        rotation: placingRotation,
        flipX: placingFlipX,
        flipY: placingFlipY,
        timerDelay: 2000,
        color: placingComponent === 'LAMP' ? '#00e676' : undefined,
      });
      return;
    }

    // Draw Wire (orthogonal routing: if diagonal, splits into two perpendicular segments)
    if (activeTool === 'wire') {
      const snap = hoverTerminal ?? [wx, wy];
      if (!drawingWire) {
        setDrawingWire(snap);
      } else {
        const [x1, y1] = drawingWire;
        const [x2, y2] = snap;

        if (x1 !== x2 || y1 !== y2) {
          if (x1 === x2 || y1 === y2) {
            // Straight wire
            addWire({ id: `wire-${Date.now()}`, points: [x1, y1, x2, y2] });
          } else {
            // Orthogonal route: horizontal then vertical
            const corner = [x2, y1];
            addWire({ id: `wire-${Date.now()}-1`, points: [x1, y1, corner[0], corner[1]] });
            addWire({ id: `wire-${Date.now()}-2`, points: [corner[0], corner[1], x2, y2] });
          }
        }
        setDrawingWire(null);
      }
      return;
    }

    if (e.target === e.target.getStage()) setSelected([]);
  };

  const onRightClick = (e: any) => {
    e.evt.preventDefault();
    setDrawingWire(null);
    setPlacingComponent(null);
    if (activeTool !== 'select') setActiveTool('select');
  };

  // Zoom with wheel
  const onWheel = (e: any) => {
    e.evt.preventDefault();
    const stage = e.target.getStage();
    const pointer = stage.getPointerPosition();
    const factor = e.evt.deltaY < 0 ? 1.08 : 0.92;
    const newZoom = Math.min(3.5, Math.max(0.2, zoom * factor));
    const mouseWorldX = (pointer.x - offset.x) / zoom;
    const mouseWorldY = (pointer.y - offset.y) / zoom;
    setOffset({
      x: pointer.x - mouseWorldX * newZoom,
      y: pointer.y - mouseWorldY * newZoom,
    });
    useUIStore.getState().setZoom(newZoom);
  };

  // Grid lines
  const gridLines = useCallback(() => {
    if (!showGrid) return null;
    const color = theme === 'dark' ? '#252538' : '#e9ecef';
    const lines: React.ReactElement[] = [];
    const startX = Math.floor(-offset.x / zoom / GRID_SIZE) * GRID_SIZE - GRID_SIZE;
    const startY = Math.floor(-offset.y / zoom / GRID_SIZE) * GRID_SIZE - GRID_SIZE;
    const endX = startX + stageSize.width / zoom + GRID_SIZE * 3;
    const endY = startY + stageSize.height / zoom + GRID_SIZE * 3;

    for (let x = startX; x <= endX; x += GRID_SIZE) {
      lines.push(
        <Line
          key={`gx${x}`}
          points={[x, startY, x, endY]}
          stroke={color}
          strokeWidth={0.5}
          listening={false}
        />
      );
    }
    for (let y = startY; y <= endY; y += GRID_SIZE) {
      lines.push(
        <Line
          key={`gy${y}`}
          points={[startX, y, endX, y]}
          stroke={color}
          strokeWidth={0.5}
          listening={false}
        />
      );
    }
    return lines;
  }, [showGrid, offset, zoom, stageSize, theme]);

  // Compute Junction Dots: where 3 or more wires meet, or a wire end touches another wire
  const junctionDots = useMemo(() => {
    const ptCount = new Map<string, { count: number; x: number; y: number; live: boolean }>();

    for (const w of wires) {
      const [x1, y1, x2, y2] = w.points;
      const isLive = energizedWires.has(w.id);
      const k1 = `${x1},${y1}`;
      const k2 = `${x2},${y2}`;

      const c1 = ptCount.get(k1) ?? { count: 0, x: x1, y: y1, live: false };
      c1.count += 1;
      if (isLive) c1.live = true;
      ptCount.set(k1, c1);

      const c2 = ptCount.get(k2) ?? { count: 0, x: x2, y: y2, live: false };
      c2.count += 1;
      if (isLive) c2.live = true;
      ptCount.set(k2, c2);
    }

    const dots: Array<{ x: number; y: number; live: boolean }> = [];
    ptCount.forEach((val) => {
      if (val.count >= 3) {
        dots.push({ x: val.x, y: val.y, live: val.live });
      }
    });

    return dots;
  }, [wires, energizedWires]);

  const bgColor = theme === 'dark' ? '#161b22' : '#ffffff';
  const wireDef = theme === 'dark' ? '#d0d7de' : '#24292f';

  let cursor = 'default';
  if (activeTool === 'wire') cursor = 'crosshair';
  else if (activeTool === 'place') cursor = 'copy';

  return (
    <div ref={containerRef} className={styles.canvasContainer} style={{ cursor }}>
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        x={offset.x}
        y={offset.y}
        scaleX={zoom}
        scaleY={zoom}
        onMouseMove={onMouseMove}
        onClick={onStageClick}
        onContextMenu={onRightClick}
        onWheel={onWheel}
        draggable={activeTool === 'select'}
        onDragEnd={(e) => setOffset({ x: e.target.x(), y: e.target.y() })}
      >
        <Layer>
          {/* Canvas Background */}
          <Rect
            x={-offset.x / zoom}
            y={-offset.y / zoom}
            width={stageSize.width / zoom}
            height={stageSize.height / zoom}
            fill={bgColor}
            listening={false}
          />

          {/* Grid lines */}
          {gridLines()}

          {/* Wires */}
          {wires.map((wire) => {
            const energized = energizedWires.has(wire.id);
            const selected = selectedIds.includes(wire.id);
            return (
              <Line
                key={wire.id}
                points={wire.points}
                stroke={energized ? ACTIVE_COLOR : selected ? SEL_COLOR : wireDef}
                strokeWidth={energized ? 2.5 : selected ? 2.5 : 2}
                lineCap="round"
                shadowColor={energized ? '#00e676' : undefined}
                shadowBlur={energized ? 7 : 0}
                onClick={() => setSelected([wire.id])}
                hitStrokeWidth={10}
              />
            );
          })}

          {/* Junction Dots */}
          {junctionDots.map((dot, idx) => (
            <Circle
              key={`dot-${idx}`}
              x={dot.x}
              y={dot.y}
              radius={3.5}
              fill={dot.live ? ACTIVE_COLOR : theme === 'dark' ? '#f0f6fc' : '#1f2328'}
              shadowColor={dot.live ? '#00e676' : undefined}
              shadowBlur={dot.live ? 6 : 0}
              listening={false}
            />
          ))}

          {/* Active Wire Preview being drawn */}
          {drawingWire && (
            <>
              {/* If horizontal/vertical, 1 segment; if diagonal, orthogonal preview */}
              {drawingWire[0] === mouse[0] || drawingWire[1] === mouse[1] ? (
                <Line
                  points={[drawingWire[0], drawingWire[1], mouse[0], mouse[1]]}
                  stroke={SEL_COLOR}
                  strokeWidth={2}
                  dash={[8, 4]}
                  lineCap="round"
                  listening={false}
                />
              ) : (
                <Line
                  points={[
                    drawingWire[0],
                    drawingWire[1],
                    mouse[0],
                    drawingWire[1],
                    mouse[0],
                    mouse[1],
                  ]}
                  stroke={SEL_COLOR}
                  strokeWidth={2}
                  dash={[8, 4]}
                  lineCap="round"
                  listening={false}
                />
              )}
              <Circle
                x={drawingWire[0]}
                y={drawingWire[1]}
                radius={4}
                fill={SEL_COLOR}
                listening={false}
              />
            </>
          )}

          {/* Terminal Snap Highlight */}
          {hoverTerminal && activeTool === 'wire' && (
            <Circle
              x={hoverTerminal[0]}
              y={hoverTerminal[1]}
              radius={6}
              stroke={SEL_COLOR}
              strokeWidth={2}
              fill={SEL_COLOR + '30'}
              listening={false}
            />
          )}

          {/* Electrical Components */}
          {components.map((comp) => (
            <ElectricalSymbol
              key={comp.id}
              component={comp}
              isSelected={selectedIds.includes(comp.id)}
              isActive={energizedComponents.has(comp.id)}
              isPressed={pressedButtons.has(comp.id)}
              isToggled={toggledSwitches.has(comp.id)}
              timerStatus={activeTimers[comp.label]}
              theme={theme}
              simState={simState}
              simTick={simTick}
              onClick={() => setSelected([comp.id])}
              onDragEnd={(x, y) => updateComponent(comp.id, { x, y })}
              onToggleInteractive={() => {
                if (
                  comp.type === 'PUSHBUTTON_NO' ||
                  comp.type === 'PUSHBUTTON_NC'
                ) {
                  toggleButton(comp.id);
                } else {
                  toggleSwitch(comp.id);
                }
              }}
            />
          ))}

          {/* Ghost Component Placement Preview with Rotation */}
          {activeTool === 'place' && placingComponent && (
            <Group opacity={0.45} listening={false}>
              <ElectricalSymbol
                component={{
                  id: 'ghost-preview',
                  type: placingComponent as ComponentType,
                  x: mouse[0],
                  y: mouse[1],
                  label: '',
                  rotation: placingRotation,
                  flipX: placingFlipX,
                  flipY: placingFlipY,
                  timerDelay: 2000,
                }}
                isSelected={false}
                isActive={false}
                theme={theme}
                simState="stopped"
                onClick={() => {}}
                onDragEnd={() => {}}
              />
            </Group>
          )}
        </Layer>
      </Stage>
    </div>
  );
};
