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
} from '@fluentui/react-components';
import { Dismiss24Regular } from '@fluentui/react-icons';
import { useUIStore } from '../../store/uiStore';
import styles from './Dialogs.module.css';

export const HelpDialog: React.FC = () => {
  const { helpModalOpen, setHelpModalOpen } = useUIStore();

  return (
    <Dialog open={helpModalOpen} onOpenChange={(_, d) => setHelpModalOpen(d.open)}>
      <DialogSurface className={styles.dialogSurface}>
        <DialogTitle
          action={
            <Button
              appearance="subtle"
              icon={<Dismiss24Regular />}
              onClick={() => setHelpModalOpen(false)}
            />
          }
        >
          ⚡ CADrelay Help & Shortcuts Reference
        </DialogTitle>
        <DialogBody>
          <DialogContent>
            <div className={styles.section}>
              <Text size={300} weight="semibold">⚡ About CADrelay</Text>
              <Text size={200} style={{ marginTop: 4, display: 'block', lineHeight: 1.5 }}>
                CADrelay is a modern, high-performance web software for designing and simulating industrial electrical control circuits, relay ladder logic, and motor starters — inspired by CADe SIMU.
              </Text>
            </div>

            <div className={styles.section}>
              <Text size={300} weight="semibold">⌨️ Keyboard Shortcuts</Text>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Key</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><kbd>S</kbd></td>
                    <td>Select & Move Tool</td>
                  </tr>
                  <tr>
                    <td><kbd>W</kbd></td>
                    <td>Wire Drawing Tool (auto-orthogonal routing)</td>
                  </tr>
                  <tr>
                    <td><kbd>R</kbd></td>
                    <td>Rotate Selected Component or Placing Preview (90°)</td>
                  </tr>
                  <tr>
                    <td><kbd>H</kbd> / <kbd>V</kbd></td>
                    <td>Mirror Horizontally / Vertically (Selected or Placing Preview)</td>
                  </tr>
                  <tr>
                    <td><kbd>Delete</kbd> / <kbd>Backspace</kbd></td>
                    <td>Delete Selected Component or Wire</td>
                  </tr>
                  <tr>
                    <td><kbd>Ctrl + D</kbd></td>
                    <td>Duplicate Selected Component or Wire</td>
                  </tr>
                  <tr>
                    <td><kbd>Ctrl + A</kbd></td>
                    <td>Select All Components and Wires</td>
                  </tr>
                  <tr>
                    <td><kbd>Ctrl + Z</kbd></td>
                    <td>Undo</td>
                  </tr>
                  <tr>
                    <td><kbd>Ctrl + Y</kbd></td>
                    <td>Redo</td>
                  </tr>
                  <tr>
                    <td><kbd>Escape</kbd> / <kbd>Right Click</kbd></td>
                    <td>Cancel Current Operation / Return to Select</td>
                  </tr>
                  <tr>
                    <td><kbd>+</kbd> / <kbd>-</kbd> / <kbd>Mouse Wheel</kbd></td>
                    <td>Zoom In / Out</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className={styles.section}>
              <Text size={300} weight="semibold">🔧 How to Simulate</Text>
              <ul className={styles.list}>
                <li>Click <strong>Simulate ▶ Play</strong> in the Ribbon to start the live electrical engine.</li>
                <li>Wires connected to live voltage glow green 🟢 with animated glow.</li>
                <li>Click <strong>Pushbuttons</strong> and <strong>Switches</strong> directly on the canvas to toggle them during simulation!</li>
                <li>Coils link to auxiliary contacts matching their Tag (e.g. coil <code>KM1</code> closes all <code>KM1</code> NO contacts).</li>
                <li>Motors <code>M1</code> and <code>M3~</code> show an animated rotating rotor when energized.</li>
              </ul>
            </div>
          </DialogContent>
          <DialogActions>
            <Button appearance="primary" onClick={() => setHelpModalOpen(false)}>
              Got it!
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};
