import type { CanvasComponent, WireSegment } from '../store/canvasStore';

export interface PrebuiltCircuit {
  id: string;
  name: string;
  description: string;
  category: string;
  components: CanvasComponent[];
  wires: WireSegment[];
}

/**
 * Direct-On-Line (DOL) Motor Starter with Self-Latching Contact
 * Rung 1: L1 -> Emergency Stop (NC) -> Stop PB (NC) -> Start PB (NO) [with KM1 latch in parallel] -> Contactor Coil KM1 -> Overload (NC) -> L2
 * Rung 2: KM1 (NO) -> Run Lamp (Green) -> L2
 * Rung 3: Motor M1
 */
export const DOL_STARTER: PrebuiltCircuit = {
  id: 'dol-starter',
  name: 'Direct-On-Line (DOL) Motor Starter',
  description: 'Standard motor starter with Start/Stop pushbuttons, auxiliary latching contact (seal-in), run lamp, and motor.',
  category: 'Motor Controls',
  components: [
    // Power Rails
    { id: 'pwr-l1', type: 'POWER_RAIL_L1', x: 80, y: 160, label: 'L1', rotation: 0 },
    { id: 'pwr-l2', type: 'POWER_RAIL_L2', x: 740, y: 160, label: 'L2 (N)', rotation: 0 },

    // Control Rung 1 Components
    { id: 'cb-1', type: 'CIRCUIT_BREAKER', x: 160, y: 160, label: 'QF1', rotation: 0 },
    { id: 'es-1', type: 'EMERGENCY_STOP', x: 260, y: 160, label: 'SB0 (E-Stop)', rotation: 0 },
    { id: 'pb-stop', type: 'PUSHBUTTON_NC', x: 360, y: 160, label: 'SB1 (Stop)', rotation: 0 },
    { id: 'pb-start', type: 'PUSHBUTTON_NO', x: 460, y: 160, label: 'SB2 (Start)', rotation: 0 },
    { id: 'coil-km1', type: 'COIL', x: 580, y: 160, label: 'KM1', rotation: 0 },

    // Auxiliary Latching Contact in parallel with Start button
    { id: 'contact-km1-latch', type: 'NO_CONTACT', x: 460, y: 240, label: 'KM1', rotation: 0 },

    // Run Indicator Rung 2
    { id: 'contact-km1-lamp', type: 'NO_CONTACT', x: 460, y: 320, label: 'KM1', rotation: 0 },
    { id: 'lamp-run', type: 'LAMP', x: 580, y: 320, label: 'HL1 (Run)', color: '#00e676', rotation: 0 },

    // Motor
    { id: 'motor-1', type: 'MOTOR_1P', x: 580, y: 400, label: 'M1 (Pump)', rotation: 0 },
    { id: 'contact-km1-motor', type: 'NO_CONTACT', x: 460, y: 400, label: 'KM1', rotation: 0 },
  ],
  wires: [
    // L1 to Circuit Breaker
    { id: 'w1', points: [120, 160, 120, 160] },
    // CB to E-Stop
    { id: 'w2', points: [200, 160, 220, 160] },
    // E-Stop to Stop PB
    { id: 'w3', points: [300, 160, 320, 160] },
    // Stop PB to Start PB
    { id: 'w4', points: [400, 160, 420, 160] },
    // Start PB to Coil KM1
    { id: 'w5', points: [500, 160, 540, 160] },
    // Coil KM1 to L2 rail
    { id: 'w6', points: [620, 160, 700, 160] },

    // Parallel Branch for KM1 Latch Contact
    { id: 'w7', points: [410, 160, 410, 240] },
    { id: 'w8', points: [410, 240, 420, 240] },
    { id: 'w9', points: [500, 240, 520, 240] },
    { id: 'w10', points: [520, 240, 520, 160] },

    // Rung 2: KM1 Lamp contact branch from before start
    { id: 'w11', points: [210, 160, 210, 320] },
    { id: 'w12', points: [210, 320, 420, 320] },
    { id: 'w13', points: [500, 320, 540, 320] },
    { id: 'w14', points: [620, 320, 680, 320] },
    { id: 'w15', points: [680, 320, 680, 160] },

    // Rung 3: Motor
    { id: 'w16', points: [210, 320, 210, 400] },
    { id: 'w17', points: [210, 400, 420, 400] },
    { id: 'w18', points: [500, 400, 540, 400] },
    { id: 'w19', points: [620, 400, 680, 400] },
    { id: 'w20', points: [680, 400, 680, 320] },
  ],
};

/**
 * Forward-Reverse Motor Starter with Electrical Interlocks
 */
export const FORWARD_REVERSE_STARTER: PrebuiltCircuit = {
  id: 'fwd-rev-starter',
  name: 'Forward - Reverse Motor Starter (Interlocked)',
  description: 'Reversing starter with electrical cross-interlocking to prevent simultaneous energization of Forward (KM1) and Reverse (KM2) contactors.',
  category: 'Motor Controls',
  components: [
    { id: 'pwr-l1', type: 'POWER_RAIL_L1', x: 80, y: 140, label: 'L1', rotation: 0 },
    { id: 'pwr-l2', type: 'POWER_RAIL_L2', x: 820, y: 140, label: 'L2', rotation: 0 },

    // Master Stop
    { id: 'pb-stop', type: 'PUSHBUTTON_NC', x: 180, y: 140, label: 'SB0 (Stop)', rotation: 0 },

    // Forward Branch
    { id: 'pb-fwd', type: 'PUSHBUTTON_NO', x: 300, y: 140, label: 'SB1 (FWD)', rotation: 0 },
    { id: 'km1-latch', type: 'NO_CONTACT', x: 300, y: 220, label: 'KM1', rotation: 0 },
    { id: 'km2-interlock', type: 'NC_CONTACT', x: 440, y: 140, label: 'KM2', rotation: 0 },
    { id: 'coil-km1', type: 'COIL', x: 580, y: 140, label: 'KM1', rotation: 0 },
    { id: 'lamp-fwd', type: 'LAMP', x: 700, y: 140, label: 'HL1 (FWD)', color: '#00e676', rotation: 0 },

    // Reverse Branch
    { id: 'pb-rev', type: 'PUSHBUTTON_NO', x: 300, y: 300, label: 'SB2 (REV)', rotation: 0 },
    { id: 'km2-latch', type: 'NO_CONTACT', x: 300, y: 380, label: 'KM2', rotation: 0 },
    { id: 'km1-interlock', type: 'NC_CONTACT', x: 440, y: 300, label: 'KM1', rotation: 0 },
    { id: 'coil-km2', type: 'COIL', x: 580, y: 300, label: 'KM2', rotation: 0 },
    { id: 'lamp-rev', type: 'LAMP', x: 700, y: 300, label: 'HL2 (REV)', color: '#ffb300', rotation: 0 },

    // Motor
    { id: 'motor', type: 'MOTOR_3P', x: 580, y: 440, label: 'M1 (3~ Motor)', rotation: 0 },
    { id: 'motor-contact', type: 'NO_CONTACT', x: 440, y: 440, label: 'KM1', rotation: 0 },
  ],
  wires: [
    // L1 to Stop
    { id: 'w1', points: [120, 140, 140, 140] },
    // Stop to Forward PB
    { id: 'w2', points: [220, 140, 260, 140] },
    // FWD PB to KM2 Interlock
    { id: 'w3', points: [340, 140, 400, 140] },
    // Interlock to KM1 Coil
    { id: 'w4', points: [480, 140, 540, 140] },
    // KM1 to Lamp FWD
    { id: 'w5', points: [620, 140, 660, 140] },
    // Lamp to L2
    { id: 'w6', points: [740, 140, 780, 140] },

    // KM1 Latch parallel to FWD PB
    { id: 'w7', points: [250, 140, 250, 220] },
    { id: 'w8', points: [250, 220, 260, 220] },
    { id: 'w9', points: [340, 220, 370, 220] },
    { id: 'w10', points: [370, 220, 370, 140] },

    // Feed to Reverse PB
    { id: 'w11', points: [240, 140, 240, 300] },
    { id: 'w12', points: [240, 300, 260, 300] },
    // REV PB to KM1 Interlock
    { id: 'w13', points: [340, 300, 400, 300] },
    // Interlock to KM2 Coil
    { id: 'w14', points: [480, 300, 540, 300] },
    // KM2 to Lamp REV
    { id: 'w15', points: [620, 300, 660, 300] },
    // Lamp REV return to L2
    { id: 'w16', points: [740, 300, 760, 300] },
    { id: 'w17', points: [760, 300, 760, 140] },

    // KM2 Latch
    { id: 'w18', points: [250, 300, 250, 380] },
    { id: 'w19', points: [250, 380, 260, 380] },
    { id: 'w20', points: [340, 380, 370, 380] },
    { id: 'w21', points: [370, 380, 370, 300] },

    // Motor rung
    { id: 'w22', points: [240, 300, 240, 440] },
    { id: 'w23', points: [240, 440, 400, 440] },
    { id: 'w24', points: [480, 440, 540, 440] },
    { id: 'w25', points: [620, 440, 760, 440] },
    { id: 'w26', points: [760, 440, 760, 300] },
  ],
};

/**
 * Automatic ON-Delay Timer (TON) Sequence
 */
export const TON_TIMER_CIRCUIT: PrebuiltCircuit = {
  id: 'ton-timer-circuit',
  name: 'ON-Delay (TON) Sequence Controller',
  description: 'When Start is pressed, relay KA1 latches and energizes Timer KT1. After a 3.0s delay, KT1 contact closes, activating the siren/alarm and motor.',
  category: 'Timers & Sequences',
  components: [
    { id: 'pwr-l1', type: 'POWER_RAIL_L1', x: 80, y: 160, label: 'L1', rotation: 0 },
    { id: 'pwr-l2', type: 'POWER_RAIL_L2', x: 780, y: 160, label: 'L2', rotation: 0 },

    { id: 'pb-stop', type: 'PUSHBUTTON_NC', x: 180, y: 160, label: 'Stop', rotation: 0 },
    { id: 'pb-start', type: 'PUSHBUTTON_NO', x: 300, y: 160, label: 'Start', rotation: 0 },
    { id: 'relay-ka1', type: 'COIL', x: 460, y: 160, label: 'KA1', rotation: 0 },
    { id: 'ka1-latch', type: 'NO_CONTACT', x: 300, y: 240, label: 'KA1', rotation: 0 },

    // Timer TON
    { id: 'ka1-to-timer', type: 'NO_CONTACT', x: 300, y: 320, label: 'KA1', rotation: 0 },
    { id: 'timer-kt1', type: 'TIMER_TON', x: 460, y: 320, label: 'KT1', timerDelay: 3000, rotation: 0 },

    // Delayed load
    { id: 'kt1-delayed-contact', type: 'TIMER_NO_CONTACT', x: 300, y: 400, label: 'KT1', rotation: 0 },
    { id: 'lamp-warning', type: 'LAMP', x: 460, y: 400, label: 'Alarm Lamp', color: '#f44336', rotation: 0 },
    { id: 'buzzer', type: 'BUZZER', x: 600, y: 400, label: 'Siren', rotation: 0 },
  ],
  wires: [
    { id: 'w1', points: [120, 160, 140, 160] },
    { id: 'w2', points: [220, 160, 260, 160] },
    { id: 'w3', points: [340, 160, 420, 160] },
    { id: 'w4', points: [500, 160, 740, 160] },

    // Latch KA1
    { id: 'w5', points: [250, 160, 250, 240] },
    { id: 'w6', points: [250, 240, 260, 240] },
    { id: 'w7', points: [340, 240, 380, 240] },
    { id: 'w8', points: [380, 240, 380, 160] },

    // Feed to Timer KT1
    { id: 'w9', points: [240, 160, 240, 320] },
    { id: 'w10', points: [240, 320, 260, 320] },
    { id: 'w11', points: [340, 320, 420, 320] },
    { id: 'w12', points: [500, 320, 720, 320] },
    { id: 'w13', points: [720, 320, 720, 160] },

    // Feed to Delayed Contact
    { id: 'w14', points: [240, 320, 240, 400] },
    { id: 'w15', points: [240, 400, 260, 400] },
    { id: 'w16', points: [340, 400, 420, 400] },
    { id: 'w17', points: [500, 400, 560, 400] },
    { id: 'w18', points: [640, 400, 720, 400] },
    { id: 'w19', points: [720, 400, 720, 320] },
  ],
};

export const PREBUILT_CIRCUITS: PrebuiltCircuit[] = [
  DOL_STARTER,
  FORWARD_REVERSE_STARTER,
  TON_TIMER_CIRCUIT,
];
