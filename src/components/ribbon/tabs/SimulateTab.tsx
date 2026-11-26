import React from 'react';
import { Toolbar, ToolbarButton, Tooltip, Text, Slider, Badge } from '@fluentui/react-components';
import {
  Play24Regular,
  Pause24Regular,
  Stop24Regular,
  Next24Regular,
  Warning24Regular,
} from '@fluentui/react-icons';
import { useSimStore } from '../../../store/simStore';
import styles from './Tab.module.css';

export const SimulateTab: React.FC = () => {
  const { simState, speed, isShortCircuit, play, pause, stop, step, setSpeed } = useSimStore();

  return (
    <div className={styles.tabRow}>
      {/* Simulation Controls */}
      <div className={styles.group}>
        <Text size={100} className={styles.groupLabel}>Engine</Text>
        <Toolbar>
          <Tooltip content="Start Simulation (F5)" relationship="label">
            <ToolbarButton
              icon={<Play24Regular />}
              appearance={simState === 'running' ? 'primary' : 'subtle'}
              onClick={play}
              disabled={simState === 'running'}
            >
              Play
            </ToolbarButton>
          </Tooltip>
          <Tooltip content="Pause / Resume" relationship="label">
            <ToolbarButton
              icon={<Pause24Regular />}
              appearance={simState === 'paused' ? 'primary' : 'subtle'}
              onClick={pause}
              disabled={simState === 'stopped'}
            >
              {simState === 'paused' ? 'Resume' : 'Pause'}
            </ToolbarButton>
          </Tooltip>
          <Tooltip content="Stop Simulation" relationship="label">
            <ToolbarButton
              icon={<Stop24Regular />}
              onClick={stop}
              disabled={simState === 'stopped'}
            >
              Stop
            </ToolbarButton>
          </Tooltip>
          <Tooltip content="Single Step execution" relationship="label">
            <ToolbarButton icon={<Next24Regular />} onClick={step} disabled={simState === 'running'}>
              Step
            </ToolbarButton>
          </Tooltip>
        </Toolbar>
      </div>

      <div className={styles.divider} />

      {/* Speed Slider */}
      <div className={styles.group}>
        <Text size={100} className={styles.groupLabel}>Scan Rate ({speed}ms)</Text>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 32 }}>
          <Slider
            min={30}
            max={800}
            step={30}
            value={speed}
            onChange={(_, d) => setSpeed(d.value)}
            style={{ width: 130 }}
          />
        </div>
      </div>

      {/* Short Circuit Warning Badge */}
      {isShortCircuit && (
        <>
          <div className={styles.divider} />
          <div className={styles.group}>
            <Text size={100} className={styles.groupLabel}>Fault Diagnostic</Text>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, height: 32 }}>
              <Badge appearance="filled" color="danger" icon={<Warning24Regular />} size="large">
                SHORT CIRCUIT DETECTED!
              </Badge>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
