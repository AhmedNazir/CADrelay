import React, { useState } from 'react';
import { Text, Input } from '@fluentui/react-components';
import { Search16Regular } from '@fluentui/react-icons';
import { useUIStore } from '../../store/uiStore';
import type { ComponentType } from '../../store/canvasStore';
import { ProtectionIcon } from '../symbols/ProtectionIcons';
import styles from './ComponentPalette.module.css';

interface PaletteItem {
  type: ComponentType;
  label: string;
  symbol: string;
  color?: string;
  desc: string;
}

const PROTECTION_ITEMS: PaletteItem[] = [
  { type: 'PHASE_FAILURE', label: 'Phase Failure', symbol: '△', desc: 'Phase Failure / Sequence Relay' },
  { type: 'FUSE_1P', label: 'Fuse 1P', symbol: 'FU1', desc: 'Single-Pole Fuse' },
  { type: 'FUSE_2P', label: 'Fuse 2P', symbol: 'FU2', desc: 'Two-Pole Fuse' },
  { type: 'FUSE_3P', label: 'Fuse 3P', symbol: 'FU3', desc: 'Three-Pole Fuse' },
  { type: 'FUSE_4P', label: 'Fuse 4P', symbol: 'FU4', desc: 'Four-Pole Fuse (3P+N)' },
  { type: 'OVERLOAD_1P', label: 'Overload 1P', symbol: 'FR1', desc: 'Thermal Overload Relay 1P' },
  { type: 'OVERLOAD_2P', label: 'Overload 2P', symbol: 'FR2', desc: 'Thermal Overload Relay 2P' },
  { type: 'OVERLOAD_3P', label: 'Overload 3P', symbol: 'FR3', desc: 'Thermal Overload Relay 3P' },
  { type: 'FUSE_DISC_1P', label: 'Fuse Disc. 1P', symbol: 'FD1', desc: 'Fuse Disconnector 1P' },
  { type: 'FUSE_DISC_1PN', label: 'Fuse Disc. 1P+N', symbol: 'FD1N', desc: 'Fuse Disconnector 1P+N' },
  { type: 'FUSE_DISC_2P', label: 'Fuse Disc. 2P', symbol: 'FD2', desc: 'Fuse Disconnector 2P' },
  { type: 'FUSE_DISC_3P', label: 'Fuse Disc. 3P', symbol: 'FD3', desc: 'Fuse Disconnector 3P' },
  { type: 'FUSE_DISC_3PN', label: 'Fuse Disc. 3P+N', symbol: 'FD3N', desc: 'Fuse Disconnector 3P+N' },
  { type: 'FUSE_DISC_4P', label: 'Fuse Disc. 4P', symbol: 'FD4', desc: 'Fuse Disconnector 4P' },
  { type: 'ISOLATOR_1P', label: 'Isolator 1P', symbol: 'QS1', desc: 'Isolator / Disconnector 1P' },
  { type: 'ISOLATOR_2P', label: 'Isolator 2P', symbol: 'QS2', desc: 'Isolator / Disconnector 2P' },
  { type: 'ISOLATOR_3P', label: 'Isolator 3P', symbol: 'QS3', desc: 'Isolator / Disconnector 3P' },
  { type: 'ISOLATOR_4P', label: 'Isolator 4P', symbol: 'QS4', desc: 'Isolator / Disconnector 4P' },
  { type: 'MCB_1P', label: 'MCB 1P', symbol: 'MCB1', desc: 'Miniature Circuit Breaker 1P' },
  { type: 'MCB_2P', label: 'MCB 2P', symbol: 'MCB2', desc: 'Miniature Circuit Breaker 2P' },
  { type: 'MCB_3P', label: 'MCB 3P', symbol: 'MCB3', desc: 'Miniature Circuit Breaker 3P' },
  { type: 'MCB_4P', label: 'MCB 4P', symbol: 'MCB4', desc: 'Miniature Circuit Breaker 4P' },
  { type: 'MCCB_1P', label: 'MCCB 1P', symbol: 'MCCB1', desc: 'Thermal-Magnetic Breaker / MCCB 1P' },
  { type: 'MCCB_2P', label: 'MCCB 2P', symbol: 'MCCB2', desc: 'Thermal-Magnetic Breaker / MCCB 2P' },
  { type: 'MCCB_3P', label: 'MCCB 3P', symbol: 'MCCB3', desc: 'Thermal-Magnetic Breaker / MCCB 3P' },
  { type: 'MCCB_4P', label: 'MCCB 4P', symbol: 'MCCB4', desc: 'Thermal-Magnetic Breaker / MCCB 4P' },
  { type: 'MAG_CB_1P', label: 'Magnetic CB 1P', symbol: 'MAG1', desc: 'Magnetic Circuit Breaker 1P' },
  { type: 'MAG_CB_2P', label: 'Magnetic CB 2P', symbol: 'MAG2', desc: 'Magnetic Circuit Breaker 2P' },
  { type: 'MAG_CB_3P', label: 'Magnetic CB 3P', symbol: 'MAG3', desc: 'Magnetic Circuit Breaker 3P' },
  { type: 'MAG_CB_4P', label: 'Magnetic CB 4P', symbol: 'MAG4', desc: 'Magnetic Circuit Breaker 4P' },
  { type: 'RCD_2P', label: 'RCD / RCCB 2P', symbol: 'RCD2', desc: 'Residual Current Circuit Breaker 2P' },
  { type: 'RCD_4P', label: 'RCD / RCCB 4P', symbol: 'RCD4', desc: 'Residual Current Circuit Breaker 4P' },
  { type: 'RCBO_1PN', label: 'RCBO 1P+N', symbol: 'RCBO1N', desc: 'RCBO 1P+N (Overload + Residual)' },
  { type: 'RCBO_2P', label: 'RCBO 2P', symbol: 'RCBO2', desc: 'RCBO 2P' },
  { type: 'RCBO_3P', label: 'RCBO 3P', symbol: 'RCBO3', desc: 'RCBO 3P' },
  { type: 'RCBO_4P', label: 'RCBO 4P', symbol: 'RCBO4', desc: 'RCBO 4P' },
];

const CATEGORIES: { title: string; items: PaletteItem[]; isGrid?: boolean }[] = [
  {
    title: '⚡ Power Sources',
    items: [
      { type: 'POWER_DC_POS', label: 'DC Positive (+)', symbol: '| +', color: '#e91e63', desc: 'DC Positive Supply (+)' },
      { type: 'POWER_DC_NEG', label: 'DC Negative (-)', symbol: '- |', color: '#37474f', desc: 'DC Negative Return (-)' },
      { type: 'POWER_DC_PE', label: 'DC Earthing', symbol: '⏚ DC', color: '#546e7a', desc: 'DC Ground / Chassis Earth' },
      { type: 'DC_BATTERY', label: 'DC Battery', symbol: '🔋 +|-', color: '#e91e63', desc: 'DC Battery Source (+ / -)' },
      { type: 'POWER_RAIL_L1', label: 'AC L1', symbol: '| L1', color: '#d32f2f', desc: 'AC Phase 1 (L1)' },
      { type: 'POWER_RAIL_L2', label: 'AC L2', symbol: '| L2', color: '#ef6c00', desc: 'AC Phase 2 (L2)' },
      { type: 'POWER_RAIL_L3', label: 'AC L3', symbol: '| L3', color: '#6a1b9a', desc: 'AC Phase 3 (L3)' },
      { type: 'POWER_AC_N', label: 'AC Neutral', symbol: 'N |', color: '#1565c0', desc: 'AC Neutral (N)' },
      { type: 'POWER_RAIL_PE', label: 'AC Earthing PE', symbol: '⏚ PE', color: '#388e3c', desc: 'AC Protective Earth (PE)' },
      { type: 'POWER_AC_1P_N', label: 'AC 1-Ph + N', symbol: '1~+N', color: '#d32f2f', desc: 'AC 1 Phase + Neutral (L1, N)' },
      { type: 'POWER_AC_3P', label: 'AC 3-Ph L1-L2-L3', symbol: '3~', color: '#6a1b9a', desc: 'AC 3 Phase (L1, L2, L3)' },
      { type: 'POWER_AC_3P_N', label: 'AC 3-Ph + N', symbol: '3~+N', color: '#6a1b9a', desc: 'AC 3 Phase + Neutral (L1, L2, L3, N)' },
      { type: 'POWER_AC_3P_N_PE', label: 'AC 3-Ph + N + PE', symbol: '3~NPE', color: '#388e3c', desc: 'AC 3 Phase + Neutral + Earthing' },
      { type: 'INVERTER_1P', label: 'Inverter DC→AC 1~', symbol: '=/1~', color: '#0078d4', desc: 'Inverter DC to AC Single Phase' },
      { type: 'INVERTER_3P', label: 'Inverter DC→AC 3~', symbol: '=/3~', color: '#0078d4', desc: 'Inverter DC to AC 3 Phase' },
      { type: 'GENERATOR_3P', label: 'Generator 3~ (C1-C2)', symbol: '⒢ 3~', color: '#d97706', desc: '3-Phase Generator with C1-C2 Auto-Start' },
    ],
  },
  {
    title: '🛡️ Protections',
    items: PROTECTION_ITEMS,
    isGrid: true,
  },
  {
    title: '🔘 Pushbuttons & Switches',
    items: [
      { type: 'PUSHBUTTON_NO', label: 'PB Start (NO)', symbol: '⊙ NO', desc: 'Normally Open Pushbutton' },
      { type: 'PUSHBUTTON_NC', label: 'PB Stop (NC)', symbol: '⊗ NC', desc: 'Normally Closed Pushbutton' },
      { type: 'EMERGENCY_STOP', label: 'Emergency Stop', symbol: '🛑 E-Stop', color: '#d32f2f', desc: 'Mushroom Head E-Stop (Latching NC)' },
      { type: 'SWITCH_TOGGLE', label: 'Switch 1P', symbol: '—/ —', desc: '1-Pole Maintained Switch' },
      { type: 'SWITCH_2P', label: 'Switch 2P', symbol: '2P SW', desc: '2-Pole Maintained Switch' },
      { type: 'SWITCH_3P', label: 'Switch 3P', symbol: '3P SW', desc: '3-Pole Maintained Switch' },
      { type: 'THERMAL_OVERLOAD', label: 'Overload NC (95-96)', symbol: '—[U]—', desc: 'Thermal Overload Aux Contact (95-96)' },
    ],
  },
  {
    title: '🔀 Contacts & Contactors',
    items: [
      { type: 'NO_CONTACT', label: 'NO Contact', symbol: '—| |—', desc: 'Normally Open Relay Contact' },
      { type: 'NC_CONTACT', label: 'NC Contact', symbol: '—|/|—', desc: 'Normally Closed Relay Contact' },
      { type: 'TIMER_NO_CONTACT', label: 'Timer NO Contact', symbol: '—| ⌢ |—', desc: 'Timed-Close NO Contact' },
      { type: 'TIMER_NC_CONTACT', label: 'Timer NC Contact', symbol: '—|/⌢|—', desc: 'Timed-Open NC Contact' },
      { type: 'CONTACTOR_1P', label: 'Contactor 1P', symbol: 'KM 1P', desc: '1-Pole Power Contactor (Linked to KM)' },
      { type: 'CONTACTOR_2P', label: 'Contactor 2P', symbol: 'KM 2P', desc: '2-Pole Power Contactor (Linked to KM)' },
      { type: 'CONTACTOR_3P', label: 'Contactor 3P', symbol: 'KM 3P', desc: '3-Pole Power Contactor (Linked to KM)' },
      { type: 'CONTACTOR_4P', label: 'Contactor 4P', symbol: 'KM 4P', desc: '4-Pole Power Contactor (Linked to KM)' },
    ],
  },
  {
    title: '🔵 Coils & Timers',
    items: [
      { type: 'COIL', label: 'Contactor Coil', symbol: '—[KM]—', desc: 'Standard Contactor / Relay Coil' },
      { type: 'COIL_SET', label: 'Set Latch Coil', symbol: '—[ S ]—', desc: 'Latching Coil' },
      { type: 'COIL_RESET', label: 'Reset Coil', symbol: '—[ R ]—', desc: 'Unlatching Coil' },
      { type: 'TIMER_TON', label: 'ON-Delay (TON)', symbol: '⏱ TON', desc: 'Timer ON-Delay with Countdown' },
      { type: 'TIMER_TOF', label: 'OFF-Delay (TOF)', symbol: '⏳ TOF', desc: 'Timer OFF-Delay' },
    ],
  },
  {
    title: '💡 Motors & Loads',
    items: [
      { type: 'LAMP', label: 'Indicator Lamp', symbol: '💡 Lamp', color: '#00e676', desc: 'Pilot Indicator Light' },
      { type: 'MOTOR_1P', label: '1~ AC Motor', symbol: '⒨ 1~', desc: 'Single Phase Motor (2-Terminal)' },
      { type: 'MOTOR_3P', label: '3~ AC Motor (Ctrl)', symbol: '⒨ 3~', desc: '3-Phase Motor Indicator (2-Terminal)' },
      { type: 'MOTOR_3P_V', label: '3~ Motor (U1,V1,W1)', symbol: '⒨ 3T', desc: '3-Phase Power Motor (U1, V1, W1)' },
      { type: 'MOTOR_3P_6T', label: '3~ Star-Delta (6T)', symbol: '⒨ 6T', desc: '3-Phase 6-Terminal Motor (U1-W2)' },
      { type: 'HEATER_1P', label: '1~ Heater / Load', symbol: '▭ 1P', desc: '1-Phase Resistive Heater Load' },
      { type: 'HEATER_3P', label: '3~ Heater / Load', symbol: '▭ 3P', desc: '3-Phase Resistive Heater Load' },
      { type: 'BUZZER', label: 'Alarm Siren', symbol: '📢 Buzzer', color: '#ff9800', desc: 'Acoustic Alarm / Horn' },
    ],
  },
];

export const ComponentPalette: React.FC = () => {
  const {
    placingComponent,
    setPlacingComponent,
    theme,
    rotatePlacing,
    togglePlacingFlipX,
    togglePlacingFlipY,
    placingRotation,
    placingFlipX,
    placingFlipY,
  } = useUIStore();
  const [filter, setFilter] = useState('');

  const q = filter.trim().toLowerCase();

  return (
    <div className={`${styles.palette} ${theme === 'dark' ? styles.dark : ''}`}>
      <div className={styles.header}>
        <Text size={200} weight="semibold">Component Library</Text>
        <div className={styles.searchBox}>
          <Input
            size="small"
            placeholder="Search symbols..."
            contentBefore={<Search16Regular />}
            value={filter}
            onChange={(_, d) => setFilter(d.value)}
          />
        </div>
      </div>

      <div className={styles.scroll}>
        {CATEGORIES.map((cat) => {
          const items = cat.items.filter(
            (it) => !q || it.label.toLowerCase().includes(q) || it.desc.toLowerCase().includes(q)
          );
          if (items.length === 0) return null;

          return (
            <div key={cat.title} className={styles.category}>
              <Text size={100} className={styles.catTitle}>
                {cat.title}
              </Text>

              <div className={styles.iconGrid}>
                {items.map((item) => {
                  const active = placingComponent === item.type;
                  return (
                    <button
                      key={item.type}
                      className={`${styles.gridTile} ${active ? styles.gridTileActive : ''}`}
                      onClick={() =>
                        active ? setPlacingComponent(null) : setPlacingComponent(item.type)
                      }
                      title={`${item.label} — ${item.desc}`}
                    >
                      <ProtectionIcon type={item.type} size={32} />
                      <span className={styles.tileLabel}>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {placingComponent && (
        <div className={styles.placingBar}>
          <Text size={100} weight="semibold" style={{ color: '#0078d4' }}>
            {placingRotation}°{placingFlipX ? ' H' : ''}{placingFlipY ? ' V' : ''}
          </Text>
          <div style={{ display: 'flex', gap: 3 }}>
            <button className={styles.rotBtn} onClick={rotatePlacing} title="Rotate 90° (R)">
              R
            </button>
            <button className={styles.rotBtn} onClick={togglePlacingFlipX} title="Mirror Horizontal (H)">
              H
            </button>
            <button className={styles.rotBtn} onClick={togglePlacingFlipY} title="Mirror Vertical (V)">
              V
            </button>
          </div>
        </div>
      )}

      <div className={styles.footer}>
        <Text size={100} style={{ color: '#888', fontSize: 10 }}>
          R: Rotate • H/V: Mirror
        </Text>
      </div>
    </div>
  );
};
