import { create } from 'zustand';
import type { RotationAngle } from './canvasStore';
import { DEFAULT_WIRE_WIDTH } from '../utils/wireGeometry';

export type ActiveTool = 'select' | 'wire' | 'place';
export type Theme = 'light' | 'dark';

interface UIState {
  activeTool: ActiveTool;
  placingComponent: string | null;
  placingRotation: RotationAngle;
  placingFlipX: boolean;
  placingFlipY: boolean;
  activeRibbonTab: string;
  zoom: number;
  showGrid: boolean;
  theme: Theme;
  examplesModalOpen: boolean;
  helpModalOpen: boolean;
  defaultWireColor: string; // '' = theme default
  defaultWireWidth: number;

  setActiveTool: (tool: ActiveTool) => void;
  setPlacingComponent: (type: string | null) => void;
  setPlacingRotation: (rot: RotationAngle) => void;
  rotatePlacing: () => void;
  togglePlacingFlipX: () => void;
  togglePlacingFlipY: () => void;
  setActiveRibbonTab: (tab: string) => void;
  setZoom: (zoom: number) => void;
  toggleGrid: () => void;
  toggleTheme: () => void;
  setExamplesModalOpen: (open: boolean) => void;
  setHelpModalOpen: (open: boolean) => void;
  setDefaultWireColor: (color: string) => void;
  setDefaultWireWidth: (width: number) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeTool: 'select',
  placingComponent: null,
  placingRotation: 0,
  placingFlipX: false,
  placingFlipY: false,
  activeRibbonTab: 'home',
  zoom: 1,
  showGrid: true,
  theme: 'light',
  examplesModalOpen: false,
  helpModalOpen: false,
  defaultWireColor: '',
  defaultWireWidth: DEFAULT_WIRE_WIDTH,

  setActiveTool: (tool) => set({ activeTool: tool, placingComponent: null }),
  setPlacingComponent: (type) =>
    set({
      placingComponent: type,
      activeTool: type ? 'place' : 'select',
      placingRotation: 0,
      placingFlipX: false,
      placingFlipY: false,
    }),
  setPlacingRotation: (rot) => set({ placingRotation: rot }),
  rotatePlacing: () =>
    set((s) => ({
      placingRotation: (((s.placingRotation + 90) % 360) as RotationAngle),
    })),
  togglePlacingFlipX: () => set((s) => ({ placingFlipX: !s.placingFlipX })),
  togglePlacingFlipY: () => set((s) => ({ placingFlipY: !s.placingFlipY })),
  setActiveRibbonTab: (tab) => set({ activeRibbonTab: tab }),
  setZoom: (zoom) => set({ zoom: Math.min(3, Math.max(0.2, zoom)) }),
  toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),
  toggleTheme: () => set((s) => ({ theme: s.theme === 'light' ? 'dark' : 'light' })),
  setExamplesModalOpen: (open) => set({ examplesModalOpen: open }),
  setHelpModalOpen: (open) => set({ helpModalOpen: open }),
  setDefaultWireColor: (color) => set({ defaultWireColor: color }),
  setDefaultWireWidth: (width) => set({ defaultWireWidth: Math.max(1, Math.min(12, width)) }),
}));
