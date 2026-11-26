import React from 'react';
import { Text, Badge } from '@fluentui/react-components';
import { Warning16Regular } from '@fluentui/react-icons';
import { useUIStore } from '../store/uiStore';
import { useSimStore } from '../store/simStore';
import { useCanvasStore } from '../store/canvasStore';
import styles from './StatusBar.module.css';

export const StatusBar: React.FC = () => {
  const { activeTool, zoom, theme, placingRotation, placingComponent } = useUIStore();
  const { simState, isShortCircuit, energizedCoils } = useSimStore();
  const { components, wires, selectedIds } = useCanvasStore();

  return (
    <div className={`${styles.statusBar} ${theme === 'dark' ? styles.dark : ''}`}>
      <div className={styles.left}>
        <Badge
          appearance="filled"
          color={
            simState === 'running'
              ? 'success'
              : simState === 'paused'
              ? 'warning'
              : 'informative'
          }
          size="small"
        >
          {simState.toUpperCase()}
        </Badge>

        {isShortCircuit && (
          <Badge appearance="filled" color="danger" icon={<Warning16Regular />} size="small">
            FAULT: SHORT CIRCUIT
          </Badge>
        )}

        <Text size={100}>
          Tool: <strong>{activeTool.toUpperCase()}</strong>
          {activeTool === 'place' ? ` (${placingComponent} @ ${placingRotation}°)` : ''}
        </Text>

        <Text size={100}>Components: {components.length}</Text>
        <Text size={100}>Wires: {wires.length}</Text>
        {selectedIds.length > 0 && <Text size={100}>Selected: {selectedIds.length}</Text>}

        {simState === 'running' && energizedCoils.size > 0 && (
          <Text size={100} style={{ color: '#00e676' }}>
            Active Coils: {Array.from(energizedCoils).join(', ')}
          </Text>
        )}
      </div>

      <div className={styles.right}>
        <Text size={100}>Zoom: {Math.round(zoom * 100)}%</Text>
        <Text size={100}>S: Select • W: Wire • R: Rotate • Del: Delete • Ctrl+Z: Undo</Text>
      </div>
    </div>
  );
};
