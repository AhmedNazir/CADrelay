import type { CanvasComponent, ComponentType } from '../store/canvasStore';

const COIL_TYPES = new Set<ComponentType>(['COIL', 'COIL_SET', 'COIL_RESET']);
const STANDARD_CONTACT_TYPES = new Set<ComponentType>(['NO_CONTACT', 'NC_CONTACT']);
const TIMER_CONTACT_TYPES = new Set<ComponentType>(['TIMER_NO_CONTACT', 'TIMER_NC_CONTACT']);

const FIXED_LABELS: Partial<Record<ComponentType, string>> = {
  POWER_AC_N: 'N',
  POWER_DC_POS: '+DC',
  POWER_DC_NEG: '-DC',
  POWER_DC_PE: 'DC GND',
  POWER_AC_1P_N: '1~+N',
  POWER_AC_3P: '3~ AC',
  POWER_AC_3P_N: '3~+N',
  POWER_AC_3P_N_PE: '3~+N+PE',
};

function tagFamily(type: ComponentType): string | null {
  if (type.startsWith('POWER_RAIL_')) return type.replace('POWER_RAIL_', '');
  if (type === 'DC_BATTERY') return 'BAT';
  if (type === 'INVERTER_1P' || type === 'INVERTER_3P') return 'INV';
  if (type === 'GENERATOR_3P') return 'G';
  if (type === 'PHASE_FAILURE') return 'PF';
  if (type.startsWith('FUSE_DISC_')) return 'FD';
  if (type.startsWith('FUSE')) return 'FU';
  if (type.startsWith('OVERLOAD_') || type === 'THERMAL_OVERLOAD') return 'FR';
  if (type.startsWith('ISOLATOR_')) return 'QS';
  if (
    type === 'CIRCUIT_BREAKER' ||
    /^(MCB|MCCB|MAG_CB|RCD|RCBO)_/.test(type)
  ) return 'QF';
  if (
    type.startsWith('CONTACTOR_') ||
    COIL_TYPES.has(type) ||
    STANDARD_CONTACT_TYPES.has(type)
  ) return 'KM';
  if (type.startsWith('SWITCH_')) return 'SA';
  if (type.startsWith('HEATER_')) return 'EH';
  if (type.startsWith('PUSHBUTTON_')) return 'SB';
  if (type === 'EMERGENCY_STOP') return 'SB';
  if (type.startsWith('TIMER_')) return 'KT';
  if (type.startsWith('MOTOR_')) return 'M';
  if (type === 'LAMP' || type === 'LAMP_AC' || type === 'LAMP_DC') return 'HL';
  if (type === 'BUZZER') return 'BZ';
  return null;
}

function familyTags(prefix: string, components: CanvasComponent[]): string[] {
  const pattern = new RegExp(`^${prefix}(\\d+)\\b`, 'i');
  return components
    .map((component) => component.label?.trim() ?? '')
    .filter((label) => pattern.test(label));
}

function nextTag(prefix: string, components: CanvasComponent[]): string {
  const pattern = new RegExp(`^${prefix}(\\d+)\\b`, 'i');
  const highest = components.reduce((max, component) => {
    const match = pattern.exec(component.label?.trim() ?? '');
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  return `${prefix}${highest + 1}${prefix === 'INV' ? '~' : ''}`;
}

function relevantTypes(type: ComponentType): (componentType: ComponentType) => boolean {
  if (STANDARD_CONTACT_TYPES.has(type) || type.startsWith('CONTACTOR_')) {
    return (candidate) =>
      COIL_TYPES.has(candidate) ||
      candidate.startsWith('CONTACTOR_') ||
      STANDARD_CONTACT_TYPES.has(candidate);
  }
  if (TIMER_CONTACT_TYPES.has(type)) {
    return (candidate) =>
      candidate === 'TIMER_TON' ||
      candidate === 'TIMER_TOF' ||
      TIMER_CONTACT_TYPES.has(candidate);
  }
  if (type === 'THERMAL_OVERLOAD') {
    return (candidate) => candidate.startsWith('OVERLOAD_') || candidate === 'THERMAL_OVERLOAD';
  }
  return () => false;
}

export function getTagSuggestions(
  type: ComponentType,
  components: CanvasComponent[],
): string[] {
  const isAuxiliary =
    STANDARD_CONTACT_TYPES.has(type) ||
    TIMER_CONTACT_TYPES.has(type) ||
    type.startsWith('CONTACTOR_') ||
    type === 'THERMAL_OVERLOAD';
  if (!isAuxiliary) return [];

  const related = relevantTypes(type);
  return Array.from(
    new Set(
      components
        .filter((component) => related(component.type))
        .map((component) => component.label?.trim() ?? '')
        .filter(Boolean),
    ),
  );
}

function unclaimedFamilyTag(
  prefix: string,
  driverTypes: (type: ComponentType) => boolean,
  auxiliaryTypes: (type: ComponentType) => boolean,
  components: CanvasComponent[],
): string | undefined {
  const claimed = new Set(
    components
      .filter((component) => driverTypes(component.type))
      .map((component) => component.label?.trim())
      .filter((label): label is string => Boolean(label)),
  );
  const matchingAuxiliaryTags = familyTags(
    prefix,
    components.filter((component) => auxiliaryTypes(component.type)),
  );
  return matchingAuxiliaryTags.find((tag) => !claimed.has(tag));
}

export function getDefaultComponentTag(
  type: ComponentType,
  components: CanvasComponent[],
): string {
  if (type.startsWith('POWER_RAIL_')) return type.replace('POWER_RAIL_', '');
  const fixed = FIXED_LABELS[type];
  if (fixed) return fixed;

  const prefix = tagFamily(type);
  if (!prefix) return type;

  const suggestions = getTagSuggestions(type, components);
  if (suggestions.length > 0) return suggestions[suggestions.length - 1];

  if (prefix === 'KM') {
    const unclaimed = unclaimedFamilyTag(
      prefix,
      (candidate) => COIL_TYPES.has(candidate),
      (candidate) => STANDARD_CONTACT_TYPES.has(candidate) || candidate.startsWith('CONTACTOR_'),
      components,
    );
    if (unclaimed) return unclaimed;
  } else if (prefix === 'KT') {
    const unclaimed = unclaimedFamilyTag(
      prefix,
      (candidate) => candidate === 'TIMER_TON' || candidate === 'TIMER_TOF',
      (candidate) => TIMER_CONTACT_TYPES.has(candidate),
      components,
    );
    if (unclaimed) return unclaimed;
  } else if (prefix === 'FR') {
    const unclaimed = unclaimedFamilyTag(
      prefix,
      (candidate) => candidate.startsWith('OVERLOAD_'),
      (candidate) => candidate === 'THERMAL_OVERLOAD',
      components,
    );
    if (unclaimed) return unclaimed;
  }

  return nextTag(prefix, components);
}
