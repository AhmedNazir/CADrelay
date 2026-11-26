import React from 'react';
import { Toolbar, ToolbarButton, Tooltip, Text } from '@fluentui/react-components';
import { useUIStore } from '../../../store/uiStore';
import styles from './Tab.module.css';

interface ComponentButton {
  type: string;
  label: string;
  symbol: string;
  tooltip: string;
}

const powerSupplies: ComponentButton[] = [
  { type: 'POWER_DC_POS', label: 'DC +', symbol: '|+', tooltip: 'DC Positive' },
  { type: 'POWER_DC_NEG', label: 'DC -', symbol: '-|', tooltip: 'DC Negative' },
  { type: 'POWER_DC_PE', label: 'DC Earth', symbol: '⏚', tooltip: 'DC Earthing' },
  { type: 'DC_BATTERY', label: 'Battery', symbol: '🔋', tooltip: 'DC Battery' },
  { type: 'POWER_RAIL_L1', label: 'AC L1', symbol: '|L1', tooltip: 'AC Phase L1' },
  { type: 'POWER_RAIL_L2', label: 'AC L2', symbol: '|L2', tooltip: 'AC Phase L2' },
  { type: 'POWER_RAIL_L3', label: 'AC L3', symbol: '|L3', tooltip: 'AC Phase L3' },
  { type: 'POWER_AC_N', label: 'AC N', symbol: 'N|', tooltip: 'AC Neutral' },
  { type: 'POWER_RAIL_PE', label: 'AC PE', symbol: '⏚PE', tooltip: 'AC Earthing PE' },
  { type: 'POWER_AC_1P_N', label: '1~+N', symbol: '1~+N', tooltip: 'AC 1 Phase + Neutral' },
  { type: 'POWER_AC_3P', label: '3~ AC', symbol: '3~', tooltip: 'AC 3 Phase L1 L2 L3' },
  { type: 'POWER_AC_3P_N', label: '3~+N', symbol: '3~+N', tooltip: 'AC 3 Phase + Neutral' },
  { type: 'POWER_AC_3P_N_PE', label: '3~+N+PE', symbol: '3~PE', tooltip: 'AC 3 Phase + Neutral + Earthing' },
  { type: 'INVERTER_1P', label: 'Inv 1~', symbol: '=/1~', tooltip: 'Inverter DC to AC Single Phase' },
  { type: 'INVERTER_3P', label: 'Inv 3~', symbol: '=/3~', tooltip: 'Inverter DC to AC 3 Phase' },
  { type: 'GENERATOR_3P', label: 'Gen 3~', symbol: 'G3~', tooltip: 'Generator 3 Phase (C1-C2 Auto Mode)' },
];

const protectionAndSwitches: ComponentButton[] = [
  { type: 'PHASE_FAILURE', label: 'Phase Fail', symbol: '△', tooltip: 'Phase Failure / Sequence Relay' },
  { type: 'FUSE_1P', label: 'Fuse 1P', symbol: '[|]', tooltip: '1-Pole Fuse' },
  { type: 'FUSE_3P', label: 'Fuse 3P', symbol: '[|||]', tooltip: '3-Pole Fuse' },
  { type: 'OVERLOAD_3P', label: 'Overload 3P', symbol: '⊓3', tooltip: '3-Pole Thermal Overload Relay' },
  { type: 'ISOLATOR_3P', label: 'Isolator 3P', symbol: '⏦3', tooltip: '3-Pole Isolator / Disconnector' },
  { type: 'MCB_1P', label: 'MCB 1P', symbol: '×/1', tooltip: '1-Pole MCB' },
  { type: 'MCB_3P', label: 'MCB 3P', symbol: '×/3', tooltip: '3-Pole MCB' },
  { type: 'MCCB_3P', label: 'MCCB 3P', symbol: '×>3', tooltip: '3-Pole MCCB (Thermal-Magnetic)' },
  { type: 'RCD_2P', label: 'RCD 2P', symbol: '◎2', tooltip: '2-Pole RCD / RCCB' },
  { type: 'RCBO_1PN', label: 'RCBO', symbol: 'I>', tooltip: 'RCBO 1P+N' },
  { type: 'PUSHBUTTON_NO', label: 'PB Start (NO)', symbol: '⊙ NO', tooltip: 'Normally Open Pushbutton' },
  { type: 'PUSHBUTTON_NC', label: 'PB Stop (NC)', symbol: '⊗ NC', tooltip: 'Normally Closed Pushbutton' },
  { type: 'EMERGENCY_STOP', label: 'E-Stop', symbol: '🛑 E-Stop', tooltip: 'Emergency Stop Pushbutton (Latching NC)' },
  { type: 'SWITCH_TOGGLE', label: 'Toggle SW', symbol: '—/ —', tooltip: 'Maintained Selector Switch' },
];

const contacts: ComponentButton[] = [
  { type: 'NO_CONTACT', label: 'NO Contact', symbol: '—| |—', tooltip: 'Normally Open Relay / Contactor Contact' },
  { type: 'NC_CONTACT', label: 'NC Contact', symbol: '—|/|—', tooltip: 'Normally Closed Relay / Contactor Contact' },
  { type: 'TIMER_NO_CONTACT', label: 'Timer NO', symbol: '—|⌢|—', tooltip: 'Timed-Close NO Contact' },
  { type: 'TIMER_NC_CONTACT', label: 'Timer NC', symbol: '—|/⌢|—', tooltip: 'Timed-Open NC Contact' },
  { type: 'CONTACTOR_2P', label: 'KM 2P', symbol: 'KM2', tooltip: '2-Pole Power Contactor' },
  { type: 'CONTACTOR_3P', label: 'KM 3P', symbol: 'KM3', tooltip: '3-Pole Power Contactor' },
  { type: 'CONTACTOR_4P', label: 'KM 4P', symbol: 'KM4', tooltip: '4-Pole Power Contactor' },
];

const coilsAndTimers: ComponentButton[] = [
  { type: 'COIL', label: 'KM Coil', symbol: '—[KM]—', tooltip: 'Contactor / Relay Output Coil' },
  { type: 'COIL_SET', label: 'Set (S)', symbol: '—[S]—', tooltip: 'Latching Coil' },
  { type: 'COIL_RESET', label: 'Reset (R)', symbol: '—[R]—', tooltip: 'Unlatching Coil' },
  { type: 'TIMER_TON', label: 'TON Timer', symbol: '⏱ TON', tooltip: 'ON-Delay Timer' },
  { type: 'TIMER_TOF', label: 'TOF Timer', symbol: '⏳ TOF', tooltip: 'OFF-Delay Timer' },
];

const loads: ComponentButton[] = [
  { type: 'LAMP', label: 'Lamp', symbol: '💡 Lamp', tooltip: 'Pilot Indicator Lamp' },
  { type: 'MOTOR_1P', label: '1~ Motor', symbol: '⒨ 1~', tooltip: 'Single Phase AC Motor' },
  { type: 'MOTOR_3P_V', label: '3~ Motor', symbol: '⒨ 3T', tooltip: '3-Phase Motor (U1, V1, W1)' },
  { type: 'MOTOR_3P_6T', label: '6T Motor', symbol: '⒨ 6T', tooltip: '3-Phase Star-Delta Motor (6 Terminals)' },
  { type: 'HEATER_3P', label: '3~ Heater', symbol: '▭ 3P', tooltip: '3-Phase Resistive Load' },
  { type: 'BUZZER', label: 'Siren', symbol: '📢 Buzzer', tooltip: 'Acoustic Siren / Alarm' },
];

const ButtonGroup: React.FC<{ label: string; items: ComponentButton[] }> = ({ label, items }) => {
  const { setPlacingComponent, placingComponent } = useUIStore();
  return (
    <div className={styles.group}>
      <Text size={100} className={styles.groupLabel}>{label}</Text>
      <Toolbar>
        {items.map((item) => {
          const active = placingComponent === item.type;
          return (
            <Tooltip key={item.type} content={item.tooltip} relationship="label">
              <ToolbarButton
                className={`${styles.symbolBtn} ${active ? styles.symbolBtnActive : ''}`}
                onClick={() => setPlacingComponent(active ? null : item.type)}
              >
                <span className={styles.symbolIcon}>{item.symbol}</span>
                <span className={styles.symbolLabel}>{item.label}</span>
              </ToolbarButton>
            </Tooltip>
          );
        })}
      </Toolbar>
    </div>
  );
};

export const InsertTab: React.FC = () => (
  <div className={styles.tabRow}>
    <ButtonGroup label="Power Supplies" items={powerSupplies} />
    <div className={styles.divider} />
    <ButtonGroup label="Protections & Switches" items={protectionAndSwitches} />
    <div className={styles.divider} />
    <ButtonGroup label="Auxiliary Contacts" items={contacts} />
    <div className={styles.divider} />
    <ButtonGroup label="Coils & Timers" items={coilsAndTimers} />
    <div className={styles.divider} />
    <ButtonGroup label="Motors & Outputs" items={loads} />
  </div>
);
