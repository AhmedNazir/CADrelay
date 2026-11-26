import React from 'react';
import type { ComponentType } from '../../store/canvasStore';

interface Props {
  type: ComponentType;
  size?: number;
  color?: string;
}

/** Returns x coordinates for poles in a 48x48 viewBox */
function getXs(count: number): number[] {
  if (count === 1) return [24];
  if (count === 2) return [15, 33];
  if (count === 3) return [12, 24, 36];
  return [9, 19, 29, 39];
}

export const ProtectionIcon: React.FC<Props> = ({ type, size = 36, color = 'currentColor' }) => {
  const sw = 1.6;

  const renderInner = () => {
    switch (type) {
      /* ── Power Sources ────────────────────────────────── */
      case 'POWER_DC_POS':
        return (
          <>
            <line x1={24} y1={6} x2={24} y2={42} stroke="#e91e63" strokeWidth={2.8} />
            <line x1={24} y1={24} x2={42} y2={24} stroke="#e91e63" strokeWidth={sw} />
            <text x={11} y={28} fontSize={12} fontWeight="bold" textAnchor="middle" fill="#e91e63">+</text>
          </>
        );
      case 'POWER_DC_NEG':
        return (
          <>
            <line x1={24} y1={6} x2={24} y2={42} stroke={color} strokeWidth={2.8} />
            <line x1={6} y1={24} x2={24} y2={24} stroke={color} strokeWidth={sw} />
            <text x={35} y={28} fontSize={14} fontWeight="bold" textAnchor="middle" fill={color}>-</text>
          </>
        );
      case 'POWER_DC_PE':
        return (
          <>
            <line x1={6} y1={24} x2={26} y2={24} stroke={color} strokeWidth={sw} />
            <line x1={26} y1={13} x2={26} y2={35} stroke={color} strokeWidth={2.2} />
            <line x1={32} y1={17} x2={32} y2={31} stroke={color} strokeWidth={1.8} />
            <line x1={38} y1={21} x2={38} y2={27} stroke={color} strokeWidth={1.6} />
          </>
        );
      case 'DC_BATTERY':
        return (
          <>
            <line x1={20} y1={8} x2={20} y2={19} stroke="#e91e63" strokeWidth={sw} />
            <line x1={20} y1={19} x2={42} y2={19} stroke="#e91e63" strokeWidth={sw} />
            <line x1={12} y1={21} x2={28} y2={21} stroke="#e91e63" strokeWidth={1.8} />
            <line x1={16} y1={26} x2={24} y2={26} stroke={color} strokeWidth={3} />
            <line x1={12} y1={31} x2={28} y2={31} stroke="#e91e63" strokeWidth={1.8} />
            <line x1={16} y1={36} x2={24} y2={36} stroke={color} strokeWidth={3} />
            <line x1={20} y1={36} x2={42} y2={36} stroke={color} strokeWidth={sw} />
            <text x={37} y={16} fontSize={9} fontWeight="bold" fill="#e91e63">+</text>
            <text x={38} y={44} fontSize={10} fontWeight="bold" fill={color}>-</text>
          </>
        );
      case 'POWER_RAIL_L1':
      case 'POWER_RAIL_L2':
      case 'POWER_RAIL_L3': {
        const lbl = type === 'POWER_RAIL_L1' ? 'L1' : type === 'POWER_RAIL_L2' ? 'L2' : 'L3';
        const c = type === 'POWER_RAIL_L1' ? '#d32f2f' : type === 'POWER_RAIL_L2' ? '#ef6c00' : '#6a1b9a';
        return (
          <>
            <line x1={24} y1={6} x2={24} y2={42} stroke={c} strokeWidth={2.8} />
            <line x1={24} y1={24} x2={42} y2={24} stroke={c} strokeWidth={sw} />
            <text x={11} y={28} fontSize={10} fontWeight="bold" textAnchor="middle" fill={c}>{lbl}</text>
          </>
        );
      }
      case 'POWER_AC_N':
        return (
          <>
            <line x1={24} y1={6} x2={24} y2={42} stroke="#1565c0" strokeWidth={2.8} />
            <line x1={6} y1={24} x2={24} y2={24} stroke="#1565c0" strokeWidth={sw} />
            <text x={35} y={28} fontSize={11} fontWeight="bold" textAnchor="middle" fill="#1565c0">N</text>
          </>
        );
      case 'POWER_RAIL_PE':
        return (
          <>
            <line x1={22} y1={6} x2={22} y2={42} stroke="#388e3c" strokeWidth={2.8} />
            <line x1={6} y1={24} x2={30} y2={24} stroke="#388e3c" strokeWidth={sw} />
            <line x1={30} y1={15} x2={30} y2={33} stroke="#388e3c" strokeWidth={2} />
            <line x1={35} y1={18} x2={35} y2={30} stroke="#388e3c" strokeWidth={1.8} />
            <line x1={40} y1={21} x2={40} y2={27} stroke="#388e3c" strokeWidth={1.6} />
          </>
        );
      case 'POWER_AC_1P_N':
        return (
          <>
            <rect x={8} y={10} width={22} height={28} rx={2} fill="none" stroke="#d32f2f" strokeWidth={sw} />
            <text x={19} y={27} fontSize={8} fontWeight="bold" textAnchor="middle" fill="#d32f2f">1~N</text>
            <line x1={30} y1={17} x2={42} y2={17} stroke="#d32f2f" strokeWidth={sw} />
            <line x1={30} y1={31} x2={42} y2={31} stroke="#1565c0" strokeWidth={sw} />
          </>
        );
      case 'POWER_AC_3P':
      case 'POWER_AC_3P_N':
      case 'POWER_AC_3P_N_PE': {
        const lines = type === 'POWER_AC_3P' ? 3 : type === 'POWER_AC_3P_N' ? 4 : 5;
        const ys = lines === 3 ? [15, 24, 33] : lines === 4 ? [12, 20, 28, 36] : [10, 17, 24, 31, 38];
        return (
          <>
            <rect x={7} y={7} width={23} height={34} rx={2} fill="none" stroke="#6a1b9a" strokeWidth={sw} />
            <text x={18.5} y={27} fontSize={8.5} fontWeight="bold" textAnchor="middle" fill="#6a1b9a">3~</text>
            {ys.map((y, i) => (
              <line key={i} x1={30} y1={y} x2={42} y2={y} stroke={i === 3 ? '#1565c0' : i === 4 ? '#388e3c' : '#6a1b9a'} strokeWidth={sw} />
            ))}
          </>
        );
      }
      case 'INVERTER_1P':
      case 'INVERTER_3P':
        return (
          <>
            <line x1={4} y1={16} x2={12} y2={16} stroke="#e91e63" strokeWidth={sw} />
            <line x1={4} y1={32} x2={12} y2={32} stroke={color} strokeWidth={sw} />
            <rect x={12} y={10} width={24} height={28} rx={2} fill="none" stroke={color} strokeWidth={sw} />
            <line x1={12} y1={38} x2={36} y2={10} stroke={color} strokeWidth={1.2} />
            <text x={18} y={20} fontSize={8} fontWeight="bold" textAnchor="middle" fill="#e91e63">=</text>
            <text x={29} y={34} fontSize={7.5} fontWeight="bold" textAnchor="middle" fill={color}>
              {type === 'INVERTER_1P' ? '1~' : '3~'}
            </text>
            <line x1={36} y1={16} x2={44} y2={16} stroke="#d32f2f" strokeWidth={sw} />
            {type === 'INVERTER_3P' && <line x1={36} y1={24} x2={44} y2={24} stroke="#ef6c00" strokeWidth={sw} />}
            <line x1={36} y1={32} x2={44} y2={32} stroke={type === 'INVERTER_1P' ? '#1565c0' : '#6a1b9a'} strokeWidth={sw} />
          </>
        );
      case 'GENERATOR_3P':
        return (
          <>
            <line x1={4} y1={16} x2={13} y2={16} stroke={color} strokeWidth={1.4} />
            <line x1={4} y1={32} x2={13} y2={32} stroke={color} strokeWidth={1.4} />
            <circle cx={24} cy={24} r={12} fill="none" stroke={color} strokeWidth={sw} />
            <text x={24} y={24} fontSize={9.5} fontWeight="bold" textAnchor="middle" fill={color}>G</text>
            <text x={24} y={32} fontSize={6.5} fontWeight="bold" textAnchor="middle" fill={color}>3~</text>
            <line x1={34} y1={14} x2={44} y2={14} stroke="#d32f2f" strokeWidth={sw} />
            <line x1={36} y1={21} x2={44} y2={21} stroke="#ef6c00" strokeWidth={sw} />
            <line x1={36} y1={28} x2={44} y2={28} stroke="#6a1b9a" strokeWidth={sw} />
            <line x1={34} y1={35} x2={44} y2={35} stroke="#1565c0" strokeWidth={sw} />
          </>
        );

      /* ── Pushbuttons & Switches ───────────────────────── */
      case 'PUSHBUTTON_NO':
        return (
          <>
            <line x1={6} y1={24} x2={17} y2={24} stroke={color} strokeWidth={sw} />
            <line x1={17} y1={16} x2={17} y2={32} stroke={color} strokeWidth={sw} />
            <line x1={31} y1={16} x2={31} y2={32} stroke={color} strokeWidth={sw} />
            <line x1={19} y1={11} x2={29} y2={11} stroke={color} strokeWidth={2.2} />
            <line x1={24} y1={11} x2={24} y2={18} stroke={color} strokeWidth={1.4} />
            <line x1={31} y1={24} x2={42} y2={24} stroke={color} strokeWidth={sw} />
          </>
        );
      case 'PUSHBUTTON_NC':
        return (
          <>
            <line x1={6} y1={24} x2={17} y2={24} stroke={color} strokeWidth={sw} />
            <line x1={17} y1={16} x2={17} y2={32} stroke={color} strokeWidth={sw} />
            <line x1={31} y1={16} x2={31} y2={32} stroke={color} strokeWidth={sw} />
            <line x1={17} y1={16} x2={31} y2={16} stroke={color} strokeWidth={sw} />
            <line x1={19} y1={10} x2={29} y2={10} stroke={color} strokeWidth={2.2} />
            <line x1={24} y1={10} x2={24} y2={16} stroke={color} strokeWidth={1.4} />
            <line x1={31} y1={24} x2={42} y2={24} stroke={color} strokeWidth={sw} />
          </>
        );
      case 'EMERGENCY_STOP':
        return (
          <>
            <line x1={6} y1={26} x2={17} y2={26} stroke={color} strokeWidth={sw} />
            <line x1={17} y1={18} x2={17} y2={34} stroke={color} strokeWidth={sw} />
            <line x1={31} y1={18} x2={31} y2={34} stroke={color} strokeWidth={sw} />
            <line x1={17} y1={18} x2={31} y2={18} stroke={color} strokeWidth={sw} />
            <path d="M 16,15 A 8,8 0 0,1 32,15 Z" fill="#d32f2f" />
            <line x1={31} y1={26} x2={42} y2={26} stroke={color} strokeWidth={sw} />
          </>
        );
      case 'SWITCH_TOGGLE':
        return (
          <>
            <line x1={6} y1={26} x2={16} y2={26} stroke={color} strokeWidth={sw} />
            <circle cx={16} cy={26} r={2} fill={color} />
            <circle cx={32} cy={26} r={2} fill={color} />
            <line x1={16} y1={26} x2={30} y2={15} stroke={color} strokeWidth={sw} />
            <line x1={32} y1={26} x2={42} y2={26} stroke={color} strokeWidth={sw} />
          </>
        );
      case 'THERMAL_OVERLOAD':
        return (
          <>
            <line x1={6} y1={24} x2={17} y2={24} stroke={color} strokeWidth={sw} />
            <line x1={17} y1={16} x2={17} y2={32} stroke={color} strokeWidth={sw} />
            <line x1={31} y1={16} x2={31} y2={32} stroke={color} strokeWidth={sw} />
            <line x1={17} y1={16} x2={31} y2={16} stroke={color} strokeWidth={sw} />
            <polyline points="20,16 20,11 28,11 28,16" fill="none" stroke={color} strokeWidth={1.4} />
            <line x1={31} y1={24} x2={42} y2={24} stroke={color} strokeWidth={sw} />
          </>
        );

      /* ── Auxiliary Contacts ───────────────────────────── */
      case 'NO_CONTACT':
        return (
          <>
            <line x1={6} y1={24} x2={18} y2={24} stroke={color} strokeWidth={sw} />
            <line x1={18} y1={14} x2={18} y2={34} stroke={color} strokeWidth={2} />
            <line x1={30} y1={14} x2={30} y2={34} stroke={color} strokeWidth={2} />
            <line x1={30} y1={24} x2={42} y2={24} stroke={color} strokeWidth={sw} />
          </>
        );
      case 'NC_CONTACT':
        return (
          <>
            <line x1={6} y1={24} x2={18} y2={24} stroke={color} strokeWidth={sw} />
            <line x1={18} y1={14} x2={18} y2={34} stroke={color} strokeWidth={2} />
            <line x1={30} y1={14} x2={30} y2={34} stroke={color} strokeWidth={2} />
            <line x1={18} y1={13} x2={30} y2={13} stroke={color} strokeWidth={1.8} />
            <line x1={30} y1={24} x2={42} y2={24} stroke={color} strokeWidth={sw} />
          </>
        );
      case 'TIMER_NO_CONTACT':
        return (
          <>
            <line x1={6} y1={24} x2={18} y2={24} stroke={color} strokeWidth={sw} />
            <line x1={18} y1={14} x2={18} y2={34} stroke={color} strokeWidth={2} />
            <line x1={30} y1={14} x2={30} y2={34} stroke={color} strokeWidth={2} />
            <path d="M 19,14 A 6,6 0 0,1 29,14" fill="none" stroke={color} strokeWidth={1.5} />
            <line x1={30} y1={24} x2={42} y2={24} stroke={color} strokeWidth={sw} />
          </>
        );
      case 'TIMER_NC_CONTACT':
        return (
          <>
            <line x1={6} y1={24} x2={18} y2={24} stroke={color} strokeWidth={sw} />
            <line x1={18} y1={14} x2={18} y2={34} stroke={color} strokeWidth={2} />
            <line x1={30} y1={14} x2={30} y2={34} stroke={color} strokeWidth={2} />
            <line x1={18} y1={13} x2={30} y2={13} stroke={color} strokeWidth={1.8} />
            <path d="M 19,13 A 6,6 0 0,1 29,13" fill="none" stroke={color} strokeWidth={1.5} />
            <line x1={30} y1={24} x2={42} y2={24} stroke={color} strokeWidth={sw} />
          </>
        );

      /* ── Coils & Timers ───────────────────────────────── */
      case 'COIL':
      case 'COIL_SET':
      case 'COIL_RESET': {
        const lbl = type === 'COIL' ? 'KM' : type === 'COIL_SET' ? 'S' : 'R';
        return (
          <>
            <line x1={6} y1={24} x2={14} y2={24} stroke={color} strokeWidth={sw} />
            <rect x={14} y={15} width={20} height={18} rx={2} fill="none" stroke={color} strokeWidth={sw} />
            <text x={24} y={27} fontSize={8.5} fontWeight="bold" textAnchor="middle" fill={color}>{lbl}</text>
            <line x1={34} y1={24} x2={42} y2={24} stroke={color} strokeWidth={sw} />
          </>
        );
      }
      case 'TIMER_TON':
      case 'TIMER_TOF':
        return (
          <>
            <line x1={5} y1={24} x2={11} y2={24} stroke={color} strokeWidth={sw} />
            <rect x={11} y={12} width={26} height={24} rx={2} fill="none" stroke={color} strokeWidth={sw} />
            <text x={24} y={27} fontSize={8.5} fontWeight="bold" textAnchor="middle" fill={color}>
              {type === 'TIMER_TON' ? 'TON' : 'TOF'}
            </text>
            <line x1={37} y1={24} x2={43} y2={24} stroke={color} strokeWidth={sw} />
          </>
        );

      /* ── Motors & Loads ───────────────────────────────── */
      case 'LAMP':
        return (
          <>
            <line x1={6} y1={24} x2={14} y2={24} stroke={color} strokeWidth={sw} />
            <circle cx={24} cy={24} r={10} fill="none" stroke={color} strokeWidth={sw} />
            <line x1={17} y1={17} x2={31} y2={31} stroke={color} strokeWidth={1.4} />
            <line x1={17} y1={31} x2={31} y2={17} stroke={color} strokeWidth={1.4} />
            <line x1={34} y1={24} x2={42} y2={24} stroke={color} strokeWidth={sw} />
          </>
        );
      case 'MOTOR_1P':
      case 'MOTOR_3P':
        return (
          <>
            <line x1={5} y1={24} x2={12} y2={24} stroke={color} strokeWidth={sw} />
            <circle cx={24} cy={24} r={12} fill="none" stroke={color} strokeWidth={sw} />
            <text x={24} y={24} fontSize={10} fontWeight="bold" textAnchor="middle" fill={color}>M</text>
            <text x={24} y={32} fontSize={6.5} fontWeight="bold" textAnchor="middle" fill={color}>
              {type === 'MOTOR_1P' ? '1~' : '3~'}
            </text>
            <line x1={36} y1={24} x2={43} y2={24} stroke={color} strokeWidth={sw} />
          </>
        );
      case 'BUZZER':
        return (
          <>
            <line x1={6} y1={24} x2={16} y2={24} stroke={color} strokeWidth={sw} />
            <path d="M 26,12 A 11,11 0 0,0 26,36 Z" fill="none" stroke={color} strokeWidth={sw} />
            <path d="M 30,17 A 7,7 0 0,1 30,31" fill="none" stroke="#ff9800" strokeWidth={1.4} />
            <line x1={26} y1={24} x2={42} y2={24} stroke={color} strokeWidth={sw} />
          </>
        );

      case 'PHASE_FAILURE':
        return (
          <>
            <line x1={14} y1={8} x2={14} y2={16} stroke={color} strokeWidth={sw} />
            <line x1={24} y1={8} x2={24} y2={16} stroke={color} strokeWidth={sw} />
            <line x1={34} y1={8} x2={34} y2={16} stroke={color} strokeWidth={sw} />
            <rect x={8} y={16} width={32} height={18} fill="none" stroke={color} strokeWidth={sw} />
            <polygon points="24,20 18,31 30,31" fill="none" stroke={color} strokeWidth={sw} />
          </>
        );

      case 'FUSE_1P':
      case 'FUSE_2P':
      case 'FUSE_3P':
      case 'FUSE_4P': {
        const count = type === 'FUSE_1P' ? 1 : type === 'FUSE_2P' ? 2 : type === 'FUSE_3P' ? 3 : 4;
        const xs = getXs(count);
        const w = count >= 4 ? 5 : 7;
        return xs.map((x, i) => (
          <g key={i}>
            <line x1={x} y1={4} x2={x} y2={44} stroke={color} strokeWidth={sw} />
            <rect x={x - w / 2} y={15} width={w} height={18} fill="none" stroke={color} strokeWidth={sw} />
          </g>
        ));
      }

      case 'OVERLOAD_1P':
      case 'OVERLOAD_2P':
      case 'OVERLOAD_3P': {
        const count = type === 'OVERLOAD_1P' ? 1 : type === 'OVERLOAD_2P' ? 2 : 3;
        const xs = getXs(count);
        return (
          <>
            {xs.map((x, i) => (
              <g key={i}>
                <line x1={x} y1={4} x2={x} y2={44} stroke={color} strokeWidth={sw} />
                <polyline
                  points={`${x - 4},18 ${x + 5},18 ${x + 5},23 ${x - 2},23 ${x - 2},28 ${x + 5},28 ${x + 5},32 ${x - 4},32`}
                  fill="none"
                  stroke={color}
                  strokeWidth={1.3}
                />
              </g>
            ))}
            {count > 1 && (
              <line x1={xs[0] - 4} y1={25} x2={xs[xs.length - 1] + 5} y2={25} stroke={color} strokeWidth={1.2} strokeDasharray="2,2" />
            )}
          </>
        );
      }

      case 'FUSE_DISC_1P':
      case 'FUSE_DISC_1PN':
      case 'FUSE_DISC_2P':
      case 'FUSE_DISC_3P':
      case 'FUSE_DISC_3PN':
      case 'FUSE_DISC_4P': {
        const count =
          type === 'FUSE_DISC_1P' ? 1 :
          type === 'FUSE_DISC_1PN' || type === 'FUSE_DISC_2P' ? 2 :
          type === 'FUSE_DISC_3P' ? 3 : 4;
        const hasNeutralLast = type === 'FUSE_DISC_1PN' || type === 'FUSE_DISC_3PN';
        const xs = getXs(count);
        return (
          <>
            {xs.map((x, i) => {
              const isNeutral = hasNeutralLast && i === xs.length - 1;
              return (
                <g key={i}>
                  <line x1={x} y1={6} x2={x} y2={13} stroke={color} strokeWidth={sw} />
                  <line x1={x - 3} y1={13} x2={x + 3} y2={13} stroke={color} strokeWidth={sw} />
                  <line x1={x - 5} y1={16} x2={x} y2={33} stroke={color} strokeWidth={sw} />
                  {!isNeutral && (
                    <rect
                      x={x - 5.5}
                      y={19}
                      width={5}
                      height={11}
                      fill="none"
                      stroke={color}
                      strokeWidth={1.3}
                      transform={`rotate(-16 ${x - 3} 24)`}
                    />
                  )}
                  <line x1={x} y1={33} x2={x} y2={44} stroke={color} strokeWidth={sw} />
                </g>
              );
            })}
            {count > 1 && (
              <line x1={xs[0] - 3} y1={24} x2={xs[xs.length - 1] - 2} y2={24} stroke={color} strokeWidth={1.2} strokeDasharray="2,2" />
            )}
          </>
        );
      }

      case 'ISOLATOR_1P':
      case 'ISOLATOR_2P':
      case 'ISOLATOR_3P':
      case 'ISOLATOR_4P': {
        const count = type === 'ISOLATOR_1P' ? 1 : type === 'ISOLATOR_2P' ? 2 : type === 'ISOLATOR_3P' ? 3 : 4;
        const xs = getXs(count);
        return (
          <>
            {xs.map((x, i) => (
              <g key={i}>
                <line x1={x} y1={6} x2={x} y2={14} stroke={color} strokeWidth={sw} />
                <line x1={x - 3} y1={14} x2={x + 3} y2={14} stroke={color} strokeWidth={sw} />
                <line x1={x - 5} y1={17} x2={x} y2={33} stroke={color} strokeWidth={sw} />
                <line x1={x} y1={33} x2={x} y2={44} stroke={color} strokeWidth={sw} />
              </g>
            ))}
            {/* Manual handle on left */}
            <polyline
              points={`${xs[0] - 8},21 ${xs[0] - 5},21 ${xs[0] - 5},27 ${xs[0] - 2},27`}
              fill="none"
              stroke={color}
              strokeWidth={1.3}
            />
            <line
              x1={xs[0] - 3}
              y1={24}
              x2={xs[xs.length - 1] - 2}
              y2={24}
              stroke={color}
              strokeWidth={1.2}
              strokeDasharray="2,2"
            />
          </>
        );
      }

      case 'MCB_1P':
      case 'MCB_2P':
      case 'MCB_3P':
      case 'MCB_4P': {
        const count = type === 'MCB_1P' ? 1 : type === 'MCB_2P' ? 2 : type === 'MCB_3P' ? 3 : 4;
        const xs = getXs(count);
        return (
          <>
            {xs.map((x, i) => (
              <g key={i}>
                <line x1={x} y1={6} x2={x} y2={14} stroke={color} strokeWidth={sw} />
                {/* Trip X cross */}
                <line x1={x - 2.5} y1={11.5} x2={x + 2.5} y2={16.5} stroke={color} strokeWidth={1.3} />
                <line x1={x + 2.5} y1={11.5} x2={x - 2.5} y2={16.5} stroke={color} strokeWidth={1.3} />
                <line x1={x - 5} y1={17} x2={x} y2={33} stroke={color} strokeWidth={sw} />
                <line x1={x} y1={33} x2={x} y2={44} stroke={color} strokeWidth={sw} />
              </g>
            ))}
            {count > 1 && (
              <line x1={xs[0] - 3} y1={24} x2={xs[xs.length - 1] - 2} y2={24} stroke={color} strokeWidth={1.2} strokeDasharray="2,2" />
            )}
          </>
        );
      }

      case 'MCCB_1P':
      case 'MCCB_2P':
      case 'MCCB_3P':
      case 'MCCB_4P': {
        const count = type === 'MCCB_1P' ? 1 : type === 'MCCB_2P' ? 2 : type === 'MCCB_3P' ? 3 : 4;
        const xs = getXs(count);
        return (
          <>
            {xs.map((x, i) => (
              <g key={i}>
                <line x1={x} y1={6} x2={x} y2={14} stroke={color} strokeWidth={sw} />
                <line x1={x - 2.5} y1={11.5} x2={x + 2.5} y2={16.5} stroke={color} strokeWidth={1.3} />
                <line x1={x + 2.5} y1={11.5} x2={x - 2.5} y2={16.5} stroke={color} strokeWidth={1.3} />
                <line x1={x - 5} y1={17} x2={x} y2={33} stroke={color} strokeWidth={sw} />
                {/* Thermal step */}
                <polyline points={`${x - 6},20 ${x - 8},20 ${x - 8},23 ${x - 4},23`} fill="none" stroke={color} strokeWidth={1.1} />
                {/* Magnetic > */}
                <polyline points={`${x - 6},26 ${x - 3},28 ${x - 6},30`} fill="none" stroke={color} strokeWidth={1.2} />
                <line x1={x} y1={33} x2={x} y2={44} stroke={color} strokeWidth={sw} />
              </g>
            ))}
            {count > 1 && (
              <line x1={xs[0] - 3} y1={24} x2={xs[xs.length - 1] - 2} y2={24} stroke={color} strokeWidth={1.2} strokeDasharray="2,2" />
            )}
          </>
        );
      }

      case 'MAG_CB_1P':
      case 'MAG_CB_2P':
      case 'MAG_CB_3P':
      case 'MAG_CB_4P': {
        const count = type === 'MAG_CB_1P' ? 1 : type === 'MAG_CB_2P' ? 2 : type === 'MAG_CB_3P' ? 3 : 4;
        const xs = getXs(count);
        return (
          <>
            {xs.map((x, i) => (
              <g key={i}>
                <line x1={x} y1={6} x2={x} y2={14} stroke={color} strokeWidth={sw} />
                <line x1={x - 2.5} y1={11.5} x2={x + 2.5} y2={16.5} stroke={color} strokeWidth={1.3} />
                <line x1={x + 2.5} y1={11.5} x2={x - 2.5} y2={16.5} stroke={color} strokeWidth={1.3} />
                <line x1={x - 5} y1={17} x2={x} y2={33} stroke={color} strokeWidth={sw} />
                {/* Magnetic > only */}
                <polyline points={`${x - 6},25 ${x - 3},27 ${x - 6},29`} fill="none" stroke={color} strokeWidth={1.3} />
                <line x1={x} y1={33} x2={x} y2={44} stroke={color} strokeWidth={sw} />
              </g>
            ))}
            {count > 1 && (
              <line x1={xs[0] - 3} y1={24} x2={xs[xs.length - 1] - 2} y2={24} stroke={color} strokeWidth={1.2} strokeDasharray="2,2" />
            )}
          </>
        );
      }

      case 'CONTACTOR_1P':
      case 'CONTACTOR_2P':
      case 'CONTACTOR_3P':
      case 'CONTACTOR_4P': {
        const count = type === 'CONTACTOR_1P' ? 1 : type === 'CONTACTOR_2P' ? 2 : type === 'CONTACTOR_3P' ? 3 : 4;
        const xs = getXs(count);
        return (
          <>
            {xs.map((x, i) => (
              <g key={i}>
                <line x1={x} y1={5} x2={x} y2={15} stroke={color} strokeWidth={sw} />
                <line x1={x - 5} y1={15} x2={x} y2={32} stroke={color} strokeWidth={sw} />
                <line x1={x} y1={32} x2={x} y2={43} stroke={color} strokeWidth={sw} />
              </g>
            ))}
            {count > 1 && (
              <line x1={xs[0] - 3} y1={23} x2={xs[xs.length - 1] - 2} y2={23} stroke={color} strokeWidth={1.2} strokeDasharray="2,2" />
            )}
          </>
        );
      }

      case 'SWITCH_2P':
      case 'SWITCH_3P': {
        const count = type === 'SWITCH_2P' ? 2 : 3;
        const xs = getXs(count);
        return (
          <>
            {xs.map((x, i) => (
              <g key={i}>
                <line x1={x} y1={5} x2={x} y2={15} stroke={color} strokeWidth={sw} />
                <circle cx={x} cy={15} r={1.8} fill={color} />
                <line x1={x - 5} y1={17} x2={x} y2={32} stroke={color} strokeWidth={sw} />
                <line x1={x} y1={32} x2={x} y2={43} stroke={color} strokeWidth={sw} />
              </g>
            ))}
            <line x1={xs[0] - 3} y1={24} x2={xs[xs.length - 1] - 2} y2={24} stroke={color} strokeWidth={1.2} strokeDasharray="2,2" />
          </>
        );
      }

      case 'MOTOR_3P_V':
      case 'MOTOR_3P_6T':
        return (
          <>
            <line x1={16} y1={4} x2={16} y2={14} stroke={color} strokeWidth={sw} />
            <line x1={24} y1={4} x2={24} y2={12} stroke={color} strokeWidth={sw} />
            <line x1={32} y1={4} x2={32} y2={14} stroke={color} strokeWidth={sw} />
            <circle cx={24} cy={24} r={12} fill="none" stroke={color} strokeWidth={sw} />
            <text x={24} y={24} fontSize={10} fontWeight="bold" textAnchor="middle" fill={color}>M</text>
            <text x={24} y={32} fontSize={6.5} fontWeight="bold" textAnchor="middle" fill={color}>3~</text>
            {type === 'MOTOR_3P_6T' && (
              <>
                <line x1={16} y1={34} x2={16} y2={44} stroke={color} strokeWidth={sw} />
                <line x1={24} y1={36} x2={24} y2={44} stroke={color} strokeWidth={sw} />
                <line x1={32} y1={34} x2={32} y2={44} stroke={color} strokeWidth={sw} />
              </>
            )}
          </>
        );

      case 'HEATER_1P':
      case 'HEATER_3P': {
        const xs = getXs(type === 'HEATER_1P' ? 1 : 3);
        return xs.map((x, i) => (
          <g key={i}>
            <line x1={x} y1={4} x2={x} y2={12} stroke={color} strokeWidth={sw} />
            <rect x={x - 3.5} y={12} width={7} height={24} fill="none" stroke={color} strokeWidth={sw} />
            <line x1={x} y1={36} x2={x} y2={44} stroke={color} strokeWidth={sw} />
          </g>
        ));
      }

      case 'RCD_2P':
      case 'RCD_4P': {
        const count = type === 'RCD_2P' ? 2 : 4;
        const xs = count === 2 ? [20, 34] : [17, 25, 33, 41];
        return (
          <>
            {/* Differential relay box on left */}
            <rect x={5} y={12} width={7} height={7} fill="none" stroke={color} strokeWidth={1.2} />
            <line x1={8.5} y1={12} x2={8.5} y2={19} stroke={color} strokeWidth={1} />
            <line x1={5} y1={15.5} x2={12} y2={15.5} stroke={color} strokeWidth={1} />
            <line x1={12} y1={15.5} x2={xs[xs.length - 1] - 2} y2={15.5} stroke={color} strokeWidth={1.1} strokeDasharray="2,2" />
            <polyline points={`8.5,19 8.5,34 ${xs[0] - 3},34`} fill="none" stroke={color} strokeWidth={1.1} strokeDasharray="2,2" />
            {/* Toroidal coil oval */}
            <ellipse cx={(xs[0] + xs[xs.length - 1]) / 2} cy={34} rx={(xs[xs.length - 1] - xs[0]) / 2 + 4} ry={4} fill="none" stroke={color} strokeWidth={1.3} />
            {xs.map((x, i) => (
              <g key={i}>
                <line x1={x} y1={5} x2={x} y2={12} stroke={color} strokeWidth={sw} />
                <line x1={x - 4} y1={13} x2={x} y2={26} stroke={color} strokeWidth={sw} />
                <line x1={x} y1={26} x2={x} y2={44} stroke={color} strokeWidth={sw} />
              </g>
            ))}
          </>
        );
      }

      case 'RCBO_1PN':
      case 'RCBO_2P':
      case 'RCBO_3P':
      case 'RCBO_4P': {
        const count = type === 'RCBO_1PN' || type === 'RCBO_2P' ? 2 : type === 'RCBO_3P' ? 3 : 4;
        const xs = count === 2 ? [20, 34] : count === 3 ? [18, 28, 38] : [16, 24, 32, 40];
        return (
          <>
            {/* Differential relay box on left */}
            <rect x={5} y={11} width={7} height={7} fill="none" stroke={color} strokeWidth={1.2} />
            <line x1={8.5} y1={11} x2={8.5} y2={18} stroke={color} strokeWidth={1} />
            <line x1={5} y1={14.5} x2={12} y2={14.5} stroke={color} strokeWidth={1} />
            <line x1={12} y1={14.5} x2={xs[xs.length - 1] - 2} y2={14.5} stroke={color} strokeWidth={1.1} strokeDasharray="2,2" />
            <polyline points={`8.5,18 8.5,33 ${xs[0] - 4},33`} fill="none" stroke={color} strokeWidth={1.1} strokeDasharray="2,2" />

            {/* [I>] trip box */}
            <rect x={xs[0] - 4} y={28} width={xs[xs.length - 1] - xs[0] + 8} height={9} fill="none" stroke={color} strokeWidth={1.2} />
            <text x={(xs[0] + xs[xs.length - 1]) / 2} y={35} fontSize={6.5} fontWeight="bold" textAnchor="middle" fill={color}>
              I&gt;
            </text>

            {xs.map((x, i) => (
              <g key={i}>
                <line x1={x} y1={5} x2={x} y2={11} stroke={color} strokeWidth={sw} />
                <line x1={x - 4} y1={12} x2={x} y2={24} stroke={color} strokeWidth={sw} />
                <line x1={x} y1={24} x2={x} y2={28} stroke={color} strokeWidth={sw} />
                <line x1={x} y1={37} x2={x} y2={44} stroke={color} strokeWidth={sw} />
              </g>
            ))}
          </>
        );
      }

      default:
        return null;
    }
  };

  return (
    <svg width={size} height={size} viewBox="0 0 48 48" style={{ display: 'block' }}>
      {renderInner()}
    </svg>
  );
};
