import React from 'react';
import {
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogContent,
  DialogActions,
  Button,
  Text,
  Badge,
} from '@fluentui/react-components';
import { Dismiss24Regular, PlayCircle24Regular } from '@fluentui/react-icons';
import { PREBUILT_CIRCUITS, type PrebuiltCircuit } from '../../examples/circuits';
import { useCanvasStore } from '../../store/canvasStore';
import { useUIStore } from '../../store/uiStore';
import { useSimStore } from '../../store/simStore';
import styles from './Dialogs.module.css';

export const ExamplesDialog: React.FC = () => {
  const { examplesModalOpen, setExamplesModalOpen } = useUIStore();
  const { loadCircuit } = useCanvasStore();
  const { stop } = useSimStore();

  const handleLoad = (circuit: PrebuiltCircuit) => {
    stop();
    loadCircuit(circuit.components, circuit.wires);
    setExamplesModalOpen(false);
  };

  return (
    <Dialog open={examplesModalOpen} onOpenChange={(_, d) => setExamplesModalOpen(d.open)}>
      <DialogSurface className={styles.dialogSurface}>
        <DialogTitle
          action={
            <Button
              appearance="subtle"
              icon={<Dismiss24Regular />}
              onClick={() => setExamplesModalOpen(false)}
            />
          }
        >
          📚 Example Circuit Templates
        </DialogTitle>
        <DialogBody>
          <DialogContent>
            <Text size={200} style={{ marginBottom: 12, display: 'block' }}>
              Load classic industrial control circuits inspired by CADe SIMU. All templates are pre-wired and ready for real-time simulation.
            </Text>

            <div className={styles.grid}>
              {PREBUILT_CIRCUITS.map((circuit) => (
                <div key={circuit.id} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <Text size={300} weight="semibold">{circuit.name}</Text>
                    <Badge appearance="outline" color="brand">{circuit.category}</Badge>
                  </div>
                  <Text size={200} className={styles.cardDesc}>
                    {circuit.description}
                  </Text>
                  <div className={styles.cardFooter}>
                    <Text size={100} style={{ opacity: 0.6 }}>
                      {circuit.components.length} components • {circuit.wires.length} wires
                    </Text>
                    <Button
                      icon={<PlayCircle24Regular />}
                      appearance="primary"
                      size="small"
                      onClick={() => handleLoad(circuit)}
                    >
                      Load & Test
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={() => setExamplesModalOpen(false)}>
              Close
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};
