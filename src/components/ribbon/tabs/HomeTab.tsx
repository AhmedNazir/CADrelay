import React from 'react';
import { Toolbar, ToolbarButton, Tooltip, Text } from '@fluentui/react-components';
import {
  CursorClick24Regular,
  Line24Regular,
  Delete24Regular,
  ArrowRotateClockwise24Regular,
  FlipHorizontal24Regular,
  FlipVertical24Regular,
  Copy24Regular,
  BookOpen24Regular,
  Image24Regular,
  SelectAllOn24Regular,
} from '@fluentui/react-icons';
import { useUIStore } from '../../../store/uiStore';
import { useCanvasStore } from '../../../store/canvasStore';
import { globalStageRef } from '../../canvas/Canvas';
import { exportToPNG } from '../../../utils/fileIO';
import styles from './Tab.module.css';

export const HomeTab: React.FC = () => {
  const { activeTool, setActiveTool, setExamplesModalOpen } = useUIStore();
  const {
    removeSelected,
    rotateSelected,
    mirrorSelected,
    duplicateSelected,
    selectedIds,
    components,
    wires,
    setSelected,
  } = useCanvasStore();

  const handleExportPNG = () => {
    if (globalStageRef) {
      exportToPNG(globalStageRef, 'cadrelay-circuit.png');
    }
  };

  const handleSelectAll = () => {
    const all = [...components.map((c) => c.id), ...wires.map((w) => w.id)];
    setSelected(all);
  };

  return (
    <div className={styles.tabRow}>
      {/* Templates / Examples */}
      <div className={styles.group}>
        <Text size={100} className={styles.groupLabel}>Templates</Text>
        <Toolbar>
          <Tooltip content="Browse pre-built circuit templates (DOL starter, Star-Delta, Timers)" relationship="label">
            <ToolbarButton
              icon={<BookOpen24Regular />}
              appearance="primary"
              onClick={() => setExamplesModalOpen(true)}
            >
              Examples
            </ToolbarButton>
          </Tooltip>
        </Toolbar>
      </div>

      <div className={styles.divider} />

      {/* Tools */}
      <div className={styles.group}>
        <Text size={100} className={styles.groupLabel}>Tools</Text>
        <Toolbar>
          <Tooltip content="Select & Move (S)" relationship="label">
            <ToolbarButton
              icon={<CursorClick24Regular />}
              appearance={activeTool === 'select' ? 'primary' : 'subtle'}
              onClick={() => setActiveTool('select')}
            >
              Select
            </ToolbarButton>
          </Tooltip>
          <Tooltip content="Draw Wire (W) — Auto-orthogonal" relationship="label">
            <ToolbarButton
              icon={<Line24Regular />}
              appearance={activeTool === 'wire' ? 'primary' : 'subtle'}
              onClick={() => setActiveTool('wire')}
            >
              Wire
            </ToolbarButton>
          </Tooltip>
        </Toolbar>
      </div>

      <div className={styles.divider} />

      {/* Transform / Edit */}
      <div className={styles.group}>
        <Text size={100} className={styles.groupLabel}>Edit & Arrange</Text>
        <Toolbar>
          <Tooltip content="Rotate selected 90° (R)" relationship="label">
            <ToolbarButton
              icon={<ArrowRotateClockwise24Regular />}
              disabled={selectedIds.length === 0}
              onClick={rotateSelected}
            >
              Rotate (R)
            </ToolbarButton>
          </Tooltip>
          <Tooltip content="Mirror Horizontally (H)" relationship="label">
            <ToolbarButton
              icon={<FlipHorizontal24Regular />}
              disabled={selectedIds.length === 0}
              onClick={() => mirrorSelected('x')}
            >
              Flip H
            </ToolbarButton>
          </Tooltip>
          <Tooltip content="Mirror Vertically (V)" relationship="label">
            <ToolbarButton
              icon={<FlipVertical24Regular />}
              disabled={selectedIds.length === 0}
              onClick={() => mirrorSelected('y')}
            >
              Flip V
            </ToolbarButton>
          </Tooltip>
          <Tooltip content="Duplicate selected (Ctrl+D)" relationship="label">
            <ToolbarButton
              icon={<Copy24Regular />}
              disabled={selectedIds.length === 0}
              onClick={duplicateSelected}
            >
              Duplicate
            </ToolbarButton>
          </Tooltip>
          <Tooltip content="Select all elements (Ctrl+A)" relationship="label">
            <ToolbarButton icon={<SelectAllOn24Regular />} onClick={handleSelectAll}>
              Select All
            </ToolbarButton>
          </Tooltip>
          <Tooltip content="Delete selected (Del)" relationship="label">
            <ToolbarButton
              icon={<Delete24Regular />}
              disabled={selectedIds.length === 0}
              onClick={removeSelected}
            >
              Delete
            </ToolbarButton>
          </Tooltip>
        </Toolbar>
      </div>

      <div className={styles.divider} />

      {/* Export */}
      <div className={styles.group}>
        <Text size={100} className={styles.groupLabel}>Export</Text>
        <Toolbar>
          <Tooltip content="Export circuit diagram as PNG image" relationship="label">
            <ToolbarButton icon={<Image24Regular />} onClick={handleExportPNG}>
              Export PNG
            </ToolbarButton>
          </Tooltip>
        </Toolbar>
      </div>
    </div>
  );
};
