import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import { Stage, Layer, Line, Rect, Circle, Group } from "react-konva";
import { useCanvasStore } from "../../store/canvasStore";
import { useUIStore } from "../../store/uiStore";
import { useSimStore } from "../../store/simStore";
import { snapPoint, GRID_SIZE } from "../../utils/snapGrid";
import { getComponentTerminals } from "../../engine/graph";
import { getDefaultComponentTag } from "../../utils/componentTags";
import {
  buildOrthogonalPoints,
  computeJunctionDots,
  findNearestWireSnap,
  simplifyPolyline,
} from "../../utils/wireGeometry";
import { ElectricalSymbol } from "../symbols/ElectricalSymbol";
import type { ComponentType } from "../../store/canvasStore";
import styles from "./Canvas.module.css";

const ACTIVE_COLOR = "#00e676";
const SEL_COLOR = "#0078d4";

// Expose stage ref globally for PNG export from Ribbon
export let globalStageRef: any = null;

export const SchematicCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<any>(null);
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
  const [offset, setOffset] = useState({ x: 80, y: 80 });
  const [wireRoute, setWireRoute] = useState<[number, number][] | null>(null);
  const [mouse, setMouse] = useState<[number, number]>([0, 0]);
  const [hoverTerminal, setHoverTerminal] = useState<[number, number] | null>(
    null,
  );
  const [hoverWirePoint, setHoverWirePoint] = useState<[number, number] | null>(
    null,
  );
  const [simTick, setSimTick] = useState(0);

  const {
    components,
    wires,
    selectedIds,
    pressedButtons,
    toggledSwitches,
    addComponent,
    addWires,
    moveWire,
    setSelected,
    moveComponent,
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
    defaultWireColor,
    defaultWireWidth,
    setActiveTool,
    setPlacingComponent,
    rotatePlacing,
    togglePlacingFlipX,
    togglePlacingFlipY,
  } = useUIStore();

  const { simState, energizedWires, energizedComponents, activeTimers } =
    useSimStore();
  const isEditing = simState === "stopped";

  const finishWireAt = useCallback(
    (endPoint: [number, number]) => {
      if (!wireRoute?.length) return;
      const route = [...wireRoute, endPoint].filter(
        (point, index, points) =>
          index === 0 ||
          point[0] !== points[index - 1][0] ||
          point[1] !== points[index - 1][1],
      );
      const routePoints: number[] = [];

      for (let i = 0; i + 1 < route.length; i += 1) {
        const [x1, y1] = route[i];
        const [x2, y2] = route[i + 1];
        const routedPoints = buildOrthogonalPoints(x1, y1, x2, y2);
        for (let p = 0; p + 1 < routedPoints.length; p += 2) {
          const x = routedPoints[p];
          const y = routedPoints[p + 1];
          if (
            routePoints.length >= 2 &&
            routePoints[routePoints.length - 2] === x &&
            routePoints[routePoints.length - 1] === y
          ) {
            continue;
          }
          routePoints.push(x, y);
        }
      }

      const points = simplifyPolyline(routePoints);
      if (points.length >= 4) {
        addWires([
          {
            id: `wire-${Date.now()}`,
            points,
            ...(defaultWireColor ? { color: defaultWireColor } : {}),
            strokeWidth: defaultWireWidth,
          },
        ]);
      }
      setWireRoute(null);
    },
    [addWires, defaultWireColor, defaultWireWidth, wireRoute],
  );

  // Keep global ref updated
  useEffect(() => {
    globalStageRef = stageRef.current;
  });

  // Animation ticker for spinning motors and buzzing indicators
  useEffect(() => {
    if (simState !== "running") return;
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
      setStageSize({
        width: e.contentRect.width,
        height: e.contentRect.height,
      }),
    );
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if (e.key === "s" || e.key === "S") setActiveTool("select");
      if (e.key === "w" || e.key === "W") setActiveTool("wire");
      if (e.key === "r" || e.key === "R") {
        if (activeTool === "place") {
          rotatePlacing();
        } else if (selectedIds.length > 0 && isEditing) {
          rotateSelected();
        }
      }
      if (e.key === "h" || e.key === "H") {
        if (activeTool === "place") {
          togglePlacingFlipX();
        } else if (selectedIds.length > 0 && isEditing) {
          mirrorSelected("x");
        }
      }
      if (e.key === "v" || e.key === "V") {
        if (activeTool === "place") {
          togglePlacingFlipY();
        } else if (selectedIds.length > 0 && isEditing) {
          mirrorSelected("y");
        }
      }
      if (e.ctrlKey && (e.key === "d" || e.key === "D")) {
        e.preventDefault();
        if (isEditing) duplicateSelected();
      }
      if (e.ctrlKey && (e.key === "a" || e.key === "A")) {
        e.preventDefault();
        const allIds = [
          ...components.map((c) => c.id),
          ...wires.map((w) => w.id),
        ];
        setSelected(allIds);
      }
      if (e.key === "Escape") {
        setWireRoute(null);
        setPlacingComponent(null);
        setActiveTool("select");
      }
      if (e.key === "Enter" && activeTool === "wire" && wireRoute) {
        e.preventDefault();
        finishWireAt(mouse);
      }
      if ((e.key === "Delete" || e.key === "Backspace") && isEditing) {
        useCanvasStore.getState().removeSelected();
      }
      if (e.ctrlKey && e.key === "z") useCanvasStore.getState().undo();
      if (e.ctrlKey && (e.key === "y" || e.key === "Z"))
        useCanvasStore.getState().redo();
      if (e.key === "+" || e.key === "=")
        useUIStore.getState().setZoom(zoom + 0.1);
      if (e.key === "-") useUIStore.getState().setZoom(zoom - 0.1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
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
    wireRoute,
    finishWireAt,
    mouse,
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

    // Check if near any component terminal for visual snap hint
    if (activeTool === "wire") {
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
      if (nearest) {
        setHoverWirePoint(null);
        setMouse(nearest);
      } else {
        const wireHit = findNearestWireSnap(wx, wy, wires);
        const wirePoint: [number, number] | null = wireHit
          ? [wireHit.x, wireHit.y]
          : null;
        setHoverWirePoint(wirePoint);
        setMouse(wirePoint ?? [wx, wy]);
      }
    } else {
      setHoverTerminal(null);
      setHoverWirePoint(null);
      setMouse([wx, wy]);
    }
  };

  // Stage click handler
  const onStageClick = (e: any) => {
    if (e.target !== e.target.getStage() && activeTool !== "wire") return;
    if (!isEditing && simState !== "paused") return;

    const [wx, wy] = hoverTerminal ?? getPointer(e);

    // Place new component
    if (activeTool === "place" && placingComponent) {
      const defaultLabel = getDefaultComponentTag(
        placingComponent as ComponentType,
        components,
      );

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
        color: placingComponent === "LAMP" ? "#00e676" : undefined,
      });
      return;
    }

    // Click to place route waypoints; finish with Enter or right-click.
    if (activeTool === "wire") {
      const point: [number, number] = hoverTerminal ??
        hoverWirePoint ?? [wx, wy];
      setWireRoute((route) => {
        if (!route) return [point];
        const last = route[route.length - 1];
        if (last[0] === point[0] && last[1] === point[1]) return route;
        return [...route, point];
      });
      return;
    }

    if (e.target === e.target.getStage()) setSelected([]);
  };

  const onRightClick = (e: any) => {
    e.evt.preventDefault();
    if (activeTool === "wire" && wireRoute) {
      finishWireAt(hoverTerminal ?? hoverWirePoint ?? getPointer(e));
      return;
    }
    setPlacingComponent(null);
    if (activeTool !== "select") setActiveTool("select");
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
    const color = theme === "dark" ? "#252538" : "#e9ecef";
    const lines: React.ReactElement[] = [];
    const startX =
      Math.floor(-offset.x / zoom / GRID_SIZE) * GRID_SIZE - GRID_SIZE;
    const startY =
      Math.floor(-offset.y / zoom / GRID_SIZE) * GRID_SIZE - GRID_SIZE;
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
        />,
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
        />,
      );
    }
    return lines;
  }, [showGrid, offset, zoom, stageSize, theme]);

  // Show a junction marker wherever separate wires electrically meet.
  const junctionDots = useMemo(() => {
    const terminalKeys = new Set(
      components.flatMap((component) =>
        getComponentTerminals(component).map((terminal) => terminal.key),
      ),
    );
    return computeJunctionDots(wires, terminalKeys, energizedWires);
  }, [components, wires, energizedWires]);

  const bgColor = theme === "dark" ? "#161b22" : "#ffffff";
  const wireDef = theme === "dark" ? "#d0d7de" : "#24292f";

  let cursor = "default";
  if (activeTool === "wire") cursor = "crosshair";
  else if (activeTool === "place") cursor = "copy";

  return (
    <div
      ref={containerRef}
      className={styles.canvasContainer}
      style={{ cursor }}
    >
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
        draggable={activeTool === "select"}
        onDragEnd={(e) => {
          if (e.target === e.target.getStage()) {
            setOffset({ x: e.target.x(), y: e.target.y() });
          }
        }}
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
                name="wire-segment"
                points={wire.points}
                stroke={energized ? ACTIVE_COLOR : wire.color || wireDef}
                strokeWidth={wire.strokeWidth ?? 2}
                lineCap="round"
                shadowColor={
                  energized ? "#00e676" : selected ? SEL_COLOR : undefined
                }
                shadowBlur={energized ? 7 : selected ? 4 : 0}
                onClick={() => {
                  if (activeTool !== "wire") setSelected([wire.id]);
                }}
                hitStrokeWidth={Math.max(wire.strokeWidth ?? 2, 14 / zoom)}
                draggable={activeTool === "select" && isEditing}
                onDragMove={(e) => {
                  const [x, y] = snapPoint(e.target.x(), e.target.y());
                  e.target.position({ x, y });
                }}
                onDragEnd={(e) => {
                  e.cancelBubble = true;
                  const deltaX = e.target.x();
                  const deltaY = e.target.y();
                  e.target.position({ x: 0, y: 0 });
                  moveWire(wire.id, deltaX, deltaY);
                }}
              />
            );
          })}

          {/* Junction Dots */}
          {junctionDots.map((dot, idx) => (
            <Circle
              key={`dot-${idx}`}
              x={dot.x}
              y={dot.y}
              radius={dot.radius}
              fill={
                dot.live
                  ? ACTIVE_COLOR
                  : theme === "dark"
                    ? "#f0f6fc"
                    : "#1f2328"
              }
              shadowColor={dot.live ? "#00e676" : undefined}
              shadowBlur={dot.live ? 6 : 0}
              listening={false}
            />
          ))}

          {/* Active Wire Preview being drawn */}
          {wireRoute && (
            <>
              {wireRoute.slice(0, -1).map((point, index) => (
                <Line
                  key={`route-${index}`}
                  points={buildOrthogonalPoints(
                    point[0],
                    point[1],
                    wireRoute[index + 1][0],
                    wireRoute[index + 1][1],
                  )}
                  stroke={defaultWireColor || SEL_COLOR}
                  strokeWidth={defaultWireWidth}
                  dash={[8, 4]}
                  lineCap="round"
                  listening={false}
                />
              ))}
              <Line
                points={buildOrthogonalPoints(
                  wireRoute[wireRoute.length - 1][0],
                  wireRoute[wireRoute.length - 1][1],
                  mouse[0],
                  mouse[1],
                )}
                stroke={defaultWireColor || SEL_COLOR}
                strokeWidth={defaultWireWidth}
                dash={[8, 4]}
                lineCap="round"
                listening={false}
              />
              <Circle
                x={wireRoute[0][0]}
                y={wireRoute[0][1]}
                radius={4}
                fill={SEL_COLOR}
                listening={false}
              />
            </>
          )}

          {/* Terminal Snap Highlight */}
          {(hoverTerminal || hoverWirePoint) && activeTool === "wire" && (
            <Circle
              x={(hoverTerminal ?? hoverWirePoint)![0]}
              y={(hoverTerminal ?? hoverWirePoint)![1]}
              radius={6}
              stroke={SEL_COLOR}
              strokeWidth={2}
              fill={SEL_COLOR + "30"}
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
              isWireTool={activeTool === "wire"}
              onClick={() => {
                if (activeTool !== "wire") setSelected([comp.id]);
              }}
              onDragEnd={(x, y) => moveComponent(comp.id, x, y)}
              onToggleInteractive={() => {
                if (
                  comp.type === "PUSHBUTTON_NO" ||
                  comp.type === "PUSHBUTTON_NC"
                ) {
                  toggleButton(comp.id);
                } else {
                  toggleSwitch(comp.id);
                }
              }}
            />
          ))}

          {/* Ghost Component Placement Preview with Rotation */}
          {activeTool === "place" && placingComponent && (
            <Group opacity={0.45} listening={false}>
              <ElectricalSymbol
                component={{
                  id: "ghost-preview",
                  type: placingComponent as ComponentType,
                  x: mouse[0],
                  y: mouse[1],
                  label: "",
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
