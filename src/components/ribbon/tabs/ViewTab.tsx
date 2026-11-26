import React from 'react';
import { Toolbar, ToolbarButton, Tooltip, Text } from '@fluentui/react-components';
import {
  GridDots24Regular,
  WeatherMoon24Regular,
  WeatherSunny24Regular,
  ZoomIn24Regular,
  ZoomOut24Regular,
  ArrowMaximize24Regular,
  QuestionCircle24Regular,
} from '@fluentui/react-icons';
import { useUIStore } from '../../../store/uiStore';
import styles from './Tab.module.css';

export const ViewTab: React.FC = () => {
  const { showGrid, toggleGrid, theme, toggleTheme, zoom, setZoom, setHelpModalOpen } = useUIStore();

  return (
    <div className={styles.tabRow}>
      {/* Zoom Controls */}
      <div className={styles.group}>
        <Text size={100} className={styles.groupLabel}>Zoom ({Math.round(zoom * 100)}%)</Text>
        <Toolbar>
          <Tooltip content="Zoom In (+)" relationship="label">
            <ToolbarButton icon={<ZoomIn24Regular />} onClick={() => setZoom(zoom + 0.1)}>
              Zoom In
            </ToolbarButton>
          </Tooltip>
          <Tooltip content="Zoom Out (-)" relationship="label">
            <ToolbarButton icon={<ZoomOut24Regular />} onClick={() => setZoom(zoom - 0.1)}>
              Zoom Out
            </ToolbarButton>
          </Tooltip>
          <Tooltip content="Reset Zoom to 100%" relationship="label">
            <ToolbarButton icon={<ArrowMaximize24Regular />} onClick={() => setZoom(1)}>
              100%
            </ToolbarButton>
          </Tooltip>
        </Toolbar>
      </div>

      <div className={styles.divider} />

      {/* Display Options */}
      <div className={styles.group}>
        <Text size={100} className={styles.groupLabel}>Canvas View</Text>
        <Toolbar>
          <Tooltip content="Toggle engineering grid" relationship="label">
            <ToolbarButton
              icon={<GridDots24Regular />}
              appearance={showGrid ? 'primary' : 'subtle'}
              onClick={toggleGrid}
            >
              Grid
            </ToolbarButton>
          </Tooltip>
          <Tooltip content="Toggle dark / light theme" relationship="label">
            <ToolbarButton
              icon={theme === 'dark' ? <WeatherSunny24Regular /> : <WeatherMoon24Regular />}
              onClick={toggleTheme}
            >
              {theme === 'dark' ? 'Light Theme' : 'Dark Theme'}
            </ToolbarButton>
          </Tooltip>
        </Toolbar>
      </div>

      <div className={styles.divider} />

      {/* Help & Guide */}
      <div className={styles.group}>
        <Text size={100} className={styles.groupLabel}>Documentation</Text>
        <Toolbar>
          <Tooltip content="Keyboard shortcuts & CADrelay user manual" relationship="label">
            <ToolbarButton
              icon={<QuestionCircle24Regular />}
              onClick={() => setHelpModalOpen(true)}
            >
              Help & Shortcuts
            </ToolbarButton>
          </Tooltip>
        </Toolbar>
      </div>
    </div>
  );
};
